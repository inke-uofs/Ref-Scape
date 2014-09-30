var _ = require('underscore')
  , $ = require('jQuery')
  , util = require('util')
  , d3 = require('d3')
  , angular = require('angular')
;

function getOrAppend(parent, selector) {
  var target = parent.select(selector);
  if (target.empty()) {
    target = parent.append(selector);
  }
  return target;
}

exports.board = ['Zotero', function(Zotero) {
  function linkFn(scope, element, attrs) {
    var angle
      , index = 0
      , $el = $(element)
      , width = $el.width() - 1
      , height = $el.height() - 1
      , size = {width: width, height: height}
      , svg = getOrAppend(d3.select(element[0]), 'svg').attr(size)
      , node = svg.selectAll('.node')
      , link = svg.selectAll('.link')
      , force = d3.layout.force()
    ;
    force.gravity(0).linkStrength(0.2).size(size)
      .charge(function(d){ 
        if (d.type !== 'item') {
          return 0;
        }
        return -((d.links || []).length * 13 + 10);
      })
      .on('tick', function(e){
        link.attr({
          x1: function(d) {return d.source.x;},
          y1: function(d) {return d.source.y;},
          x2: function(d) {return d.target.x;},
          y2: function(d) {return d.target.y;},
        });
        node.attr({
          cx: function(d) {return Math.min(width, d.x);},
          cy: function(d) {return Math.min(height, d.y);}
        });
      })
    ;

    var lineData = [null, [0,0]];
    var line = svg.append('path', '.helper-line');
    var lineFn = d3.svg.line()
      .x(function(d) { return d[0]; })
      .y(function(d) { return d[1]; })
      .interpolate('linear');

    var $contextMenu = $('#context-menu');
    $contextMenu.find('a').click(function(){ 
      var selected = d3.selectAll('.selected');
      selected.each(function(d){
        lineData[0] = [d.x, d.y];
      });
      $contextMenu.addClass('hide');
    });

    node.on('mousedown', function(){
    });

    svg.on('mousemove', function(evt){
      if (lineData[0]) {
        var position = d3.mouse(this);
        lineData[1] = position;
        line.attr('d', lineFn(lineData));
      }
    });

    svg.on('mousedown', function(evt){
      var target = d3.select(d3.event.target);
      var selected = d3.selectAll('.selected');
      if (lineData[0]) {
        if (target.classed('item')) {
          var source = null;
          var linkedItem = null;
          selected.each(function(d){
            source = d;
          });
          target.each(function(d){
            linkedItem = d;
          });
          if (source && linkedItem) {
            Zotero.addLink(source, linkedItem);
          }
        }
        selected.classed('selected', false);
        line.attr('d', lineFn([[0,0], [0,0]]));
        lineData[0] = null;
      }
      if (target.classed('item')) {
        target.each(function(d){
          Zotero.selectItem(d);
        });
      }
      $contextMenu.addClass('hide');
    });

    svg.on('contextmenu', function(){
      var target = d3.select(d3.event.target);
      if (target.classed('item')) {
        var position = d3.mouse(this);
        d3.selectAll('.selected').classed('selected', false);
        target.classed('selected', true);
        $contextMenu.css({
          left: position[0],
          top: position[1],
        }).removeClass('hide');
      }
      d3.event.preventDefault();
    });

    function restart(evt, args) {
      var data = args || scope
        , nodes = data.nodes
        , links = data.links
        , width = $el.width() - 1
        , height = $el.height() - 1
        , center = {x: width/2, y: height/2}
        , r = _.min([width, height])/4
      ;
      _.each(nodes, function(node){
        var angle = node.angle;
        _.defaults(node, center);
        if (angle) {
          _.extend(node, {
            x: center.x - Math.cos(angle) * r,
            y: center.y + Math.sin(angle) * r,
          });
        }
      });

      force.nodes(nodes).links(links);

      link = link.data([]);
      link.exit().remove();
      link = link.data(links);
      link.enter().insert('line', '.node').attr({
        class: function(d){ return 'link ' + d.class; }
      });
      link.exit().remove();

      node = node.data([]);
      node.exit().remove();
      node = node.data(nodes);
      node.enter().insert('circle', '.node').attr({
        r: function(d) {
          return (d.links || []).length * 1.5 + 5;
        },
        class: function(d){ return 'node ' + d.class + ' ' + d.name;},
      }).style('fill', function(d){
        return d.fill;
      }).call(force.drag);
      node.exit().remove();

      force.start();
    }

    restart();
    scope.$on('board-update', restart);
    scope.$on('selected-group', function(evt, group){
      $('.match').removeClass('match');
      node.attr({
        class: function(d) {
          var cls = '';
          if (d.fill === group.color) {
            cls = ' match';
          }
          return 'node ' + d.class + ' ' + d.name + cls;
        }
      });
    });
    scope.$on('search', function(evt, matches){
      $('.match').removeClass('match');
      if (matches) {
        node.attr({
          class: function(d) {
            var cls = '';
            var found = _.find(matches, function(match){
              return d.key === match;
            });
            if (found) {
              cls = ' match';
            }
            return 'node ' + d.class + ' ' + d.name + cls;
          }
        });
      }
    });
  }
  return {
    restrict: 'A',
    scope: {
      nodes: '=',
      links: '=',
    },
    link: linkFn,
  };
}];


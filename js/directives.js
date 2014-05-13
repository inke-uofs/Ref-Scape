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

exports.board = [function() {
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
        return -((d.links || []).length * 10 + 10);
      })
      .on('tick', function(e){
        link.attr({
          x1: function(d) {return d.source.x;},
          y1: function(d) {return d.source.y;},
          x2: function(d) {return d.target.x;},
          y2: function(d) {return d.target.y;},
        });
        node.attr({
          cx: function(d) {return d.x;},
          cy: function(d) {return d.y;}
        });
      })
    ;

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

      link = link.data(links);
      link.enter().insert('line', '.node').attr({
        class: function(d){ return 'link ' + d.class; }
      });
      link.exit().remove();

      node = node.data(nodes);
      node.enter().insert('circle', '.node').attr({
        r: function(d) {
          return (d.links || []).length * 2 + 5;
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

/*
exports.d3 = ['$http', function($http){
  function renderItems(nodes, links){
    var users = Zotero.getObjects('user')
      , items = Zotero.getObjects('item')
      , angle = Math.PI * 2 / _.keys(users).length
      , i = 0
    ;
    _.each(users, function(user){
      nodes.push(_.extend(user, {
        x: center.x - Math.cos(angle * i) * r,
        y: center.y + Math.sin(angle * i) * r,
        fixed: true,
        type: 'user',
      }));
      i += 1;
    });
    _.each(items, function(item){
      nodes.push(_.extend(item, center, {type: 'item',}));
      links.push({
        source: item, target: users[item.user], type: 'user item'
      });
      if (item.target) {
        var target = items[item.target]
          , link = {
            source: item, target: target, type: 'item item'
          }
        ;
        item.links || (item.links = []);
        item.links.push(link);
        target.links || (target.links = []);
        target.links.push(link);
        links.push(link);
      }
    });
  }


      renderItems(nodes, links);


  // constants
  var 
  fill = d3.scale.category20(),
  force = d3.layout.force().charge(function(d){
    return -((d.links || []).length * 10 + 10);
  }).linkStrength(0.2).gravity(0);

  return {
    restrict: 'AE',
    scope: {
      items: '=',
      users: '=',
    },
    link: function (scope, element, attrs) {
      var angle
        , index = 0
        , users = scope.users
        , items = scope.items
        , nodes = force.nodes()
        , links = force.links()
        , $el = $(element)
        , width = $el.width() - 1
        , height = $el.height() - 1
        , center = {x: width/2, y: height/2}
        , r = _.min([width, height])/4
        , size = {width: width, height: height}
        , svg = getOrAppend(d3.select(element[0]), 'svg').attr(size)
        , board = getOrAppend(svg, 'rect').attr(size)
        , node = svg.selectAll('.node')
        , link = svg.selectAll('.link')
      ;

      force.nodes(nodes).links(links).size(size).
        on('tick', function(e){
        link.attr({
          x1: function(d) {return d.source.x;},
          y1: function(d) {return d.source.y;},
          x2: function(d) {return d.target.x;},
          y2: function(d) {return d.target.y;},
        });
        node.attr({
          cx: function(d) {return d.x;},
          cy: function(d) {return d.y;}
        });
      });

      node.on('click', function(){

      });

      function restart() {
        link = link.data(links);
        link.enter().insert('line', '.node').attr({
          class: function(d){ return 'link ' + d.type; }
        });

        node = node.data(nodes);

        node.enter().insert('circle', '.node').attr({
          r: function(d) {
            return (d.links || []).length * 2 + 5;
          },
          class: function(d){ return 'node ' + d.type;},
        }).style('fill', function(d){
          return d.type === 'item' ? users[d.user].color : '';
        }).call(force.drag);

        force.start();
      }

      function addNode(node) {
        node.index = nodes.length;
        nodes.push(node);
        return node;
      }

      function renderItems(rows){
        var targets = {};

        _.each(rows, function(item){
          item = _.extend(item, center, {type: 'item'});
          var username = item.user
            , target = item.target
            , user
          ;
          items[item.key] = item;
          addNode(item);
          user = users[username];
          if (!user){
            user = addNode({});
            users[username] = user;
          }
          user.name = username;
          user.color = fill(username);
          links.push({
            source: item.index, target: user.index, type: 'user item'
          });
          if (target) {
            targets[item.key] = target;
          }
        });

        _.each(targets, function(targetKey, sourceKey){
          var source = items[sourceKey]
            , target = items[targetKey]
            , link
          ;
          if (source && target) {
            link = {
              source: source.index, target: target.index, type: 'item item'
            };
            links.push(link);
            source.links || (source.links = []);
            target.links || (target.links = []);
            source.links.push(link);
            target.links.push(link);
          }
        });

        var angle = Math.PI * 2 / _.keys(users).length;
        _.each(_.values(users), function(user, i){
          _.extend(user, {
            x: center.x - Math.cos(angle * i) * r,
            y: center.y + Math.sin(angle * i) * r,
            fixed: true,
            type: 'user',
          });
        });
        restart();
      }

      scope.$watch('items', function(items){
        renderItems(items);
      });

      zotero.sync(function(){
        zotero.getItems(renderItems);
      });

    }
  };
}];
*/

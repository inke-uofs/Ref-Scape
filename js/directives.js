var _ = require('underscore')
  , $ = require('jQuery')
  , util = require('util')
  , d3 = require('d3')
  , angular = require('angular')
  , zotero = require('./zotero')
;

function getOrAppend(parent, selector) {
  var target = parent.select(selector);
  if (target.empty()) {
    target = parent.append(selector);
  }
  return target;
}

exports.d3 = ['$http', function($http){
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


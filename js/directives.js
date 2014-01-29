var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
d3 = require('d3'),
angular = require('angular'),
URI = require('URIjs');

var Request = function(data, callback) {
  var self = this, 
  request = document.createTextNode(JSON.stringify(data));

  this.callback = callback;
  this.request = request;

  request.addEventListener("zotero-response",
                           angular.bind(this, this.onResponse), false);
  document.head.appendChild(request); 
};

Request.prototype.send = function() {
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent("zotero-request", true, false);
  this.request.dispatchEvent(evt);
};

Request.prototype.cleanRequest = function() {
  var request = this.request;
  this.request = null;
  request.parentNode.removeChild(request);
};

Request.prototype.onResponse = function(evt) {
  this.callback(JSON.parse(evt.target.nodeValue));
  this.cleanRequest();
};

var Observer = function(data, callback) {
  Request.call(this, {type: 'registerObserver', data: data}, callback);
};

util.inherits(Observer, Request);

Observer.prototype.register = function() {
  this.send();
};

Observer.prototype.unregister = function() {
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent("unregist", true, false);
  this.request.dispatchEvent(evt);
  this.cleanRequest();
};

Observer.prototype.onResponse = function(evt) {
  this.callback(JSON.parse(evt.target.nodeValue));
};



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
  force = d3.layout.force().charge(-10).linkStrength(0.2).gravity(0);

  return {
    restrict: 'AE',
    scope: {width: '=', height: '='},
    link: function (scope, element, attrs) {
      var
      angle,
      width = scope.width,
      height = scope.height,
      center = {x: width/2, y: height/2},
      r = _.min([width, height])/4,
      index = 0,
      users = {},
      items = {},
      nodes = force.nodes(),
      links = force.links(),
      size = {width: width, height: height},
      svg = getOrAppend(d3.select(element[0]), 'svg').attr(size),
      board = getOrAppend(svg, 'rect').attr(size),
      node = svg.selectAll('.node'),
      link = svg.selectAll('.link');

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
        }).style('fill', function(d){return fill(d.user);}).call(force.drag);

        force.start();
      }


      var groupID = 214824;
      var server_uri = new URI('https://api.zotero.org/groups/' + groupID)
      server_uri.addQuery({
        key: 'qBvcuulbebWanSPiPurAuM9K',
        content: 'none',
      });

      var api = {
        get: function (segment, querys) {
          var url = server_uri.clone().segment(segment).addQuery(querys);
          return $http.get(url.normalize().toString());
        },
      };

      api.get('items', {}).success(function(data, status, headers, config){
        var keys = [];
        _.each($(data).find('>entry'), function(entry){
          var $entry = $(entry),
          username = $entry.find('>author>name').text(),
          key = $entry.find('>zapi\\:key').text();

          if (!(username in users)) {
            var user = {name: username, uri: $entry.find('>author>uri').text()};
            users[username] = user;
          }
          items[key] = {user: username, key: key};
          keys.push('\''+key+'\'');
        });

        angle = Math.PI * 2 / _.keys(users).length;
        _.each(_.values(users), function(user, i){
          _.extend(user, {
            x: center.x - Math.cos(angle * i) * r,
            y: center.y + Math.sin(angle * i) * r,
            fixed: true,
            type: 'user',
          });
          user.index = nodes.length;
          nodes.push(user);
        });

        var request = new Request({
          type: 'db', database: 'cobib', data: 
            'select * from sync where groupID = \'' + groupID + '\''
        }, function(response){
          console.log('----------------');
          console.log(response);
        });
        request.send();

        var query = 'select * from items where key in (' + keys.join(', ') + ')';
        var request = new Request({
          type: 'db', database: 'zotero', data: query
        }, function(response){
          _.each(response, function(item){
            var item = _.extend(items[item.key], item, center, {type: 'item'});
            var user = users[item.user];
            item.index = nodes.length;
            nodes.push(item);
            if (user) {
              links.push({
                source: item.index, target: user.index, type: 'user item'
              });
            }
          });
          restart();
        });
        request.send();

        var r2 = new Request({
          type: 'db',  database: 'zotero', data: 
            'SELECT source.key as source, target.key as target ' +
            'FROM itemSeeAlso link ' + 
            'JOIN items source on link.itemID = source.itemID ' +
            'JOIN items target on link.linkedItemID = target.itemID'
        }, function(response){
          _.each(response, function(link){
            var 
            source = items[link.source],
            target = items[link.target];
            if (source && target) {
              links.push({
                source: source.index, target: target.index, type: 'item item'
              });
            }
          });
          restart();
        });
        r2.send();

      });

      /*
         var observer = new Observer(['item'], function(){
         log += JSON.stringify(arguments);
         element.text(log);
         });
         observer.register();*/
    }
  };
}];


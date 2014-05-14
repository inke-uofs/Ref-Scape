var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
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
  if (this.callback) {
    this.callback(JSON.parse(evt.target.nodeValue));
  }
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

var groupID = 214824;
var server_uri = new URI('https://api.zotero.org/groups/' + groupID);
var oauth_key = 'qBvcuulbebWanSPiPurAuM9K';
server_uri.addQuery({
  key: oauth_key,
  content: 'none',
});

var _get = function(url) {
  var uri = new URI(url).addQuery({key: oauth_key, content: 'none'});
  return $.get(uri.normalize().toString());
};

var _rss = function(url, entrys){
  entrys || (entrys = []);

  return _get(url).then(function(atom){
    var $atom = $(atom)
      , $next = $atom.find('>feed>link[rel="next"]')
    ;
    _.each($atom.find('>feed>entry'), function(entry){
      entrys.push(entry);
    });
    if ($next.length > 0) {
      return _rss($next.attr('href'), entrys);
    }
    return entrys;
  });
};

var rss = function(segment, querys) {
  var url = server_uri.clone().segment(segment).addQuery(querys);
  return _rss(url.normalize().toString());
};


var sync = function (callback) {
  new Request({
    type: 'db', database: 'cobib', data: 
      'SELECT * FROM sync WHERE groupID = ' + groupID
  }, function(response){
    var version = response.length > 0 ? response[0].version : 0;
    rss('items', {newer: version, limit: 100}).done(function(entrys){
      var itemUsers = [];
      _.each(entrys, function(entry){
        var $entry = $(entry)
          , username = $entry.find('>author>name').text()
          , key = $entry.find('>zapi\\:key').text()
          , v = $entry.find('>zapi\\:version').text()
        ;
        if (parseInt(v) > parseInt(version)) {
          version = v;
        }
        itemUsers.push(
          '(' + groupID + ', \'' + username + '\', \'' + key + '\')');
      });
      new Request({ 
        type: 'db', database: 'cobib', data: 
          'INSERT OR REPLACE INTO sync VALUES ('+ groupID+', '+version+')'
      }).send();
      if (itemUsers.length > 0) {
        new Request({ 
          type: 'db', database: 'cobib', data: 
            'INSERT OR REPLACE INTO itemUser (groupID, username, key) VALUES ' +
            itemUsers.join(', ')
        }, callback).send();
      }else{
        callback();
      }
    });
  }).send();
};

var getItems = function(callback) {
  new Request({ 
    type: 'db', database: 'cobib', data: 
      'SELECT username, key FROM itemUser WHERE groupID = ' + groupID
  }, function(rows){
    var itemUsers = {}
      , keys = []
    ;
    _.each(rows, function(itemUser){
      var key = itemUser.key;
      itemUsers[key] = itemUser.username;
      keys.push('\''+key+'\'');
    });

    new Request({ 
      type: 'db', database: 'zotero', data: 
        'SELECT i.key as key, i.itemID as id, target.key as linkedItem FROM items i ' +
        'LEFT OUTER JOIN itemSeeAlso link ON link.itemID = i.itemID ' +
        'LEFT OUTER JOIN items target ON link.linkedItemID = target.itemID ' +
        'WHERE i.key in (' + keys.join(',') + ')'
    }, function(items){
      _.each(items, function(item){
        item.user = itemUsers[item.key];
      });
      callback(items);
    }).send();
  }).send();
};

var getTags = function(items, callback) {
  var keys = _.keys(items);
  new Request({ 
    type: 'db', database: 'zotero', data: 
      'SELECT i.key as item, t.key as key, t.name as name  FROM tags t ' +
      'JOIN itemTags it ON it.tagID = t.tagID ' +
      'JOIN items i ON it.itemID = i.itemID ' +
      'WHERE i.key in (\'' + keys.join('\', \'') + '\')'
  }, callback).send();
};

exports.Zotero = ['$rootScope', function($rootScope){
  var _objects = {
    user: {
      /*
      'UA': {name: 'A'},
      'UB': {name: 'B'},
      'UC': {name: 'C'},
      'UD': {name: 'D'},
      */
    },
    item: {
      /*
      'IA': {name: 'hello', user: 'UA', linkedItems: ['IB'], author: 'a', key: 'IA'},
      'IB': {name: 'world', user: 'UB', linkedItems: ['ID'], author: 'b', key: 'IB'},
      'IC': {name: 'foo', user: 'UC', linkedItems: ['IA'], author: 'b', key: 'IC'},
      'ID': {name: 'bar', user: 'UC', linkedItems: ['IA'], author: 'b', key: 'ID'},
      */
    },
    author: {
      'a': {name: 'a'},
      'b': {name: 'b'},
    },
    tag: {
    },
  };

  sync(function(){
    getItems(function(rows){
      var items = Zotero.getObjects('item');
      var users = Zotero.getObjects('user');
      var tags = Zotero.getObjects('tag');
      _.each(rows, function(item){
        var cur = items[item.key];
        if (!cur) {
          cur = {};
          items[item.key] = cur;
        }
        if (item.linkedItem) {
          cur.linkedItems || (cur.linkedItems = []);
          cur.linkedItems.push(item.linkedItem);
        }
        var user = users[item.user];
        if (!user) {
          user = {};
          users[item.user] = user;
        }
        user.name = item.user;
        _.extend(cur, item, {
          type: 'item',
        });
      });
      getTags(items, function(rows){
        _.each(rows, function(tag){
          var item = items[tag.item];
          if (item) {
            item.tag = tag.key;
            tags[tag.key] = tag;
          }
        });
        $rootScope.$broadcast('zotero-update');
      });
    });
  });

  var _groupBy = 'user';

  //$rootScope.$broadcast('hello');

  var Zotero = {
    groupBy: function(by, silence){
      if (by) {
        _groupBy = by;
        if (!silence) {
          $rootScope.$broadcast('zotero-group-by', _groupBy);
        }
      }
      return _groupBy;
    },
    addLink: function(source, target) {
      var items = Zotero.getObjects('item');
      source = items[source.key];
      target = items[target.key];
      if (source && target) {
        source.linkedItems || (source.linkedItems = []);
        source.linkedItems.push(target.key);
        $rootScope.$broadcast('zotero-update');
      }
    },
    getObjects: function(model) {
      return _objects[model];
    },
    fetchUsers: function(callback) {
      var dfd = $.Deferred();
      if (callback) callback(_users);
      return dfd.resolve(users).promise(_users);
    },
    fetchItems: function(callback) {
      var dfd = $.Deferred();
      if (callback) callback(_items);
      return dfd.resolve(users).promise(_items);
    },
    selectItem: function(item) {
      new Request({ 
        type: 'zotero-pane', func: 'selectItem', data: item.id, 
      }, function(){
        console.log('cool');
      }).send();
    },
  };
  return Zotero;
}];


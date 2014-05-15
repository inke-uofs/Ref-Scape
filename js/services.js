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

var _get = function(url, oauthKey) {
  var uri = new URI(url).addQuery({key: oauthKey, content: 'none'});
  return $.get(uri.normalize().toString());
};

var _rss = function(url, oauthKey, entrys, progress){
  entrys || (entrys = []);

  return _get(url, oauthKey).then(function(atom){
    var $atom = $(atom)
      , $next = $atom.find('>feed>link[rel="next"]')
      , $total = $atom.find('>feed>zapi\\:totalResults')
    ;
    _.each($atom.find('>feed>entry'), function(entry){
      entrys.push(entry);
    });
    progress(entrys.length, $total.text());
    if ($next.length > 0) {
      return _rss($next.attr('href'), oauthKey, entrys, progress);
    }
    return entrys;
  });
};

var rss = function(groupID, oauthKey, segment, querys, progress) {
  var server_uri = new URI('https://api.zotero.org/groups/' + groupID);
  querys = _.extend({key: oauthKey, content: 'none'}, querys);
  var url = server_uri.segment(segment).addQuery(querys);
  return _rss(url.normalize().toString(), oauthKey, [], progress);
};


var sync = function (groupID, oauthKey, callback, progress) {
  new Request({
    type: 'db', database: 'cobib', data: 
      'SELECT * FROM sync WHERE groupID = ' + groupID
  }, function(response){
    var version = response.length > 0 ? response[0].version : 0;
    rss(groupID, oauthKey, 'items', {newer: version, limit: 100}, progress).
      done(function(entrys){
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
      progress(entrys.length, entrys.length, 
               'Sync Done, insert to database...');
      if (itemUsers.length > 0) {
        new Request({ 
          type: 'db', database: 'cobib', data: 
            'INSERT OR REPLACE INTO itemUser (groupID, username, key) VALUES ' + 
          itemUsers.join(', ')
        }, function(response){
          progress(entrys.length, entrys.length, 
                   ' ' + entrys.length + ' row inserted into ' + 'database');
          new Request({ 
            type: 'db', database: 'cobib', data: 
              'INSERT OR REPLACE INTO sync VALUES ('+ groupID+', '+version+')'
          }, function(response){
            progress(entrys.length, entrys.length, 
                     'current version: ' + version);
            callback(response);
          }).send();

        }).send();
      }else{
        callback();
      }
    });
  }).send();
};

var authorize = function(groupID, callback) {
  new Request({
    type: 'db', database: 'cobib', data: 
      'SELECT * FROM auth WHERE groupID = ' + groupID
  }, function(response){
    console.log(response);
    callback(response.length > 0 ? response[0].key : '');
  }).send();
};

exports.Zotero = ['$rootScope', function($rootScope){
  var _objects = {
    user: {
    },
    item: {
    },
    author: {
    },
    tag: {
    },
  };

  var uri = new URI().normalize();
  var groupID = uri.query(true).groupID;
  if (groupID.substr(-1) === '/') {
    groupID = groupID.substr(0, groupID.length - 1);
  }
  authorize(groupID, function(key) {
    if (!key) {
      $('.error').removeClass('hide');
      return;
    }
    $('.sync').show();
    sync(groupID, key, function(){
      $('.sync').hide();
      new Request({ 
        type: 'db', database: 'cobib', data: 
        'SELECT username as user, key FROM itemUser WHERE groupID = ' + groupID
      }, function(rows){
        var items = Zotero.getObjects('item');
        var users = Zotero.getObjects('user');
        var tags = Zotero.getObjects('tag');
        var authors = Zotero.getObjects('author');

        _.each(rows, function(item){
          var user = users[item.user];
          items[item.key] = item;
          item.type = 'item';
          item.fields = {};
          if (!user) {
            user = {};
            users[item.user] = user;
          }
          user.name = item.user;
        });

        var keys = '\'' +  _.keys(items).join('\', \'') + '\'';
        var requests = [];
        function addRequest(opts, callback) {

          requests.push(new Request(opts, function(rows){
            _.each(rows, callback);
            broadcast();
          }));
        }

        addRequest({ 
          type: 'db', database: 'zotero', data: 
          'SELECT i.itemID as id, i.key as key FROM items i ' +
          'WHERE i.key in (' + keys + ')'
            }, function(row){
              items[row.key].id = row.id;
            });

          addRequest({ 
            type: 'db', database: 'zotero', data: 
            'SELECT i.key as item, f.fieldName as fieldName, v.value as value ' +
            'FROM itemData d ' +
            'JOIN items i ON i.itemID = d.itemID ' +
            'JOIN fields f ON f.fieldID = d.fieldID ' +
            'JOIN itemDataValues v ON v.valueID = d.valueID ' +
            'WHERE i.key in (' + keys + ')'
              }, function(row){
                items[row.item].fields[row.fieldName] = row.value;
              });

            addRequest({ 
              type: 'db', database: 'zotero', data: 
              'SELECT i.key as source, t.key as target FROM itemSeeAlso sa ' +
              'JOIN items i ON i.itemID = sa.itemID ' +
              'JOIN items t ON t.itemID = sa.linkedItemID ' +
              'WHERE i.key in (' + keys + ') ' +
              'AND t.key in (' + keys + ') '
            }, function(row){
              var item = items[row.source];
              if (!item.linkedItems) {
                item.linkedItems = [];
              }
              item.linkedItems.push(row.target);
            });

            addRequest({ 
              type: 'db', database: 'zotero', data: 
              'SELECT i.key as item, t.key as key, t.name as name  FROM tags t ' +
              'JOIN itemTags it ON it.tagID = t.tagID ' +
              'JOIN items i ON it.itemID = i.itemID ' +
              'WHERE i.key in (' + keys + ')'
                }, function(row){
                  var item = items[row.item];
                  if (!item.tag) {
                    item.tag = [];
                  }
                  item.tag.push(row.key);
                  tags[row.key] = row;
                });

              addRequest({ 
                type: 'db', database: 'zotero', data: 
                'SELECT i.key as item, cd.firstName as firstName, ' + 
                'cd.lastName as lastName, c.key as key ' + 
                'FROM itemCreators ic ' +
                'JOIN creators c ON c.creatorID = ic.creatorID ' +
                'JOIN creatorTypes ct ON ct.creatorTypeID = ic.creatorTypeID ' +
                'JOIN creatorData cd ON cd.creatorDataID = c.creatorDataID ' +
                'JOIN items i ON ic.itemID = i.itemID ' +
                'WHERE i.key in (' + keys + ') ' +
                'AND ct.creatorType = \'author\' '
              }, function(row){
                var item = items[row.item];
                if (!item.author) {
                  item.author = [];
                }
                item.author.push(row.key);
                authors[row.key] = row;
                row.name = row.firstName + ' ' + row.lastName;
              });


              var broadcast = _.after(requests.length, function(){
                $rootScope.$broadcast('zotero-update');
              });
              _.each(requests, function(r){
                r.send();
              });
      }).send();
    }, function(current, total, msg){
      $('.init').hide();
      $('.fetching').removeClass('hide');
      $('.current').text(current);
      $('.total').text(total);
      $('.msg').text(msg);
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
        new Request({ 
          type: 'db', database: 'zotero', data: 
            'INSERT INTO itemSeeAlso VALUES ('+ source.id +', '+ target.id +')'
        }).send();
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
        type: 'zotero-pane', func: 'selectItem', data: [item.id], 
      }).send();
    },
    saveKey: function(groupID, key, callback) {
      new Request({
        type: 'db', database: 'cobib', data: 
        'INSERT OR REPLACE INTO auth VALUES ('+ groupID+', \''+key+'\')'
      }, callback).send();
    },
  };
  return Zotero;
}];

















var getItems = function(callback) {
};


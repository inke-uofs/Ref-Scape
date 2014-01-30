var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'), 
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

exports.sync = function (callback) {
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
          version = v
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
            'INSERT OR REPLACE INTO itemUser (groupID, username, key) VALUES '
          + itemUsers.join(', ')
        }, callback).send();
      }else{
        callback();
      }
    });
  }).send();
};

exports.getItems = function(callback) {
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
        'SELECT i.key as key, target.key as target FROM items i ' +
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



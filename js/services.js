var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
angular = require('angular'),
URI = require('URIjs');

exports.Zotero = ['$rootScope', function($rootScope){
  var _objects = {
    user: {
      'UA': {name: 'A'},
      'UB': {name: 'B'},
      'UC': {name: 'C'},
      'UD': {name: 'D'},
    },
    item: {
      'IA': {user: 'UA', linkedItem: 'IB', author: 'a'},
      'IB': {user: 'UB', linkedItem: 'ID', author: 'b'},
      'IC': {user: 'UC', linkedItem: 'IA', author: 'b'},
      'ID': {user: 'UC', linkedItem: 'IA', author: 'b'},
    },
    author: {
      'a': {name: 'a'},
      'b': {name: 'b'},
    },
    tag: {
      '1': {name: 'tag1'},
      '2': {name: 'tag2'},
    },
  };

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
  };
  return Zotero;
}];


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
      'IA': {user: 'UA', linkedItem: 'IB',},
      'IB': {user: 'UB', linkedItem: 'ID',},
      'IC': {user: 'UC', linkedItem: 'IA',},
      'ID': {user: 'UC', linkedItem: 'IA',},
    },
    author: {
      'a': {name: 'a'},
    },
    tag: {
      '1': {name: 'tag1'},
      '2': {name: 'tag2'},
    }
  };

  //$rootScope.$broadcast('hello');

  return {
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
}];


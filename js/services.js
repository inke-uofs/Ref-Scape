var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
angular = require('angular'),
URI = require('URIjs');

exports.Zotero = [function(){
  return {
    getItems: function() {
      var dfd = $.Deferred();
      return dfd.resolve([
        {user: 'A', target: 'bar', key: 'foo'},
        {user: 'B', target: 'world', key: 'bar'},
        {user: 'C', target: 'foo', key: 'hello'},
        {user: 'D', target: 'foo', key: 'world'},
      ]);
    }
  };
}];



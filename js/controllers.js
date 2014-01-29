var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
angular = require('angular'),
URI = require('URIjs');

exports.AppCtrl = ['$scope', function($scope){
  var 
  width = 960,
  height = 500;

  _.extend($scope, {
    width: width,
    height: height,
  });
}];



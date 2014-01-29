var 
_ = require('underscore'),
// load jquery early than angular, to make sure angular use jquery
// http://docs.angularjs.org/api/angular.element
$ = require('jQuery'), 
angular = require('angular'),
controllers = require('./controllers'),
directives = require('./directives');
require('bootstrap');

var cobibApp = angular.module('cobibApp', []);

_.each({
  controller: controllers,
  filter: {},
  directive: directives,
  factory: {},
  animation: {},
}, function(config, method) {
  _.each(config, function(args, name){
    cobibApp[method](name, args);
  });
});




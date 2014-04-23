var _ = require('underscore')
  // load jquery early than angular, to make sure angular use jquery
  // http://docs.angularjs.org/api/angular.element
  , $ = require('jQuery')
  , angular = require('angular')
  , services = require('./services')
  , controllers = require('./controllers')
  , directives = require('./directives')
;
require('bootstrap');
console.log('lib loaded');

var cobibApp = angular.module('cobibApp', []);

_.each({
  factory: services,
  controller: controllers,
  filter: {},
  directive: directives,
  animation: {},
}, function(config, method) {
  _.each(config, function(args, name){
    cobibApp[method](name, args);
  });
});




var 
_ = require('underscore'),
angular = require('angular'),
controllers = require('./controllers');
directives = require('./directives');

var cobibApp = angular.module('cobibApp', []);

_.each({
    controller: controllers,
    filter: {

    },
    directive: directives,
    factory: {

    },
    animation: {
        
    },
}, function(config, method) {
    _.each(config, function(args, name){
        cobibApp[method](name, args);
    });
});





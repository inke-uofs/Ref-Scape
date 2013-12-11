var angular = require('angular');
var cobibApp = angular.module('cobibApp', []);

cobibApp.controller('Ctrl', function($scope){
    $scope.hello = {
        world: 'foo bar',
    };
});


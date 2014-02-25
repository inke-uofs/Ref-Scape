var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
angular = require('angular'),
URI = require('URIjs');

exports.AppCtrl = ['$scope', '$http', '$q', function($scope, $http, $q){

  var 
  width = 960,
  height = 500;

  _.extend($scope, {
    width: width,
    height: height,
    foo: 'bar',
    value: 'hello',
  });
  var foo = function() {
    var dfd = $q.defer();
    setTimeout(function(){
      dfd.resolve();
    }, 200);
    return dfd.promise;
  }


  $http.get('/').then(function(){
    var p = foo();
    p.then(function(){
      console.log('here');
      $scope.value += ' success';
    });

    $scope.value += ' world';
  });

}];



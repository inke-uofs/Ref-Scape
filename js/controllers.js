var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
angular = require('angular'),
URI = require('URIjs');

exports.GroupByCtrl = ['$scope', 'Zotero', function($scope, Zotero){
  var options = [
    {name: 'User', items: Zotero.getObjects('user'),},
    {name: 'Author', items: Zotero.getObjects('author'),},
    {name: 'Tag', items: Zotero.getObjects('tag'),},
  ];

  $scope.$on('hello', function(){
    $scope.$apply();
  });

  _.extend($scope, {
    options: options,
    option: options[0],
    items: options[0].items,
    changeOption: function() {
      $scope.items = $scope.option.items;
    }
  });
}];

exports.AppCtrl = [
  '$scope', '$http', '$q', 'Zotero',
  function($scope, $http, $q, Zotero){

  var width = 960
    , height = 500
  ;

  _.extend($scope, {
    width: width,
    height: height,
    /*
    foo: 'bar',
    value: 'hello',
    */
    nodes: [],
    links: [],
  });

  setTimeout(function(){
    $scope.nodes = [{user: 'UA', linkedItem: 'IB',}];
    $scope.$apply();
  }, 1000);

  /*
  var foo = function() {
    var dfd = $q.defer();
    setTimeout(function(){
      dfd.resolve();
    }, 200);
    return dfd.promise;
  };
  Zotero.getItems().done(function(items){
    console.log('change items');
    $scope.items = items;
    $scope.value = 'hello world';
    console.log(items);
  });

  $scope.$watch('users', function(users){
    console.log(users);

  });


  $http.get('/').then(function(){
    var p = foo();
    p.then(function(){
      console.log('here');
      //$scope.value += ' success';
    });

    //$scope.value += ' world';
  });
  */

}];



var 
_ = require('underscore'),
$ = require('jQuery'), 
util = require('util'),
angular = require('angular'),
URI = require('URIjs');

exports.GroupByCtrl = ['$scope', 'Zotero', function($scope, Zotero){
  var options = [
    {name: 'User', value: 'user',},
    {name: 'Author', value: 'author',},
    {name: 'Tag', value: 'tag',},
  ];

  _.extend($scope, {
    options: options,
    option: options[0],
    changeOption: function() {
      var groupBy = Zotero.groupBy($scope.option.value);
      $scope.items = Zotero.getObjects(groupBy);
    },
  });
  $scope.changeOption();
}];

function colorGen(num) {
  var len = Math.round(Math.pow(num, 1/3))
    , gap = Math.round(0xFF / (len+1))
    , cur = gap
    , colors = []
    , results = []
    , i, j, k
  ;
  for(i=0; i<len; i++) {
    colors.push(cur.toString(16).toUpperCase());
    cur += gap;
  }
  _.each(colors, function(r){
    _.each(colors, function(g){
      _.each(colors, function(b){
        results.push('#' + r + g + b);
      });
    });
  });
  return results;
}

exports.AppCtrl = [
  '$scope', '$http', '$q', 'Zotero', 
  function($scope, $http, $q, Zotero){

  var width = 960
    , height = 500
  ;

  _.extend($scope, {
    width: width,
    height: height,
  });

  function updateBoard() {
    var nodes = []
      , links = []
      , items = Zotero.getObjects('item')
      , groupBy = Zotero.groupBy()
      , groupByItems = Zotero.getObjects(groupBy)
      , groupByIndex = 0
      , length = _.keys(groupByItems).length
      , angle = Math.PI * 2 / (length || 1)
      , colors = colorGen(length || 1)
    ;
    
    _.each(groupByItems, function(item){
      nodes.push(_.extend(item, {
        angle: angle * groupByIndex,
        class: 'hide',
        fixed: true,
        color: colors[groupByIndex],
      }));
      groupByIndex += 1;
    });
    console.log(items);
    _.each(items, function(item){
      item.links = [];
    });
    _.each(items, function(item){
      var linkedItem = item.linkedItem && items[item.linkedItem];
      var groupByItem = groupByItems[item[groupBy]];
      nodes.push(_.extend(item, {
        class: 'item', fill: groupByItem && groupByItem.color || '#000'
      }));
      links.push({
        source: item, target: groupByItem, class: 'hide'
      });
      if (linkedItem) {
        var link = {source: item, target: linkedItem, class: 'item item'};
        item.links.push(link);
        linkedItem.links.push(link);
        links.push(link);
      }
    });
    $scope.nodes = nodes;
    $scope.links = links;
    $scope.$broadcast('board-update', {
      nodes: nodes,
      links: links,
    });
  }
  updateBoard();
  $scope.$on('zotero-group-by', updateBoard);
  /*
  $rootScope.$on('zotero-item', function(items){
    $scope.nodes = items;
  });

  //$rootScope.$broadcast('zotero-item', );

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



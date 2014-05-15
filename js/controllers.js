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
  $scope.$on('zotero-update', function(){
    $scope.$apply(function(){
      $scope.changeOption();
    });
  });
}];

function colorGen(num) {
  var len = Math.ceil(Math.pow(num, 1/3))
    , gap = Math.ceil(0xFF / (len+1))
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
        if (r !== g || r !== b) {
          results.push('#' + r + g + b);
        }
      });
    });
  });
  return results;
}

exports.AppCtrl = [
  '$scope', '$http', '$q', 'Zotero', 
  function($scope, $http, $q, Zotero){

  var $groupBy = $('.sidebar tr.group-by>td>div');
  var heightLimit = $(window).height() - $('.sidebar tr.search').height();
  $groupBy.css({
    'max-height': heightLimit,
  });
  $groupBy.find('ul').css({
    'max-height': heightLimit - $groupBy.find('.group-by-options').height() - 45,
    'overflow-y': 'auto',
  });

  var width = 960
    , height = 500
  ;

  _.extend($scope, {
    width: width,
    height: height,
    key: '',
    saveKey: function(key){
      var uri = new URI().normalize();
      var groupID = uri.query(true).groupID;
      if (groupID.substr(-1) === '/') {
        groupID = groupID.substr(0, groupID.length - 1);
      }
      Zotero.saveKey(groupID, key, function(){
        window.location.reload();
      });
    }
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
    var nonegroup = {
      angle: angle * groupByIndex,
      class: 'hide',
      fixed: true,
      color: colors[groupByIndex],
    };
    nodes.push(nonegroup);

    _.each(items, function(item){
      item.links = [];
    });
    _.each(items, function(item){
      _.each(item.linkedItems, function(linkedItemKey){
        var linkedItem = items[linkedItemKey];
        if (linkedItem) {
          var link = {source: item, target: linkedItem, class: 'item item'};
          item.links.push(link);
          linkedItem.links.push(link);
          links.push(link);
        }
      });
      var itemGroupBy = item[groupBy];
      var groupByItem, grouped;
      if (itemGroupBy) {
        if (!_.isArray(itemGroupBy)) {
          itemGroupBy = [itemGroupBy];
        }
        _.each(itemGroupBy, function(key){
          groupByItem = groupByItems[key];
          if (groupByItem) {
            links.push({
              source: item, target: groupByItem, class: 'hide',
            });
            grouped = true;
          }
        });
      }
      if (!grouped) {
        links.push({
          source: item, target: nonegroup, class: 'hide',
        });
      }
      nodes.push(_.extend(item, {
        class: 'item', fill: groupByItem && groupByItem.color || '#F00'
      }));
    });
    $scope.nodes = nodes;
    $scope.links = links;
    $scope.$broadcast('board-update', {
      nodes: nodes,
      links: links,
    });
  }
  updateBoard();
  $scope.$on('zotero-update', updateBoard);
  $scope.$on('zotero-group-by', updateBoard);
  $scope.$watch('search', function(){
    var matches = [];
    var search = $scope.search;
    if (search) {
      _.each(Zotero.getObjects('item'), function(item){
        var title = item.fields.title;
        if (_.isString(title) && title.indexOf(search) > -1) {
          matches.push(item.key);
        }
      });
    }
    $scope.$broadcast('search', matches);
  });


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



var 
util = require('util'),
_ = require('underscore'),
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


var Request = function(data, callback) {
  var self = this, 
  request = document.createTextNode(JSON.stringify(data));

  this.callback = callback;
  this.request = request;

  request.addEventListener("zotero-response", 
                           _.bind(this.onResponse, this), false);
  document.head.appendChild(request);
  console.log(request.nodeValue);
};

Request.prototype.send = function() {
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent("zotero-request", true, false);
  this.request.dispatchEvent(evt);
  console.log(evt.target.nodeValue);
};

Request.prototype.cleanRequest = function() {
  var request = this.request;
  this.request = null;
  request.parentNode.removeChild(request);
};

Request.prototype.onResponse = function(evt) {
  console.log(evt.target.nodeValue);
  this.callback(JSON.parse(evt.target.nodeValue));
  this.cleanRequest();
};

var Observer = function(data, callback) {
  Request.call(this, {type: 'registerObserver', data: data}, callback);
};

util.inherits(Observer, Request);

Observer.prototype.register = function() {
  this.send();
};

Observer.prototype.unregister = function() {
  var evt = document.createEvent("HTMLEvents");
  evt.initEvent("unregist", true, false);
  this.request.dispatchEvent(evt);
  this.cleanRequest();
};

Observer.prototype.onResponse = function(evt) {
  console.log(evt.target.nodeValue);
  this.callback(JSON.parse(evt.target.nodeValue));
};


var observer = new Observer(['item'], function(){
  console.log(arguments);
});
observer.register();
console.log(observer);


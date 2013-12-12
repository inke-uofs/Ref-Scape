var d3 = require('d3');

exports.d3 = function(){
    console.log('directive');
    return {
        restrict: 'AE',
        scope: {val: '='},
        link: function(scope, element, attrs) {
            console.log(scope);
            var ha = d3.select(element[0]);
            ha.append('svg');
        }
    };
};

var d3 = require('d3'),
_ = require('underscore');

function getOrAppend(parent, selector) {
    var target = parent.select(selector);
    if (target.empty()) {
        target = parent.append(selector);
    }
    return target;
}

exports.d3 = function(){
    // constants
    var 
    fill = d3.scale.category20(),
    force = d3.layout.force().charge(-10).linkStrength(0.2).gravity(0);

    return {
        restrict: 'AE',
        scope: {nodes: '=', links: '=', width: '=', height: '='},
        link: function (scope, element, attrs) {
            var 
            size = {width: scope.width, height: scope.height},
            svg = getOrAppend(d3.select(element[0]), 'svg').attr(size),
            board = getOrAppend(svg, 'rect').attr(size),
            nodes = scope.nodes,
            links = scope.links,
            node = svg.selectAll('.node').data(nodes),
            link = svg.selectAll('.link').data(links);

            force.nodes(nodes).links(links).size(size).
                on('tick', function(e){
                link.attr({
                    x1: function(d) {return d.source.x;},
                    y1: function(d) {return d.source.y;},
                    x2: function(d) {return d.target.x;},
                    y2: function(d) {return d.target.y;},
                });
                node.attr({
                    cx: function(d) {return d.x;},
                    cy: function(d) {return d.y;}
                });
            });


            node.on('click', function(){

            });

            node.enter().insert('circle', '.node').attr({
                r: function(d) {
                    return (d.links || []).length * 2 + 5;
                },
                class: function(d){ return 'node ' + d.type;},
            }).style('fill', function(d){return fill(d.user);});


            link.enter().insert('line', '.node').attr({
                class: function(d){ return 'link ' + d.type; }
            });

            force.start();
        }
    };
};


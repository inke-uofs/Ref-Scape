var _ = require('underscore');


exports.AppCtrl = function($scope){
    var width = 960,
    height = 500,
    center = {x: width/2, y: height/2},
    r = _.min([width, height])/4;

    var data = {
        items: [
            {id: 1, user: 1, links: [5, 8]},
            {id: 2, user: 2, links: [8, 3, 7, 9]},
            {id: 3, user: 3},
            {id: 4, user: 4, links: [8]},
            {id: 5, user: 1},
            {id: 6, user: 2},
            {id: 7, user: 3, links: [3]},
            {id: 8, user: 4, links: [4]},
            {id: 9, user: 3}
        ],
        users: [
            {id: 1, name: 'Xiaohan'},
            {id: 2, name: 'Ben'},
            {id: 3, name: 'Jade'},
            {id: 4, name: 'Federica'},
        ]
    };

    var 
    index = 0,
    users = {},
    items = {},
    nodes = [],
    links = [],
    tmpLinks = [],
    angle = Math.PI * 2 / data.users.length;

    _.each(data.users, function(user, i){
        _.extend(user, {
            x: center.x - Math.cos(angle * i) * r,
            y: center.y + Math.sin(angle * i) * r,
            fixed: true,
            type: 'user',
        });
        nodes.push(user);
        users[user.id] = index;
        index += 1;
    });
    _.each(data.items, function(item){
        _.extend(item, center, {type: 'item'});
        nodes.push(item);
        links.push({
            source: index, target: users[item.user], type: 'user item'
        });
        if (item.links) {
            tmpLinks.push({
                source: index, target: item.links, type: 'item-item'
            });
        }
        items[item.id] = index;
        index += 1;
    });
    _.each(tmpLinks, function(link){
        var type = link.type;
        _.each(link.target, function(id){
            links.push({source: link.source, target: items[id], type: type});
        });
    });

    _.extend($scope, {
        width: width,
        height: height,
        nodes: nodes,
        links: links,
    });
};

exports.AppCtrl = function($scope){
    $scope.data = {
        nodes: [
            {player: 1, x: 150, y: 150},
            {player: 2, x: 300, y: 150},
            {player: 3, x: 300, y: 300},
            {player: 4, x: 150, y: 300},
            {player: 1, x: 150, y: 150},
            {player: 2, x: 300, y: 150},
            {player: 3, x: 300, y: 300},
            {player: 4, x: 150, y: 300},
            {player: 3, x: 300, y: 300}
        ], 
        links: [
            {source: 0, target: 4},
            {source: 6, target: 2},
            {source: 3, target: 7},
            {source: 7, target: 3},
            {source: 0, target: 7},
            {source: 1, target: 7},
            {source: 1, target: 2},
            {source: 1, target: 6},
            {source: 1, target: 8}
        ]
    };
};

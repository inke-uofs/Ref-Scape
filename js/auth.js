   
    /*


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



 */



/*
OAuth = require('OAuth').OAuth,
exports.AuthCtrl = ['$scope', '$http', function($scope, $http){
  var 
  request_url = 'https://www.zotero.org/oauth/request',
  access_url = 'https://www.zotero.org/oauth/access',
  authorize_url = 'https://www.zotero.org/oauth/authorize';

  var oauth = new OAuth(request_url, access_url,
    'f9b582f3c1a244661f4c',
    '043e8b91e82895e54b1c',
    '1.0A',
    'http://localhost:8000/?a=b&c=d',
    'HMAC-SHA1');

  var r = oauth.signUrl(request_url, null, null, 'GET');
  $http.post(r).success(function(data, status, headers, config){ 
    alert(data);
  }).fail(function(data){
    alert(data);
  })
}];
*/


//console.log(oauth.getOAuthAccessToken('428448ad32163de1f710', '5757d95242cb10ffab37', 'd340c7270ed7d5ef83c4', function(){console.log('hello!');console.log(arguments)}));
//


//https://www.zotero.org/oauth/request?oauth_consumer_key=f9b582f3c1a244661f4c&oauth_nonce=ePLgkr3R15OhTCP0l9u2lx5v0Dfbby1J&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1390429773&oauth_version=1.0A&oauth_signature=vM5NtiO4fdonXRdBDudkNdB15P0%3D
//oauth_token=a813772681a0dfa50634&oauth_token_secret=023804fc75a9c728845f&oauth_callback_confirmed=true
//http://localhost:8000/?oauth_token=a813772681a0dfa50634&oauth_verifier=83d8cd7d29df4e574f00/
//console.log(oauth.signUrl( 'https://www.zotero.org/oauth/access?oauth_verifier=83d8cd7d29df4e574f00', 'a813772681a0dfa50634', '023804fc75a9c728845f', 'GET'));

//oauth_token=amrkvEGTcmSoelCmy43Ientd&oauth_token_secret=amrkvEGTcmSoelCmy43Ientd&userID=1579585&username=xzhang
/*
var url = ;
$.get(url, function(u){
  window.location = 'https://www.zotero.org/oauth/authorize?' + u;
})
console.log();
*/
/*
oauth.get(
  'https://api.zotero.org/users/1579585/items',
  'your user toke for this app', //test user token
  'your user secret for this app', //test user secret            
  function (e, data, res){
    if (e) console.error(e);        
    console.log(require('util').inspect(data));
    done();
  }
);
*/




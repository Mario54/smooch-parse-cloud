var KJUR = require("cloud/smooch/lib/jsrsasign/jsrsasign.js");

var endpoint = 'https://api.smooch.io';

var kid;
var secretKey;

function setParseUser(parseUser) {
  var jwt = KJUR.jws.JWS.sign("HS256", JSON.stringify({
    alg: "HS256",
    typ: "JWT",
    kid: kid
  }), JSON.stringify({
    scope: 'appUser',
    userId: parseUser.id
  }), secretKey);

  return {
    update: function updateUser(mapToSmoochProperties) {
      return Parse.Cloud.httpRequest({
        method: 'PUT',
        url: endpoint + '/v1/appusers/' + parseUser.id,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'authorization': 'Bearer ' + jwt
        },
        body: mapToSmoochProperties(parseUser)
      });
    },
    getJWT: function() {
      return jwt;
    }
  }
}

module.exports = {
  setParseUser: setParseUser,
  setOptions: function(options) {
    options = options || {};

    kid = options.kid || kid;
    secretKey = options.secretKey || secretKey;
  }
};

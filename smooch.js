var KJUR = require("cloud/smooch/lib/jsrsasign/jsrsasign.js");

var endpoint = 'https://api.smooch.io';

var kid;
var secretKey;

var userIdKey;

function withParseUser(parseUser) {
  var jwt = KJUR.jws.JWS.sign("HS256", JSON.stringify({
    alg: "HS256",
    typ: "JWT",
    kid: kid
  }), JSON.stringify({
    scope: 'appUser',
    userId: parseUser.id
  }), secretKey);

  return {
    update: function update(mapToSmoochProperties) {
      var smoochPropertiesPromise = mapToSmoochProperties(parseUser);

      if (!Parse.Promise.is(smoochPropertiesPromise)) {
        smoochPropertiesPromise = Parse.Promise.as(properties);
      }

      return smoochPropertiesPromise
        .then(function(userProperties) {
          return Parse.Cloud.httpRequest({
            method: 'PUT',
            url: endpoint + '/v1/appusers/' + (userIdKey ? parseUser.get(userIdKey) : parseUser.id),
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              'authorization': 'Bearer ' + jwt
            },
            body: userProperties
          });
        });
    },
    getJWT: function() {
      return jwt;
    }
  }
}

module.exports = {
  withParseUser: withParseUser,
  setOptions: function(options) {
    options = options || {};

    kid = options.kid || kid;
    secretKey = options.secretKey || secretKey;
    userIdKey = options.userIdKey;
  }
};

var KJUR = require("cloud/smooch/lib/jsrsasign/jsrsasign.js");

var endpoint = 'https://api.smooch.io';

var keyId;
var secret;

var userIdKey;

function withParseUser(parseUser) {
  var userId = (userIdKey ? parseUser.get(userIdKey) : parseUser.id);

  var jwt = KJUR.jws.JWS.sign("HS256", JSON.stringify({
    alg: "HS256",
    typ: "JWT",
    kid: keyId
  }), JSON.stringify({
    scope: 'appUser',
    userId: userId
  }), secret);

  return {
    update: function update(mapToSmoochProperties) {
      var smoochPropertiesPromise = mapToSmoochProperties(parseUser);

      if (!Parse.Promise.is(smoochPropertiesPromise)) {
        smoochPropertiesPromise = Parse.Promise.as(smoochPropertiesPromise);
      }

      return smoochPropertiesPromise
        .then(function(userProperties) {
          return Parse.Cloud.httpRequest({
            method: 'PUT',
            url: endpoint + '/v1/appusers/' + userId,
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

    keyId = options.keyId || keyId;
    secret = options.secret || secret;
    userIdKey = options.userIdKey;
  }
};

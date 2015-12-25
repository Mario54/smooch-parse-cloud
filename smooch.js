var KJUR = require("cloud/smooch/lib/jsrsasign/jsrsasign.js");

function init(parseUser, kid, secretKey) {
  var jwt = KJUR.jws.JWS.sign("HS256", JSON.stringify({
    alg: "HS256",
    typ: "JWT",
    kid: kid
  }), JSON.stringify({
    scope: 'appUser',
    userId: parseUser.id
  }), secretKey);

  return {
    updateUser: function updateUser(userProperties) {
      return Parse.Cloud.httpRequest({
        method: 'PUT',
        url: 'https://api.smooch.io/v1/appusers/' + parseUser.id,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'authorization': 'Bearer ' + jwt
        },
        body: userProperties
      });
    },
    getJWT: function() {
      return jwt;
    }
  }
}

module.exports = {
  init: init
};

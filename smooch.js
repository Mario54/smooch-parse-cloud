
function init(userId, jwt) {
  return {
    updateUser: function updateUser(userProperties) {
      return Parse.Cloud.httpRequest({
        method: 'PUT',
        url: 'https://api.smooch.io/v1/appusers/' + userId,
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          'authorization': 'Bearer ' + jwt
        },
        body: userProperties
      });
    }
  }
}

module.exports = {
  init: init
};

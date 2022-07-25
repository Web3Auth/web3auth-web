const express = require("express");
require("dotenv").config();
const app = express();
var request = require("request");

port = process.env.PORT;

//api to which your server listen for the requests coming from auth0
app.get("/callback", (req, res) => {
  //when a request from auth0 is received we get auth code as query param
  authCode = req.query.code;
  var options = {
    method: "POST",
    url: process.env.AUTH_URL,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    form: {
      grant_type: "authorization_code", //need to send authcode to grant our access to auth0
      client_id: process.env.CLIENT_ID, //auth0 clientID
      client_secret: process.env.CLIENT_SECRET, //auth0 client secret
      code: authCode, //we will be sending this code to get the id_token from auth0
      redirect_uri: process.env.REDIRECT_URI, //url mentioned in auth0 client
      scope: "openid profile email",
    },
  };

  //to get id_token we need to send post req to auth0
  request(options, function (error, response, data) {
    if (error) throw new Error(error);
    id_token = JSON.parse(data)["id_token"];
    redirect_url = process.env.FRONT_ENDPOINT + id_token;
    res.redirect(redirect_url);
  });
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});

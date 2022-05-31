const express = require('express')
const app = express()
const port = 3001
var request = require("request");


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/profile', (req, res) =>{
  console.log(req.body);
  res.send("logged in!")
})
app.get('/callback', (req, res) => {
  console.log('=================');
  console.log(req.query);
  var options = { method: 'POST',
  url: 'https://torus-test.auth0.com/oauth/token',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  form:
   { grant_type: 'authorization_code',
     client_id: 'FX0BwYwDtD6p0yTOjjIykjLbtxXszfkR', //auth0 tenant clientID
     client_secret: 'TgwKmD3Jd9iXQu_Fhj0w1smrm32NSgHQ3gzKBY_K6YTU3klQemME7UGxpbr3DlC3', //auth0 tenant secret
     code: req.query.code, //we are sending this code 
     redirect_uri: 'http://localhost:3001', //url mentioned in auth0 tenant
     scope: "openid profile email"
    }
   };
   var jwt_token = "";
  request(options, function (error, response, data) {
  if (error) throw new Error(error);
  jwt_token = JSON.parse(data)["id_token"];
  console.log(jwt_token);
  redirect_url = "http://localhost:3000/rwa?token="+jwt_token;
  res.redirect(redirect_url);
});

})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})
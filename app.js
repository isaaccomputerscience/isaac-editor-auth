const express = require('express');
const https = require('node:https');

const clientSecret = process.env.EDITOR_AUTH_CLIENT_SECRET
const allowOrigin = process.env.EDITOR_AUTH_ALLOW_ORIGIN || "*"
const port = process.env.EDITOR_AUTH_PORT || 8080;
if (!clientSecret) {
  console.log("ERROR: Client secret is not configured; exiting.");
  process.exit(1);
}

class InvalidCodeError extends Error {};

const app = express();
app.use(express.json());

app.listen(port, () => {
  console.log(`Editor auth app listening on port ${port}`);
});

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (req, res) => {
  res.send("OK");
});

app.post('/access_token', (req, res) => {
  if (!req.body.clientId || !req.body.code) {
    res.status(400).send({ error: "Invalid request body; must contain 'clientId' and 'code'" });
  }

  requestAccessToken(req.body.clientId, req.body.code).then((accessToken) => {
    res.send({ accessToken: accessToken });
  }).catch((e) => {
    if (e instanceof InvalidCodeError) {
      res.status(422).send({ error: "The code was invalid or expired." });
    } else {
      res.status(500).send({ error: "An unexpected error occurred." });
    }
  });
});

function requestAccessToken(clientId, code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      'client_secret': clientSecret,
      'client_id': clientId,
      'code': code
    });

    const req = https.request({
      hostname: 'github.com',
      port: 443,
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      if (res.statusCode != 200) {
        console.error("Unexpected status code", res.statusCode);
        reject();
        res.resume();
      }
      let body = "";
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        body += chunk;
      })
      res.on('end', () => {
        const result = JSON.parse(body);
        if (result.access_token) {
          resolve(result.access_token);
        } else if (result.error === "bad_verification_code") {
          reject(new InvalidCodeError);
        } else {
          console.error("Unexpected response body", result);
          reject();
        }
      })
    }).on('error', (e) => {
      console.error("Sending request failed", e);
      reject();
    })

    req.write(postData);
    req.end();
  })
}

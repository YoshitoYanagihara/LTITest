const express = require("express")
const app = express()

const axios = require("axios")
const JWT = require("jsonwebtoken")
const fs = require("fs")
const secretKey = fs.readFileSync("./Key/key")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post("/login", (req, res) => {
  const loginRequest = {
    scope: "openid",
    response_type: "id_token",
    client_id: "RlxYqlQm7Bv7Uyd",
    redirect_uri: "http://localhost:3000/app",
    login_hint: req.body.login_hint,
    state: "dummyState",
    nonce: "dummyNonce",
    response_mode: "form_post",
    prompt: "none",
    lti_message_hint: req.body.lti_message_hint,
  }
  res.redirect("http://localhost/mod/lti/auth.php?" + new URLSearchParams(loginRequest).toString())
})

const fetchAccessToken = async (scopes) => {
  const apiEndpoint = "http://localhost/mod/lti/token.php"
  const currentTime = Math.floor(new Date().getTime() / 1000)
  const jwtPayload = {
    iss: "RlxYqlQm7Bv7Uyd",
    sub: "RlxYqlQm7Bv7Uyd",
    aud: apiEndpoint,
    iat: currentTime - 5,
    exp: currentTime + 3600,
    jti: "hoge",
  }
  const jwt = JWT.sign(jwtPayload, secretKey, { algorithm: "RS256" })
  const request = {
    grant_type: "client_credentials",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: jwt,
    scope: scopes.join(" "),
  }
  const response = await axios.post(apiEndpoint, new URLSearchParams(request).toString())
  return response.data.access_token
}

app.post("/app", async (req, res) => {
  const jwt = req.body.id_token.split(".")
  const payload = JSON.parse(Buffer.from(jwt[1], "base64").toString())
  const endpoint = payload["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"]
  const scopes = endpoint.scope
  try {
    const accessToken = await fetchAccessToken(scopes)
    const request = {
      timestamp: new Date().toISOString(),
      scoreGiven: 10,
      scoreMaximum: 100,
      comment: "後で職員室に来なさい",
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
      userId: payload.sub,
    }
    const response = await axios.get(endpoint.lineitem, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      data: new URLSearchParams(request).toString(),
    })
    console.log(response.status)
  } catch (error) {
    res.send(error)
    return
  }
  res.send("OK")
})

app.listen(3000, () => {
  console.log("Start Server!")
})

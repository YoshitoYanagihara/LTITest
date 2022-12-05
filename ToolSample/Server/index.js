const express = require("express")
const app = express()

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

app.post("/app", (req, res) => {
  const jwt = req.body.id_token.split(".")
  const payload = JSON.parse(Buffer.from(jwt[1], "base64").toString())
  res.json({
    payload,
  })
})

app.listen(3000, () => {
  console.log("Start Server!")
})

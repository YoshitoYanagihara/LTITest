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

// 参考： https://note.kiriukun.com/entry/20191124-iso-8601-in-javascript
const toISOStringSec = (dt) => {
	const pad = (val, len) => {
		let p = '';
		for (let i = 0; i < len; ++i) {
			p += '0';
		}
		return (p + String(val)).slice(-1 * len);
	};
	const year = dt.getFullYear();
	const month = dt.getMonth() + 1;
	const days = dt.getDate();
	const hours = dt.getHours();
	const minutes = dt.getMinutes();
	const seconds = dt.getSeconds();
  const millisec = dt.getMilliseconds();
	return `${year}-${pad(month, 2)}-${pad(days, 2)}T${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millisec, 3)}Z`;
}

// 参考: https://locutus.io/php/strings/substr_replace/
const substrReplace = (str, replace, start, length) =>  {
  if (start < 0) {
    start = start + str.length
  }
  length = length !== undefined ? length : str.length
  if (length < 0) {
    length = length + str.length - start
  }
  return [
    str.slice(0, start),
    replace.substr(0, length),
    replace.slice(length),
    str.slice(start + length)
  ].join('')
}

app.post("/app", async (req, res) => {
  const jwt = req.body.id_token.split(".")
  const payload = JSON.parse(Buffer.from(jwt[1], "base64").toString())
  const endpoint = payload["https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"]
  const scopes = endpoint.scope
  try {
    const accessToken = await fetchAccessToken(scopes)
    const request = {
      timestamp: toISOStringSec(new Date()),
      scoreGiven: Math.floor(Math.random() * 100),
      scoreMaximum: 100,
      comment: "後で職員室に来なさい",
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
      userId: payload.sub,
    }
    endpoint.lineitem = substrReplace(endpoint.lineitem, "/scores", endpoint.lineitem.indexOf("?"), 0)
    await axios.post(endpoint.lineitem, request, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/vnd.ims.lis.v1.score+json",
      },
    })
  } catch (error) {
    res.send(error)
    return
  }
  res.send("OK")
})

app.listen(3000, () => {
  console.log("Start Server!")
})

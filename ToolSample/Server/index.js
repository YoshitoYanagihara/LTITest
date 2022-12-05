const express = require("express")
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post("/login", (req, res) => {
  console.log(req.body)
  res.send("hoge")
})

app.listen(3000, () => {
  console.log("Start Server!")
})

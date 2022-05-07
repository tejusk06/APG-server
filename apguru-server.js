const express = require("express");
// const fetch = require("node-fetch");
// const bodyParser = require("body-parser");
// var cors = require("cors");
const app = express();

// configure the app to use bodyParser()
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );
// app.use(bodyParser.json());
// app.use(cors());

app.post("/", async (req, res) => {
  res.write("This is the response from the server");
  const reqData = JSON.stringify(req.body);

  const myHeaders = new fetch.Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Basic ");

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: reqData,
    redirect: "follow",
  };

  //   fetch("", requestOptions).then(function (response) {

  //   });
});

app.listen(process.env.PORT || 3000, () => console.log("server started"));

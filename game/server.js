// Server config

var express = require("express")
   , app = express()
   , http = require("http").createServer(app);

app.set("math-game", "127.0.0.1");

app.set("port", 8080);


/* Views */


app.set("views", __dirname + "/views");

app.set("view engine", "jade");

app.use(express.static("public", __dirname + "/public"))

//server to support JSON, urlencoded, and multipart requests

app.use(express.bodyParser());


/* Routing */

//Home index

app.get("/", function(request, response){
  response.render("index");
});

http.listen(app.get("port"), app.get("math-game"), function() {
  console.log('GET / fetched. Go to http://' + app.get("math-game") +
    ":" + app.get("port"));
});
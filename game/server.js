/*
  Module dependencies:

  - Express
  - Http (to run Express)
  - Underscore
  - Socket.IO
  - Jade for templating

*/

var express = require("express"),
    app = express(),
    http = require("http").createServer(app),
    io = require("socket.io").listen(http),
    _ = require("underscore");

/*
  The list of players.

  Format:
    {
      id: "sessionId",
      name: "playerName",
      score: "playerScore"
    }

*/

var players = []

// Server config

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


//POST method to create a chat message

app.post("/message", function(request, response) {

  var message = request.body.message;

  // If message is empty or wasn't sent
  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }

  // Expect user's name with message

  var name = request.body.name;

  // Let our chatroom know there was a new message
  io.sockets.emit("incomingMessage", {message: message, name: name})
  response.json(200, {message: "Message received"});
});

/* Socket.IO */

io.on("connection", function(socket){

  socket.on("newUser", function(data) {
    players.push({id: data.id, name: data.name, score: data.score});
    io.sockets.emit("newConnection", {players: players});
  });


  socket.on("scoreChange", function(data) {
    _.findWhere(players, {id: socket.id}).name = data.name;
    io.sockets.emit("scoreChanged", {id: data.id, name: data.name, score: data.score});
  });


  /* When a client disconnects from the server, the event "userDisconnected"
  will be sent to all players */

  socket.on("disconnect", function() {
    players = _.without(players,
                    _.findWhere(players, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });
});

//Start server

http.listen(app.get("port"), app.get("math-game"), function() {
  console.log('GET / fetched. Go to http://' + app.get("math-game") +
    ":" + app.get("port"));
});










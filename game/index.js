//Module Dependencies

var express = require('express'),
    path = require('path'),
    _ = require('underscore'),
    app = express(),
    mathGame = require('./game');
    app.configure(function(){
      //app.use(express.logger('dev'));
      app.use(express.static(path.join(__dirname, 'public')));
    });
var server = require('http').createServer(app).listen(8000);


//Views and assets


// app.set("views", __dirname, "/views")
// app.set("view engine", "jade")


//Listen for Socket.IO connections
var io = require('socket.io').listen(server);

//io.set('log level',1);

io.sockets.on('connection', function(socket){
  console.log("client connected");
  mathGame.initGame(io, socket);
})



// var express = require('express'),
//     path = require('path'),
//     app = express(),
//     http = require("http").createServer(app).listen(8080),
//     io = require("socket.io").listen(http),
//     _ = require("underscore");

// // Import the Math game file.
// var math = require('./mathTriviaGame');

// // Create a simple Express application
// app.configure(function() {
//     // Turn down the logging activity
//     app.use(express.logger('dev'));

//     // Serve static html, js, css, and image files from the 'public' directory
//     app.use(express.static(path.join(__dirname,'public')));
// });

// // Create a Node.js based http server on port 8080
// var server = require('http').createServer(app).listen(8080);

// // Create a Socket.IO server and attach it to the http server
// var io = require('socket.io').listen(server);

// // Reduce the logging output of Socket.IO
// io.set('log level',1);

// // Listen for Socket.IO Connections. Once connected, start the game logic.
// io.sockets.on('connection', function (socket) {
//     math.initGame(io, socket);
// });



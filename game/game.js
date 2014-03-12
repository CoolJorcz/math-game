var io;
var gameSocket;
_ = require('underscore');

/*******************************************

  Initializes a new game instance
  @param sio The Socket.IO library
  @param socket The socket object for the connected client.

*******************************************/

exports.initGame = function(sio, socket){
  io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', { message: "You are connected!"});

  // Host Events
  gameSocket.on('hostCreateNewGame', hostCreateNewGame);
  gameSocket.on('hostRoomFull', hostPrepareGame);
  gameSocket.on('hostCountdownFinished', hostStartGame);
  gameSocket.on('hostNextRound', hostNextRound);

  // Player Events
  gameSocket.on('playerJoinGame', playerJoinGame);
  gameSocket.on('playerAnswer', playerAnswer);
  gameSocket.on('playerRestart', playerRestart);
}

/*********************************************

                HOST FUNCTIONS

**********************************************/

// hostCreateNewGame occurs

function hostCreateNewGame(){
  var thisGameId = ( Math.random() * 100000 ) | 0;

  // Return Room ID and the socket ID to the browser
  this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

  // Join the Room and wait for players
  this.join(thisGameId.toString());
};

//Alert Host when Game is initiated

function hostPrepareGame(gameID){
  var sock = this;
  var data = {
    mySocketId : sock.id,
    gameId : gameID
  };
  io.sockets.in(data.gameId).emit('beginNewGame', data);
}

// Countdown has finished and the game begins
// @param gameId The game ID / room ID

function hostStartGame(gameId){
  console.log('Game Started.');
  sendQuestion(0, gameId);
};

// After player answers correctly, time for the next word.
function hostNextRound(data) {
  if(data.round < questionPool.length ){
    sendQuestion(data.round, data.gameId);
  } else {
    io.sockets.in(data.gameId).emit('gameOver', data);
  }
}

/********************************************************

                PLAYER FUNCTIONS

*********************************************************/

// Player hits start button
// @param data Contains data entered via player's input

function playerJoinGame(data) {
  // A reference to the player's Socket.IO socket object

  var sock = this;

  var room = gameSocket.manager.rooms["/" + data.gameId];

  if(room != undefined){
    data.mySocketId = sock.id;

    // Join room
    sock.join(data.gameId);

    io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

  } else {
    // Or not
    this.emit('error', {message: "This room does not exist"});
  }
}

// function playerLeaveGame(data){
//   //TODO
// }

//Player selects an answer
function playerAnswer(data){
  // Player's answer is attached to the data object. \
  // Emits an event with the answer so it can be checked by the Host
  io.sockets.in(data.gameId).emit('hostCheckAnswer', data);

}

//Game is over, restart game function

function playerRestart(data){
  data.playerId = this.id;
  io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
}


/***********************************************

                GAME LOGIC

***********************************************/

// Get Question and answers from the host
// @param questionPoolIndex
// @param gameId The room identifier


function sendQuestion(questionPoolIndex, gameId){
  var data = getQuestionData(questionPoolIndex);
  io.sockets.in(data.gameId).emit('newQuestionData', data);
}

/****************************************

      Function does all the work of getting new questions from the pile and
      organizing data to send to clients.

****************************************/

function getQuestionData(i){
  // Take first question
  // First element will be the displayed question, 2nd will be answer hidden amongst incorrect answers

  var questAnsw = questionPool[i].questionAnswer;

  //Randomize order of decoy answers and inject answer.

  var answers = _.shuffle(questionPool[i].choices);

  // Pick a random spot in the decoy list to put the correct answer

  var rnd = Math.floor(Math.random() * 4);
  answers.splice(rnd, 0, questAnsw[1]);

  // Package data into a single object

  var roundData = {
    round : i,
    question : questAnsw[0],
    answer : questAnsw[1],
    list : answers // List for player
  }

  return roundData;
}

/**********************************************************

GAME DATA for Questions and Answer

**********************************************************/


var questionPool = [
    {
        "questionAnswer"  : [ "At Cityville University, 50% of the students have iPods. Of the students who have iPods, 30% also have microwaves. What percent of the students have both an iPod and a microwave?", '15%' ],
        "choices" : [ '20%', '25%', '40%', '80%']
    },

    {
        "questionAnswer"  : ["The lengths of two sides of a triangle are 5 and 7. If the lenght of the third side is an integer, what is the least possible perimeter of the triangle?", "15"],
        "choices" : ["12", "13", "14", "17" ]
    },

    {
        "questionAnswer"  : ["If 3 more than x is 2 more than y, what is x in terms of y?", "y - 1" ],
        "choices" : ["y - 5", "y + 1", "y + 5", "y + 6" ]
    },

    {
        "questionAnswer"  : ["The surface area, SA, of a sphere with radius r is given by the formula SA = 4 pi r^2.  If the surface area of a basketball is approximately 95 square inches, what is its radius to the nearest inch?", "2 3/4" ],
        "choices" : ["9 3/4", "8 1/2", "7 1/2", "3/4" ]
    },

    {
        "questionAnswer"  : [ "A jar contains 4 red toothpicks, 10 blue toothpicks, and 6 yellow toothpicks. If three toothpicks are removed from the bag at random and no toothpick is returned to the bag after removal, what is the probability that all three toothpicks will be blue?", "1/2" ],
        "choices" : ["1/8", "3/20", "2/19", "3/18" ]
    },

    {
        "questionAnswer"  : ["A jar contains a number of marbles of which 58 are pink, 78 are green, and the rest are blue. If the probability of choosing a blue marble from this jar at random is 1/5, how many blue marbles are in the jar?", "34"],
        "choices" : ["56", "78", "102", "152"]
    },

    {
        "questionAnswer"  : ["Jessica subscribed to four magazines that cost $15.00, $18.00, $13.50 and $20.95 per year, respectively. If she made an initial payment of one-half of the total yearly subscription cost, and paid the rest in four equal monthly payments, how much was each of the four monthly payments?", "$8.43"],
        "choices" : ["$9.20", "$9.45", "$16.86", "$33.73"]
    },

    {
        "questionAnswer"  : ["Cindy ran from her house to school at an average spped of 6 miles per hour and returned along the same route at an average speed of 4 miles per hour.  If the total time it took her to run to the school and back was one hour, how many minutes did it take her to run from her house to school?", "24" ],
        "choices" : ["16", "18", "20", "22"]
    },

    {
        "questionAnswer"  : ["If n is an even integer, which of the following must be an odd integer?", "3(n+1)" ],
        "choices" : ["3n-2", "n-2", "n/3", "n squared"]
    },

    {
        "questionAnswer"  : ["A survey of Cityville found an average (arithmetic mean) of 3.2 people per household and a mean of 1.2 DVD players per household. If 48,000 people live in Cityville, how many DVD players are in Cityville?", "18,000"],
        "choices" : ["15,000", "16,000", "40,000", "57,600"]
    }
]



























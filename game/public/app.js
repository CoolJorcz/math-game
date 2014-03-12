;
jQuery(function($) {
  'use strict';

  var IO = {

    /* Connects IO client to Server */

    init: function() {
      IO.socket = io.connect();
      IO.bindEvents();
    },

    /* Bound events on IO server calls */

    bindEvents: function() {
      IO.socket.on('connected', IO.onConnected );
      IO.socket.on('newGameCreated', IO.onNewGameCreated );
      IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
      IO.socket.on('beginNewGame', IO.beginNewGame );
      IO.socket.on('newQuestionData', IO.onNewQuestionData);
      IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
      //IO.socket.on('playerLeftRoom', IO.playerLeftRoom)
      IO.socket.on('gameOver', IO.gameOver);
      IO.socket.on('error', IO.error );
    },

    onConnected: function(){
      App.mySocketId = IO.socket.socket.sessionid;
    },

    onNewGameCreated: function(data){
      App.Host.gameInit(data);
    },

    playerJoinedRoom : function(data){
      App[App.myRole].updateWaitingScreen(data);
    },

    playerLeftRoom : function(data){
      App[App.myRole].updateWaitingScreen(data);
    },

    beginNewGame : function(data){
      App[App.myRole].gameCountdown(data)
    },

    onNewQuestionData : function(data){
      App.currentRound = data.round;

      App[App.myRole].newQuestion(data);
    },

    hostCheckAnswer : function(data) {
      if(App.myRole === 'Host') {
        App.Host.checkAnswer(data);
      }
    },

    gameOver : function(data) {
      App[App.myRole].endGame(data);
    },

    error : function(data) {
      alert(data.message);
    }
  };

  var App = {

    //Identical to room ID

    gameId: 0,

    myRole : '',

    mySocketId : '',

    currentRound: 0,

    init: function(){
      App.cacheElements();
      App.showInitScreen();
      App.bindEvents();

      // Initialize fastclick
      FastClick.attach(document.body);
    },

    cacheElements: function(){
      App.$doc = $(document);

      //Templates

      App.$gameArea = $('#gameArea');
      App.$templateIntroScreen = $('#intro-screen-template').html();
      App.$templateNewGame = $('#create-game-template').html();
      App.$templateJoinGame = $('#join-game-template').html();
      App.$hostGame = $('#host-game-template').html();
    },

    //Click handlers for the various buttons on screen
  bindEvents: function(){
    App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
    App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);
    App.$doc.on('click', '#btnAnswer', App.Player.onPlayerAnswerClick);
    App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
    //App.$doc.on('click', '#btnPlayerLeave', App.Player.onLeaveRoomClick);
  },
    /**************************************************************

                          GAME LOGIC

    **************************************************************/

    showInitScreen: function(){
      App.$gameArea.html(App.$templateIntroScreen);
      App.doTextFit('.title');
    },

    /**************************************************************

                          HOST LOGIC

    **************************************************************/

    Host : {

      players : [],
      /*
      Flag to indicate if a new game is starting.
      Used so players can initiate a new game without refreshing the browser window
      after first game is played.
      */

      isNewGame : false,

      numPlayersInRoom : 0,

      //Reference for correct answer in current round
      currentCorrectAnswer: '',

      //Handler for the Start button on the Title screen

      onCreateClick: function(){
        IO.socket.emit('hostCreateNewGame');
      },

      gameInit: function(data) {
        App.gameId = data.gameId;
        App.mySocketId = data.mySocketId;
        App.myRole = 'Host';
        App.Host.numPlayersInRoom = 0;

        App.Host.displaysNewGameScreen();
      },

      displayNewGameScreen : function(){
        App.$gameArea.html(App.$templateNewGame);

        $('#gameURL').text(window.location.href);
        App.doTextFit('#gameURL');

        $('#spanNewGameCode').text(App.gameId);
      },

      updateWaitingScreen: function(data) {
        if ( App.Host.isNewGame) {
          App.Host.displayNewGameScreen();
        }
        $('#playersWaiting')
            .append('<p/>')
            .text('Player' + data.playerName + ' joined the game.');

        App.Host.players.push(data);

        App.Host.numPlayersInRoom += 1;

        if (App.Host.numPlayersInRoom >= 1) {
          IO.socket.emit('hostRoomFull', App.gameId)
        }
      },

      gameCountdown: function(){
        App.$gameArea.html(App.$hostGame);
        App.doTextFit('#hostQuestion');

        var $secondsLeft = $('#hostQuestion');
        App.countDown( $secondsLeft, 5, function(){
          IO.sockets.emit('hostCountdownFinished', App.gameId);
        });

        var $players = App.Host.players;

        //Loop through every player
        $.each(players, function(i, player){
          var $score = $('#player'+i+'Score');
          //Display players' names on screen
          $score.find('.playerName').html(App.Host.players[i].playerName);
          //Set score to 0 for each player
          $score.find('.score').attr('id',App.Host.players[i].mySocketId);
        });
      },

      //Show the question for the current round on screen
      //@param data{{round: *, word: *, answer: *, list: Array}}
      newQuestion : function(data){
        //Insert the new word into the DOM
        $('#hostQuestion').text(data.question);
        App.doTextFit('#hostQuestion');

        //Update data for current round
        App.Host.currentCorrectAnswer = data.answer;
        App.Host.currentRound = data.round;
      },

      // Check answer clicked by each player
      // @param data{{round: *, playerId: *, answer: *, gameId: *}}
      checkAnswer : function(data){
        //Verify answer is from current round in case of delays.
        if (data.round === App.currentRound){
          //Get player's score
          var $pScore = $('#' + data.playerId);

          //Increase player's score if it is correct
          if (App.Host.currentCorrectAnswer === data.answer ){
            $pScore.text( +$pScore.text() + 1);

            App.currentRound += 1;

            // Prepare data for server send
            var data = {
              gameId : App.gameId,
              round : App.currentRound
            }

            // Notify server
            IO.socket.emit('hostNextRound', data);
          } else {
            // Decrement score for wrong answers
            $pScore.text( +$pScore.text() - 3 );
          }
        }
      },

      //End of Game logic

      endGame : function(players){
        // Loop through every player, get data for each player, sort players by score,
        // and return the highest score
        var pScores = [];
        $.each(players, function(index, player){
          var $p = $('#player'+index+'Score');
          var pScore = +$p.find('.score').text();
          var pName = $p.find('.playerName').text();
          pScores += { pName: pScore };
        });

        //Return ascending scores
        var rankedScores = function(scores) {
          var sortable = [];
          for(var name in scores){
            sortable.push([name, scores[name]])
          }
          return sortable.sort(function(a,b){ return b[1]-a[1]})
        }

        //Winner will either be the player with the highest score, or it will be a tie
        var finalScores = rankedScores(pScores);
        var winner = (_.uniq(finalScores).length() === rankedScores.length()) ? finalScores[0][1] + " Wins!" : "It's a Tie!";

        $('#hostQuestion').text(winner);
        App.doTextFit('#hostQuestion');

        // Reset Game Data

        App.Host.numPlayersInRoom = 0;
        App.Host.isNewGame = true;

      },

      // A player hits 'Start Again' button after the end of a game

      restartGame : function(){
        App.$gameArea.html(App.$templateNewGame);
        $('#spanNewGameCode').text(App.gameId);
      }

    },

    Player : {

      // Socket ID of host
      hostSocketId: '',

      //Name entered on the Join screen.
      myName: '',

      //Click handler for the Join button
      onJoinClick: function(){
        App.$gameArea.html(App.$templateJoinGame);
      },

      //Player entered their name and gameID and clicked Start.

      onPlayerStartClick: function(){
        var data = {
          gameId : +($('#inputGameId').val()),
          playerName : $('#inputPlayerName').val() || 'anon'
        };

        // Send gameId and playerName to the server
        IO.socket.emit('playerJoinGame', data);

        // Set appropriate properties for the current player

        App.myRole = 'Player';
        App.Player.myName = data.playerName;
      },

      // Click handler for hitting a specific answer

      onPlayerAnswerClick: function() {
        var $btn = $(this),
            answer = $btn.val();

        // Send player info and tapped word to server for host to check answer
        var data = {
          gameId: App.gameId,
          playerId: App.mySocketId,
          answer: answer,
          round: App.currentRound
        }
        IO.socket.emit('playerAnswer', data)
      },

      // Click handler for when a player leaves a room
      onPlayerLeave: function() {
        var data = {
          gameId: App.gameID,
          playerId: App.mySocketId,
          round: App.currentRound
        }
        IO.socket.emit('playerLeftRoom', data)
      },

      // Click handler for the start again button
      onPlayerRestart: function(){
        var data = {
          gameId: App.gameId,
          playerName: App.Player.myName
        }
        IO.socket.emit('playerRestart', data);
        App.currentRound = 0;
        $('#gameArea').html("<h3>Waiting on host to start a new game.</h3>")
      },

      //Display waiting screen for player 1
      updateWaitingScreen: function(data){
        if(IO.socket.socket.sessionid === data.mySocketId){
          App.myRole = 'Player';
          App.gameId = data.gameId;

          $('#playerWaitingMessage')
            .append('<p/>')
            .text('Joined Game ' + data.gameId + '. Please wait for the game to begin.');
        }
      },

      //Display 'Get Ready' while the countdown timer ticks down
      gameCountdown: function(hostData){
        App.Player.hostSocketId = hostData.mySocketId;
        $('#gameArea')
          .html('<div class="gameOver">Get Ready!</div>');
      },

      //Show the list of answers for the current round
      newQuestion: function(data){
        // Create an unordered list element
        var $list = $('<ul/>').attr('id', 'ulAnswers');

        // Insert a list item for each word in the word list received from the server.
        $.each(data.list, function(){
          $list
            .append( $('<li/>')
              .append( $('<button/>')
                .addClass('btnAnswer')
                .addClass('btn')
                .val(this)
                .html(this)
              )
            )
        });

        // Insert list onto the screen
        $('#gameArea').html($list);
      },

      // Show GameOver screen
      endGame: function(){
        $('#gameArea')
          .html('<div class="gameOver">Game Over!</div>')
          .append(
            // Create a button to start a new game.
            $('<button>Start Again</button>')
              .attr('id', 'btnPlayerRestart')
              .addClass('btn')
              .addClass('btnGameOver')
          );
      }
    },

    /**********************************************************

          ADDITIONAL UTILITY CODE

    **********************************************************/

    countDown : function( $el, startTime, callback){
      // Display the starting time on the screen.
      $el.text(startTime);
      App.doTextFit('#hostQuestion');

      if( startTime <= 0 ){
        clearInterval(timer);
        callback();
        return;
      }
    },

    doTextFit : function(el){
      textFit(
        $(el)[0],
        {
          alignHoriz:true,
          alignVert:false,
          widthOnly:true,
          reProcess:true,
          maxFontSize:300
        }
      );
    }
  };
  IO.init();
  App.init();
}($));
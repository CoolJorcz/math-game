function init(){
  var serverBaseUrl = document.domain;

  var socket = io.connect(serverBaseUrl);

  var sessionId = '';


  socket.on('connect', function() {
    sessionId = socket.socket.sessionid;
    console.log('Connected ' + sessionId)
  });

  //Players list and current score
  function updatePlayers(players) {
     $('#players').html('');
     for (var i = 0; i < players.length; i++) {
      $('#players').append('<span id="' + players[i].id + '">'
        + players[i].name + '' + (players[i].id === sessionId ? '(You)' : '')
        + players[i].score + '<br /></span>');
     }
  }


  /* Client connecting to server
    with a sessionID, name, and current score of zero
  */

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    console.log('Connected' + sessionId);
    socket.emit('newUser', {id: sessionId, name: $('#name').val()});
  });
  /*
    After server emits "newConnection" eent, players sections is reset and
    shows connected players.
  */
  socket.on('newConnection', function(data) {
    updatePlayers(data.players);
  });

  /* Remove span tag at "userDisconnected" event
  */
  socket.on('userDisconnected', function(data) {
    $('#' + data.id).remove();
  });
}

$(document).on('ready', init);
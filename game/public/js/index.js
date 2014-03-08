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
        + players[i].name + '' + (players[i].id === sessionId ? '(You)-' : '-')
        + players[i].score + '<br /></span>');
     }
  }


  /* Client connecting to server
    with a sessionID, name, and current score of zero
  */

  socket.on('connect', function () {
    sessionId = socket.socket.sessionid;
    console.log('Connected' + sessionId);
    socket.emit('newUser', {id: sessionId, name: $('#name').val(), score: 0});
  });
  /*
    After server emits "newConnection" event, players sections is reset and
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

  /* On score changed event */
  socket.on('scoreChanged', function(data){
    $('#' + data.id).html(data.name + '' + (data.id === sessionId ? '(You) - ' : '-')
      + data.score + '<br />');
  });

  /* When receiving a new message*/
  socket.on('incomingMessage', function(data) {
    var message = data.message;
    var name = data.name;
    $('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
  });


  // Log errors if unable to connect to server
  socket.on('error', function(reason) {
    console.log('Unable to connect to server: ', reason)
  });

  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();

    $.ajax({
      url: '/message',
      type: 'POST',
      dataType: 'json',
      data: {message: outgoingMessage, name: name}
    });
  }

  /* Allow enter press */

  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();

      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  //Helper to disable/enable send function

  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true)
  }

  //When a user updates his score, let the server know by emitting the scoreChange event

  function scoreFocusOut() {
    var name = $('#name').val();
    socket.emit('scoreChange', {id: sessionId, name: name})
  }

  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp)
  $('#name').on('focusout', scoreFocusOut);
  $('#send').on('click', sendMessage);
}

$(document).on('ready', init);
window.addEventListener('load', () => {
  // Platform
  const chatTemplate = Handlebars.compile($('#chat-template').html());
  const chatContentTemplate = Handlebars.compile($('#chat-content-template').html());
  const chatEl = $('#chat');
  const formEl = $('.form');
  const messages = [];
  let username;

// Local Video
  const localImageEl = $('#local-image');
  const localVideoEl = $('#local-video');

// Remote Videos
  const remoteVideoTemplate = Handlebars.compile($('#remote-video-template').html());
  const remoteVideoDemoTemplate = Handlebars.compile($('#remote-video-demo-template').html());
  const remoteVideosEl = $('#remote-videos');
  let remoteVideosCount = 0;

// Hide cameras until they are initialized
  localVideoEl.hide();

// Validation rules to Create/Join rooms
  formEl.form({
    fields: {
      roomName: 'empty',
      username: 'empty'
    }
  });

  $('.submit').on('click', (event) => {
    if (!formEl.form('is valid')) {
      return false;
    }

    username = $('#username').val();
    const roomName = $('#roomName').val().toLowerCase();
    if (event.target.id === 'create-room') {
      createRoom(roomName);
    } else {
      joinRoom(roomName);
    }
    return false;
  });

// WebRTC connection
  const webrtc = new SimpleWebRTC({
    localVideoEl: 'local-video',
    remoteVideoEl: 'remote-videos',
    autoRequestMedia: true
  });

// Access to local camera
  webrtc.on('localStream', () => {
    localImageEl.hide();
    localVideoEl.show();
  });

// Remote video was Added
  webrtc.on('videoAdded', (video, peer) => {
    const id = webrtc.getDomId(peer);
    const html = remoteVideoTemplate({id});
    if (remoteVideosCount === 0) {
      remoteVideosEl.html(html);
    } else {
      remoteVideosEl.append(html);
    }
    $(`#${id}`).html(video);
    $(`#${id} video`).addClass('w-100');

    remoteVideosCount += 1;
  });

// Register new chat room
  const createRoom = (roomName) => {
    webrtc.createRoom(roomName, (err, name) => {
      showChatRoom(name);
      postMessage(`${username} created chatroom`);
    });
  };

// Join existing chat room
  const joinRoom = (roomName) => {
    webrtc.joinRoom(roomName);
    showChatRoom(roomName);
    postMessage(`${username} joined chatroom`);
  };

// Post local messages
  const postMessage = (message) => {
    const chatMessage = {
      username,
      message,
      postedOn: new Date().toLocaleString('ru-RU')
    };
    // Send to all
    webrtc.sendToAll('chat', chatMessage);
    // Update message locally
    messages.push(chatMessage);
    $('#post-message').val('');
    updateChatMessages();
  };

// Display char room interface
  const showChatRoom = (room) => {
    formEl.hide();
    const html = chatTemplate({room});
    chatEl.html(html);
    const postForm = $('form');
    // Post Message Validation
    postForm.form({
      message: 'empty'
    });
    $('#post-btn').on('click', () => {
      const message = $('#post-message').val();
      postMessage(message);
    });
    $('#post-message').on('keyup', (event) => {
      if (event.keyCode === 13) {
        const message = $('#post-message').val();
        postMessage(message);
      }
    });
    $('#disconnect-btn').on('click', () => {
      formEl.show();
      remoteVideosEl.empty();
      remoteVideosEl.html(remoteVideoDemoTemplate);
      chatEl.empty();
    });
  };

// Update chat messages
  const updateChatMessages = () => {
    const html = chatContentTemplate({messages});
    const chatContentEl = $('#chat-content');
    chatContentEl.html(html);
    // automatically scroll downwards
    const scrollHeight = chatContentEl.prop('scrollHeight');
    chatContentEl.animate({scrollTop: scrollHeight}, 'slow');
  };

// Receive message from remote user
  webrtc.connection.on('message', (data) => {
    if (data.type === 'chat') {
      const message = data.payload;
      messages.push(message);
      updateChatMessages();
    }
  });
});
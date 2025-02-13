

class Websocket {
  constructor(settings) {
    this.websocker = null;
    this.host = settings.host;
    startWebSocket();
  }

  Update(pongLogic, scores, settings, powerUps) {
     if (this.host) {

    } else {

    }
  }


  startWebSocket() {
    const roomName = "test";
    const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPath = isSpectator ? 'spectate' : 'room';
    this.socket = new WebSocket(
      `${wsScheme}//${window.location.host}/ws/${wsPath}/${roomName}/`
    );

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
      // Optionally send initial data if needed
    };


    // TODO: need to improve this
    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'gameState') {
          this.serverBallPosition = data.ballPosition;
          this.serverPaddle1Position = data.paddle1Position;
          this.serverPaddle2Position = data.paddle2Position;
          console.log('Received game state from server.');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
    };
  }


  
}

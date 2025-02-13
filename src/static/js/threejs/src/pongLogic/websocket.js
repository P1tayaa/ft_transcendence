


class Websocket {
  constructor(settings) {
    this.socket = null;
    this.host = settings.host;
    this.startWebSocket();
  }

  Update(pongLogic, scores, settings, powerUps) {
    if (this.host) {
      // Convert maps to plain objects before sending
      const gameState = {
        type: 'gameState',
        pongLogic: {
          ballPos: pongLogic.ballPos,
          ballSpeed: pongLogic.ballSpeed,
          ballSize: pongLogic.ballSize,
          lastWinner: pongLogic.lastWinner,
          lastContact: pongLogic.lastContact,
          lastLoser: pongLogic.lastLoser,
        },
        settings: {
          paddleSize: Object.fromEntries(settings.paddleSize.entries()),
          paddleLoc: Object.fromEntries(settings.paddleLoc.entries()),
        },
        powerUps: Object.fromEntries(
          powerUps.entries()
        ),
        scores: Object.fromEntries(scores.scores.entries()),
      };
      this.socket.send(JSON.stringify(gameState));
    } else {
      // If this client is not the host, overwrite local values with server values
      if (this.serverState) {
        pongLogic.ballSpeed = this.serverState.pongLogic.ballSpeed;
        pongLogic.ballSize = this.serverState.pongLogic.ballSize;
        pongLogic.lastWinner = this.serverState.pongLogic.lastWinner;
        pongLogic.lastContact = this.serverState.pongLogic.lastContact;
        pongLogic.lastLoser = this.serverState.pongLogic.lastLoser;

        // Convert received objects back to maps
        settings.paddleSize = new Map(Object.entries(this.serverState.settings.paddleSize));
        settings.paddleLoc = new Map(Object.entries(this.serverState.settings.paddleLoc));

        scores.scores = this.serverState.scores;

        powerUps = new Map(Object.entries(this.serverState.powerUps));
      }
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
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'gameState') {
          this.serverState = data;
          console.log('Received game state from server.', this.serverState);
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


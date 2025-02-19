

class MyWebSocket {
  constructor() {
    this.socket = null;
    this.host;
    this.isSpectator;
  }

  init(settings) {
    this.host = settings.host;
    this.isSpectator = settings.isSpectator;
    this.startWebSocket();
  }

  getPaddlePosition() {
    if (this.serverState && this.serverState.settings) {
      return this.serverState.settings.paddleLoc;
    }
    return null; // Return null if no data is available yet
  }


  sendPaddlePosition(paddleInput, paddleKey) {
    const paddleInfo = {
      settings: {
        paddleKey: paddleKey,
        paddleInput: paddleInput
      }
    }
    this.socket.send(JSON.stringify(paddleInfo))
  }

  update(pongLogic, scores, settings, powerUps) {
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
          paddleSize: settings.paddleSize,
          paddleLoc: settings.paddleLoc,
          // paddleSize: settings.paddleSize,
          // paddleLoc: Object.fromEntries(settings.paddleLoc.entries),
        },
        // powerUps: Object.fromEntries(powerUps),
        // scores: Object.fromEntries(scores.scores),
        powerUps: powerUps,
        scores: scores.scores,
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

        scores.scores = new Map(Object.entries(this.serverState.scores));

        powerUps = new Map(Object.entries(this.serverState.powerUps));
      }
    }
  }

  startWebSocket() {
    console.log("is this called yet");
    const roomName = "test";
    const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPath = this.isSpectator ? 'spectate' : 'room';
    this.socket = new WebSocket(
      `${wsScheme}//${window.location.host}/ws/${wsPath}/${roomName}/`
    );


    this.socket.onopen = () => {
      console.log('Connected to WebSocket');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      if (data.type === "gameState") {
        this.serverState = data; // Store the received game state
      }
    };

    this.socket.onclose = (event) => {
      console.warn('WebSocket connection closed', event);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error.message);
    };
  }
}



export default MyWebSocket;

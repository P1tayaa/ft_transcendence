//paddle_mode
// chat_message
// ctart_game
// update_game
// consumers.py is where you can find all

import { intToPlayerSide, PlayerSide } from './setting.js'


class MyWebSocket {
  constructor() {
    this.socket = null;
    this.host;
    this.isSpectator;

    this.serverState;
    this.winner = "";
    this.game_over = false;
    this.myPos = null;
    this.myPosStruc;
  }

  isPlaying() {
    if (this.serverState) {

      return this.serverState.is_playing;
    } else {
      console.log("server state not on yet");
      return false;
    }
  }

  tryStartGame() {
    this.socket.send(JSON.stringify({ type: 'start_game' }));
  }

  getWhichPadle() {
    console.log(this.myPos);
    if (this.myPos === "left") {
      this.myPosStruc = PlayerSide.LEFT;
    } else if (this.myPos === "right") {
      this.myPosStruc = PlayerSide.RIGHT;
    } else if (this.myPos === "bottom") {
      this.myPosStruc = PlayerSide.BOTTOM;
    } else if (this.myPos === "top") {
      this.myPosStruc = PlayerSide.TOP;
    } else {
      console.error("Invalid position value:", this.myPos);
    }

    return intToPlayerSide(this.myPosStruc);
  }

  async init(settings, roomName) {
    this.host = settings.host;
    this.isSpectator = settings.isSpectator;
    await this.startWebSocket(roomName);
  }

  getPaddlePosition() {
    if (this.serverState && this.serverState.settings) {
      return this.serverState.settings.paddleLoc;
    }
    return null; // Return null if no data is available yet
  }


  sendPaddlePosition(paddleInput, paddleKey, rotation) {
    const paddleInfo = {
      type: 'paddle_move',
      position: paddleInput,
      rotation: rotation,
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

  async startWebSocket(roomName) {
    console.log("is this called yet");
    // const roomName = websocketData.room_name;
    const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPath = this.isSpectator ? 'spectate' : 'room';


    await new Promise((resolve, reject) => {

      this.socket = new WebSocket(
        `${wsScheme}//${window.location.host}/ws/${wsPath}/${roomName}/`
      );


      this.socket.onopen = () => {
        console.log('Connected to WebSocket');
        resolve();
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        // if (data.type === "gameState") {
        //   this.serverState = data; // Store the received game state
        // } else
        if (data.type === "game_state_update") {
          this.serverState = data.state;
          if (data.game_over) {
            this.winner = data.winner;
            this.game_over = true;
          }
        } else if (data.type === "whitch_paddle") {
          this.myPos = data.position;
        }
      };

      this.socket.onclose = (event) => {
        console.warn('WebSocket connection closed', event);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket Error:', error.message);
      };

    });

    this.socket.send(JSON.stringify({ type: "which_paddle" }))
  }
}



export default MyWebSocket;

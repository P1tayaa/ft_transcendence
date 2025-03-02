//paddle_mode
// chat_message
// ctart_game
// update_game
// consumers.py is where you can find all

import { intToPlayerSide, strToPlayerSide, PlayerSide } from './setting.js'


class MyWebSocket {
  constructor() {
    this.socket = null;
    this.host;
    this.isSpectator;
    this.Connected = false;
    this.didReset = true;
    this.serverState = null;
    this.winner = "";
    this.game_over = false;
    this.myPos = null;
    this.myPosStruc = null;
    this.gameStarted = false;
    this.allPlayerReady = false;
  }

  isPlaying() {
    if (this.serverState) {

      return true;
    } else {
      console.log("server state not on yet");
      return false;
    }
  }

  tryStartGame() {
    this.socket.send(JSON.stringify({ type: 'start_game' }));
  }

  async getWhichPadle(socket) {
    await new Promise((resolve) => {
      const intervalId = setInterval(() => {
        if (this.myPos !== null) {
          clearInterval(intervalId);
          resolve(this.myPos);
        }
      }, 100);
    });


    this.myPosStruc = strToPlayerSide(this.myPos);
    return this.myPosStruc;
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

  sendPaddlePosition(paddleInput, settings, rotation) {
    if (!rotation) {
      rotation = 0;
    }
    let paddleInfo = {
      type: 'paddle_move',
      position: paddleInput[this.myPosStruc] + settings.paddleLoc[this.myPosStruc].position,
      rotation: rotation,
    }
    // console.log(paddleInfo.position);

    this.socket.send(JSON.stringify(paddleInfo))
  }

  getBallPosition() {
    if (this.serverState && this.serverState.settings) {
      return this.serverState.settings.ballSize;
    }
    return null; // Return null if no data is available yet
  }
  sendBallVelocity(ballPos) {
    const ballVelocityRequest = {
      type: "set_ball_velocity",
      x: ballPos.x,
      y: ballPos.y
    }
    console.log(ballVelocityRequest);
    this.socket.send(JSON.stringify(ballVelocityRequest));
  }

  resetRound(pongLogic) {

    let request = {
      type: "reset_round",
      lastWinner: intToPlayerSide(pongLogic.lastWinner),
      lastLoser: "",
    }
    if (!pongLogic.lastLoser) {
      request.lastLoser = intToPlayerSide(3 - pongLogic.lastWinner);
    } else {
      request.lastLoser = intToPlayerSide(pongLogic.lastWinner);

    }
    console.log(request)
    this.socket.send(JSON.stringify(request));
  }



  update(pongLogic, scores, settings, powerUps) {
    // if (this.host) {
    //   const update = {
    //     type: "set_ball_velocity",
    //     x: 0,
    //     y: 0,
    //   }
    //   this.socket.send(JSON.stringify(update));
    // }
    // if (this.host) {
    //   // Convert maps to plain objects before sending
    //   const gameState = {
    //     type: 'gameState',
    //     pongLogic: {
    //       ballPos: pongLogic.ballPos,
    //       ballSpeed: pongLogic.ballSpeed,
    //       ballSize: pongLogic.ballSize,
    //       lastWinner: pongLogic.lastWinner,
    //       lastContact: pongLogic.lastContact,
    //       lastLoser: pongLogic.lastLoser,
    //     },
    //     settings: {
    //       paddleSize: settings.paddleSize,
    //       paddleLoc: settings.paddleLoc,
    //       // paddleSize: settings.paddleSize,
    //       // paddleLoc: Object.fromEntries(settings.paddleLoc.entries),
    //     },
    //     // powerUps: Object.fromEntries(powerUps),
    //     // scores: Object.fromEntries(scores.scores),
    //     powerUps: powerUps,
    //     scores: scores.scores.scores,
    //   };
    //   this.socket.send(JSON.stringify(gameState));
    // } else {
    // If this client is not the host, overwrite local values with server values
    if (this.serverState) {
      pongLogic.ballPos = this.serverState.pongLogic.ballPos;
      pongLogic.ballSpeed = this.serverState.pongLogic.ballSpeed;
      pongLogic.ballSize = this.serverState.pongLogic.ballSize;
      pongLogic.lastWinner = this.serverState.pongLogic.lastWinner;
      pongLogic.lastContact = this.serverState.pongLogic.lastContact;
      pongLogic.lastLoser = this.serverState.pongLogic.lastLoser;

      // Convert received objects back to maps
      if (this.serverState.settings.paddleSize)
        settings.paddleSize = this.serverState.settings.paddleSize;
      if (this.serverState.settings.paddleLoc)
        settings.paddleLoc = this.serverState.settings.paddleLoc;
      // settings.paddleLoc = new Map(Object.entries(this.serverState.settings.paddleLoc));
      if (this.serverState.score) {
        // console.log("-------- was send score")
        scores.scores = this.serverState.score;
        // console.log(scores.scores)
      }
      if (settings.powerup)
        powerUps = this.serverState.powerUps;
      // console.log(settings.paddleSize, settings.paddleLoc, scores.scores)
    }
    // }
  }

  async askAllReady() {
    console.log("askAllReady")
    const playerRequest = {
      type: 'is_all_players_ready',
    }
    this.socket.send(JSON.stringify(playerRequest))
  }


  async player_ready() {
    console.log("setting player ready")
    const playerRequest = {
      type: 'player_ready',
    }
    this.socket.send(JSON.stringify(playerRequest))

  }

  async updateScore(pongLogic) {
    const request = {
      type: 'update_score',
      scoring_position: intToPlayerSide(pongLogic.lastWinner)
    }
    this.socket.send(JSON.stringify(request))
    console.log("send you this: ", request)
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
        this.Connected = true;
        console.log('Connected to WebSocket');
        resolve();
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log("message receive :", event.data)
        // if (data.type === "gameState") {
        //   this.serverState = data; // Store the received game state
        // } else
        if (data.type === "game_state_update") {

          // console.log('Received:', data);
          this.serverState = data.state;
          if (data.game_over) {
            this.winner = data.winner;
            this.game_over = true;
          }
        } else if (data.type === "which_paddle") {
          console.log("assked witch paddle I was")
          this.myPos = data.position;
        } else if (data.type === "started_game") {
          console.log("started_game")
          this.serverState = data.state;
          this.gameStarted = true;
        } else if (data.type === "failed_to_start_game") {
          // console.log(data.state);
          console.log("failed_to_start_game", data.checks);
          // console.log(data.config_player_count);
        } else if (data.type === 'all_players_ready') {

          console.log('all_players_ready:', data.value);
          this.allPlayerReady = data.value;
        } else if (data.type === "error") {
          console.error(event.data);
        } else if (data.type === "errors") {
          console.error(event.data);
        } else if (data.type === "reset_round") {
          console.log("reset_round")
          this.didReset = true;
        }

      };

      this.socket.onclose = (event) => {
        console.warn('WebSocket connection closed', event);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket Error:', error.message);
      };

    });

    // this.socket.send(JSON.stringify({ type: "which_paddle" }));
    console.log("finished with connecting to websocket ");
  }

}



export default MyWebSocket;

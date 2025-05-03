import { intToPlayerSide } from './setting.js'

import Socket from '../../../../socket.js';

export class MyWebSocket {
  constructor() {
    this.socket = null;
    this.didReset = true;
    this.serverState = null;
    this.winner = "";
    this.mySide = null;
    this.gameOver = false
  }

  init(socket, side) {
    console.log("Overwriting socket for side", side);
    this.socket = socket;
    this.mySide = side;

    this.socket.handleMessage = (data) => {
      if (data.type === "game_state_update") {
        this.serverState = data.state;
      } else if (data.type === "reset_round") {
        console.log("Resetting round");
        this.didReset = true;
      } else if (data.type === "player_disconnected") {
        console.log("Player disconnected:", data.user_id);
        this.gameOver = true
      } else if (data.type === "game_end") {
        console.log("Game ended");
        this.winner = data.winner;
      } else {
        console.log("Unknown message type received:", data.type);
      }
    };

    socket.onclose = (event) => {
      this.endGame = true
      console.warn('WebSocket connection closed', event);
    };
  }

  startGame() {
    this.socket.send(JSON.stringify({'type': 'start_game'}));
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

    console.log("moving paddle", this.mySide, paddleInput[this.mySide], settings.paddleLoc[this.mySide].position);

    let paddleInfo = {
      type: 'paddle_move',
      position: settings.paddleLoc[this.mySide].position + paddleInput[this.mySide],
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
    console.log("reset round request sent")
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

  update(pongLogic, scores, settings) {
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
      if (this.serverState.score) {
        scores.scores = this.serverState.score;
      }
      if (settings.powerup)
        powerUps = this.serverState.powerUps;
    }
  }

  async endGame() {
    this.socket.send(JSON.stringify({type: 'game_end'}));
  }

  async updateScore(pongLogic) {
    const request = {
      type: 'update_score',
      scoring_position: intToPlayerSide(pongLogic.lastWinner)
    }
    this.socket.send(JSON.stringify(request))
  }
}



export default MyWebSocket;

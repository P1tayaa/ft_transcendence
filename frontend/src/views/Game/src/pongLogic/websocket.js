import { intToPlayerSide } from './setting.js'

import Socket from '../../../../socket.js';

export class MyWebSocket {
	constructor() {
		this.socket = null;
		this.didReset = true;
		this.serverState = null;
		this.mySide = null;
		this.gameOver = false;
		this.gameResult = null;
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
			} else if (data.type === "game_over") {
				console.log("Game over received:", data);
				this.gameOver = true;
				this.gameResult = {
					result: data.result,
					winner: data.winner,
					tournament: data.tournament
				};
			} else {
				console.log("Unknown message type received:", data.type);
			}
		};

		socket.onclose = (event) => {
			this.gameOver = true;
			console.warn('WebSocket connection closed', event);
		};
	}

	startGame() {
		this.socket.send({'type': 'start_game'});
	}

	getPaddlePosition() {
		if (!this.serverState || !this.serverState.settings) {
			return null;
		}
		return this.serverState.settings.paddleLoc;
	}

	sendPaddlePosition(paddleInput, settings, rotation) {
		if (!rotation) {
			rotation = 0;
		}

		let paddleInfo = {
			type: 'paddle_move',
			position: settings.paddleLoc[this.mySide].position + paddleInput[this.mySide],
			rotation: rotation,
		}

		this.socket.send(paddleInfo)
	}

	getBallPosition() {
		if (!this.serverState || !this.serverState.settings) {
			return null;
		}
		return this.serverState.settings.ballSize;
	}

	sendBallVelocity(ballPos) {
		const ballVelocityRequest = {
			type: "set_ball_velocity",
			x: ballPos.x,
			y: ballPos.y
		}
		console.log(ballVelocityRequest);
		this.socket.send(ballVelocityRequest);
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
		this.socket.send(request);
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
		}
	}

	async updateScore(pongLogic) {
		const request = {
			type: 'update_score',
			scoring_position: intToPlayerSide(pongLogic.lastWinner)
		}
		this.socket.send(request);
	}
}



export default MyWebSocket;

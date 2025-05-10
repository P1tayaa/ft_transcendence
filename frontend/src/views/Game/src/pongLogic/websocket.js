import { intToPlayerSide } from './setting.js'

import router from '../../../../router.js'

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
		this.socket = socket;
		this.mySide = side;

		this.socket.handleMessage = (data) => {
			if (data.type === "game_state_update") {
				this.serverState = data.state;
			} else if (data.type === "reset_round") {
				console.debug("Resetting round");
				this.didReset = true;
			} else if (data.type === "game_over") {
				console.debug("Game over received:", data);
				this.gameOver = true;

				if (data.tournament) {
					router.navigate(`/tournament/${data.tournament.name}`);
				} else {
					this.showGameOver(data.winner);
				}

			} else {
				console.warn("Unknown message type received:", data.type);
			}
		};

		socket.onclose = (event) => {
			this.gameOver = true;
			console.debug('WebSocket connection closed', event);
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

		this.socket.send(request);
	}

	update(pongLogic, settings) {
		if (this.serverState) {
			pongLogic.ballPos = this.serverState.pongLogic.ballPos;
			pongLogic.ballSpeed = this.serverState.pongLogic.ballSpeed;
			pongLogic.ballSize = this.serverState.pongLogic.ballSize;
			pongLogic.lastWinner = this.serverState.pongLogic.lastWinner;
			// pongLogic.lastContact = this.serverState.pongLogic.lastContact;
			// if (!pongLogic.lastContact) {
			// 	pongLogic.lastContact = "null"
			// }
			pongLogic.lastLoser = this.serverState.pongLogic.lastLoser;

			// Convert received objects back to maps
			if (this.serverState.settings.paddleSize)
				settings.paddleSize = this.serverState.settings.paddleSize;
			if (this.serverState.settings.paddleLoc)
				settings.paddleLoc = this.serverState.settings.paddleLoc;
			if (this.serverState.score) {
				pongLogic.scores = this.serverState.score;
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

	// Show game over screen when game ends
	showGameOver(winner) {
		const waitingElement = document.getElementById('game-waiting');
		const gameOverElement = document.getElementById('game-over');
		const canvasElement = document.getElementById('pong-game');
		const resultMessage = document.getElementById('game-result-message');

		if (waitingElement) {
			waitingElement.style.display = 'none';
		}
		
		if (canvasElement) {
			canvasElement.style.display = 'none';
		}
		
		if (gameOverElement) {
			gameOverElement.style.display = 'flex';
		}
		
		if (resultMessage) {
			resultMessage.innerText = `Game Over! ${winner.username} wins!`;
		}
	}
}



export default MyWebSocket;

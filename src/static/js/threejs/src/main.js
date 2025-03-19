
// src/main.js
import * as THREE from 'three';
import Init from './init.js';
import { Mode } from "./pongLogic/setting.js";
import { updateLightsForActivePlayers } from "./modelLoading/light_manage.js";
import { botControl } from './bot.js';

var gameEnded = false

class main {
	constructor() {

		this.init = new Init();
		this.gameScene = null;
		this.animate = this.animate.bind(this);
	}

	init_function() {

		console.log("les voiture sont rouges");
		this.gameScene = this.init.gameScene;

		this.scene = this.gameScene.getScene();
		this.lightManager = this.init.lightManager;
		this.pongLogic = this.init.pongLogic;
		this.score = this.init.score;
		if (this.init.settings.powerup)
			this.allPowers = this.init.allPower;

		const canvas = document.getElementById('pong-game');
		if (!canvas) {
			console.error('Canvas element with id "pong-game" not found.');
			return;
		}

		this.renderer = new THREE.WebGLRenderer({ canvas });
		this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		this.camera = new THREE.PerspectiveCamera(120, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
		this.camera.position.z = 30;


		// this.allPowers.activatePowerUp('Star')
		this.renderer.setAnimationLoop(this.animate);

	}
	animate() {

		try {

			if (this.init.doneLoadingAssets === false) {
				return;
			}
			if (this.init.settings.mode === Mode.NETWORKED) {
				if (this.init.settings.powerup) {
					this.pongLogic.socket.update(this.pongLogic, this.init.score, this.init.settings, this.init.allPower.powerUps);
				} else {
					var temp = this.pongLogic.socket.update(this.pongLogic, this.init.score, this.init.settings);
					if (this.pongLogic.socket.endGame) {
						this.game_done()
					}
				}
			}
			if (this.init.settings.mode === Mode.NETWORKED) {
				if (!this.init.settings.host) {
					const newBallPos = lerpVectors(this.gameScene.getAssetPossition('Ball'), { x: this.pongLogic.ballPos.x, y: this.pongLogic.ballPos.y, z: 0 }, 0);
					this.gameScene.moveAsset('Ball', newBallPos);
				} else {
					const newBallPos = { x: this.pongLogic.ballPos.x, y: this.pongLogic.ballPos.y, z: 0 };
					// console.log(newBallPos)
					this.gameScene.moveAsset('Ball', newBallPos);
				}
			} else { }

			if (this.init.settings.powerup && this.init.settings.mode !== Mode.NETWORKED) {
				this.allPowers.update(this.gameScene, this.pongLogic);
			}

			if (this.init.settings.bots) {
				botControl(this.init.settings, this.gameScene.getAssetPossition('Ball'));
			}



			const input = this.init.controlHandler.getPaddleSpeeds();
			if (this.pongLogic.socket.didReset) {
				var temp = this.pongLogic.update(input, this.gameScene);
				if (temp === "shit") {
					this.game_done()
				}
			}
			// let Paddle2Win = 0;
			// let Paddle1Win = 0;
			// let Ball_Reset = false;

			// if (this.pongLogic.paddleCollided) {
			//   Paddle2Win = 0;
			//   Paddle1Win = 0;
			//   Ball_Reset = false;
			// }
			this.pongLogic.settings.playerSide.forEach(side => {
				this.score.updateScoreDisplay(side)
			})


			if (this.pongLogic.resetBall === true && this.init.settings.host === true) {
				console.log("this.pongLogic.resetBall", this.pongLogic.resetBall);
				this.pongLogic.resetBall = false;
				this.pongLogic.reset(this.init);

				this.pongLogic.socket.didReset = false;
			}
			console.log(this.score.scores)
			this.score.playerSides.forEach(side => {
				if (this.score.scores[side] > 11) {
					this.game_done();
				}
			});

			updateLightsForActivePlayers(this.init.lightManager, this.gameScene, this.init.settings.playerSide, this.pongLogic.lastWinner)
			if (this.init.settings.mode === Mode.NETWORKED) {
			} else {
				const ballCurrentSpeed = { x: this.pongLogic.ballSpeed.x, y: this.pongLogic.ballSpeed.y, z: 0 };
				this.gameScene.moveAssetBy('Ball', ballCurrentSpeed);
			}
			this.renderer.render(this.scene, this.camera);
		} catch(error) {
			console.log(error)
			this.game_done()
		}

	}


	async game_done() {
		if (gameEnded)
			return
		gameEnded = true
		if (this.pongLogic.settings === Mode.NETWORKED) {
			await this.socket.socket_game_done()

		} else {
			// add a post request to send backend the score of solo
		}

		window.location.href = "../gameOver"
	}
}

async function startGame(config = null, roomName = null) {
	const mainClass = new main();

	try {
		await mainClass.init.initialize(config, roomName);
	} catch (error) {
		console.error('Initialization failed:', error);
	}
}

window.startGame = startGame;

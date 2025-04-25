// src/main.js
import * as THREE from 'three';
import Init from './init.js';
import { Mode } from "./pongLogic/setting.js";
import { updateLightsForActivePlayers } from "./modelLoading/light_manage.js";
import { botControl } from './bot.js';
import router from '../../../router.js';

var gameEnded = false

export default class Game {
	constructor() {
		this.init = new Init();
		this.gameScene = null;
		this.animate = this.animate.bind(this);
	}

	async initialize(config) {
		try {
			// Initialize everything except the socket connection
			await this.init.initialize(config);
			return true;
		} catch (error) {
			console.error('Initialization failed:', error);
			return false;
		}
	}
	
	async start(socket, side) {
		if (this.init.settings.mode === Mode.NETWORKED && socket) {
			this.init.pongLogic.socket.init(socket, side);
		}

		this.init.controlHandler.Init(this.init.pongLogic.socket);
		this.setupRenderer();
		
		// Start the animation loop
		console.log("Game starting!");

		this.renderer.setAnimationLoop(this.animate);
	}

	setupRenderer() {
		this.gameScene = this.init.gameScene;

		this.scene = this.gameScene.getScene();
		this.lightManager = this.init.lightManager;
		this.pongLogic = this.init.pongLogic;
		this.score = this.init.score;

		const canvas = document.getElementById('pong-game');
		if (!canvas) {
			console.error('Canvas element with id "pong-game" not found.');
			return;
		}

		this.renderer = new THREE.WebGLRenderer({ canvas });
		this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
		this.camera = new THREE.PerspectiveCamera(120, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
		this.camera.position.z = 30;
	}

	animate() {
		try {
			if (this.init.settings.mode === Mode.NETWORKED) {
				this.pongLogic.socket.update(this.pongLogic, this.init.score, this.init.settings);
				if (this.pongLogic.socket.gameOver) {
					this.game_done()
				}

				const newBallPos = { x: this.pongLogic.ballPos.x, y: this.pongLogic.ballPos.y, z: 0 };
				// console.log(newBallPos)
				this.gameScene.moveAsset('Ball', newBallPos);
			}

			const input = this.init.controlHandler.getPaddleSpeeds();
			if (this.pongLogic.socket.didReset || this.init.settings.mode !== Mode.NETWORKED) {
				this.pongLogic.update(input, this.gameScene);
			}

			this.pongLogic.settings.playerSide.forEach(side => {
				this.score.updateScoreDisplay(side)
			})

			this.score.playerSides.forEach(side => {
				if (this.score.scores[side] > 11) {
					this.game_done();
				}
			});

			updateLightsForActivePlayers(this.init.lightManager, this.gameScene, this.init.settings.playerSide, this.pongLogic.lastWinner)

			if (this.init.settings.mode === Mode.LOCAL) {
				const ballCurrentSpeed = { x: this.pongLogic.ballSpeed.x, y: this.pongLogic.ballSpeed.y, z: 0 };
				this.gameScene.moveAssetBy('Ball', ballCurrentSpeed);
			}

			this.renderer.render(this.scene, this.camera);
		} catch (error) {
			console.log(error)
			this.game_done()
		}
	}


	async game_done() {
		this.renderer.setAnimationLoop(null);

		if (this.pongLogic.settings.mode === Mode.NETWORKED) {
			await this.socket.endGame()
		}

		// router.navigate('/');
	}
}

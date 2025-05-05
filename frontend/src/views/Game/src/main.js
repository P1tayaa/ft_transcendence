// src/main.js
import * as THREE from 'three';
import Init from './init.js';
import { Mode } from "./pongLogic/setting.js";
import { updateLightsForActivePlayers } from "./modelLoading/light_manage.js";

import router from '../../../router.js';

export default class Game {
	constructor() {
		this.init = new Init();
		this.gameScene = null;
		this.animate = this.animate.bind(this);
	}

	async initialize(map, playercount, local = true) {
		await this.init.initialize(map, playercount, local);
		this.pongLogic = this.init.pongLogic;
		this.score = this.init.score;
		this.gameScene = this.init.gameScene;

		return true;
	}

	async startOnline(socket, side, isHost) {
		this.init.pongLogic.socket.init(socket, side);
		this.pongLogic.isHost = isHost;

		this.init.controlHandler.Init(side);
		this.setupRenderer();

		this.renderer.setAnimationLoop(this.animate);

		console.debug("Game starting in online mode!");
	}

	async startLocal() {
		this.setupRenderer();

		this.init.controlHandler.Init();

		this.renderer.setAnimationLoop(this.animate);

		console.debug("Game starting in local mode!");
	}

	setupRenderer() {
		this.scene = this.gameScene.getScene();
		this.lightManager = this.init.lightManager;

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
				this.gameScene.moveAsset('Ball', newBallPos);
			}

			const input = this.init.controlHandler.getPaddleSpeeds();
			if (this.pongLogic.socket.didReset || this.init.settings.mode !== Mode.NETWORKED) {
				this.pongLogic.update(input, this.gameScene);
			}
			if (this.pongLogic.isHost){
				this.pongLogic.update(input, this.gameScene);
				if (this.pongLogic.resetBall && this.pongLogic.isHost) {
					this.pongLogic.resetBall = false
					this.pongLogic.reset(this.init)
				}
			}
			if (this.init.settings.mode !== Mode.NETWORKED && this.pongLogic.resetBall){
				this.pongLogic.resetBall = false
				this.pongLogic.reset(this.init)
			}

			this.pongLogic.settings.playerSide.forEach(side => {
				this.score.updateScoreDisplay(side)
			})

			this.score.playerSides.forEach(side => {
				if (this.score.scores[side] >= 5) {
					this.game_done();

					if (this.init.settings.mode === Mode.LOCAL) {
						router.navigate('/');
					}
				}
			});

			updateLightsForActivePlayers(this.init.lightManager, this.gameScene, this.init.settings.playerSide, this.pongLogic.lastWinner)

			if (this.init.settings.mode === Mode.LOCAL) {
				const ballCurrentSpeed = { x: this.pongLogic.ballSpeed.x, y: this.pongLogic.ballSpeed.y, z: 0 };
				this.gameScene.moveAssetBy('Ball', ballCurrentSpeed);
			}

			this.renderer.render(this.scene, this.camera);
		} catch (error) {
			console.error(error)
			this.game_done()
		}
	}

	game_done() {
		if (!this.renderer) {
			return;
		}

		this.renderer.setAnimationLoop(null);

		this.renderer.dispose();
	}
}

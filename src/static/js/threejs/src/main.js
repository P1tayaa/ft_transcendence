
// src/main.js
import * as THREE from 'three';
import Init from './init.js';
import { intToPlayerSide, Mode } from "./pongLogic/setting.js";
import { updateLightsForActivePlayers } from "./modelLoading/light_manage.js";
import { botControl } from './bot.js';

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
    // const controlHandler = init.controlHandler;
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
    if (this.init.doneLoadingAssets === false) {
      // Assets are still loading; skip rendering
      return;
    }
    if (this.init.settings.mode === Mode.NETWORKED) {
      if (this.init.settings.powerup) {
        this.pongLogic.socket.update(this.pongLogic, this.init.score, this.init.settings, this.init.allPower.powerUps);
      } else {
        this.pongLogic.socket.update(this.pongLogic, this.init.score, this.init.settings);
      }
    }


    if (this.init.settings.powerup) {
      this.allPowers.update(this.gameScene, this.pongLogic);
    }

    if (this.init.settings.bots) {
      botControl(this.init.settings, this.gameScene.getAssetPossition('Ball'));
    }


    const input = this.init.controlHandler.getPaddleSpeeds();

    this.pongLogic.update(input, this.gameScene);
    let Paddle2Win = 0;
    let Paddle1Win = 0;
    let Ball_Reset = false;

    if (this.pongLogic.paddleCollided) {
      Paddle2Win = 0;
      Paddle1Win = 0;
      Ball_Reset = false;
    }

    if (this.pongLogic.resetBall) {
      this.init.score.incrementScore(intToPlayerSide(this.pongLogic.lastWinner));
      Ball_Reset = true;
      this.pongLogic.resetBall = false;
      this.gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
    }

    updateLightsForActivePlayers(this.init.lightManager, this.gameScene, this.init.settings.playerSide, this.pongLogic.lastWinner)

    const ballCurrentSpeed = { x: this.pongLogic.ballSpeed.x, y: this.pongLogic.ballSpeed.y, z: 0 };
    this.gameScene.moveAssetBy('Ball', ballCurrentSpeed);

    this.renderer.render(this.scene, this.camera);
  }



}







let startInit = false;
let config = null;
let roomName;

document.addEventListener("startGame", (event) => {
  const detail = event.detail;
  config = detail.gameConfig;
  roomName = detail.room_name;
  console.log("config received my pong game", config);
  console.log("room_name received my pong game", roomName)

  startInit = true;
  console.log("Game event received! Initializing...");
});

document.addEventListener('DOMContentLoaded', () => {

  const mainClass = new main();

  let wait_please = false;
  // Create a promise that resolves when initialization is complete
  const waitForInit = new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (startInit) {
        clearInterval(interval);
        try {
          await mainClass.init.initialize(config, roomName);
          wait_please = true;
          resolve();  // Resolve the promise once initialization is complete
        } catch (error) {
          reject(error);  // Reject the promise if an error occurs during initialization
        }
      }
    }, 100);
  });

  // Use the promise to wait for initialization to complete
  waitForInit
    .then(() => {
      console.log("Initialization complete, you should not print 'please'");
      mainClass.init_function();
    })
    .catch((error) => {
      console.error('Initialization failed:', error);
    });

  // const wait_please_interval = setInterval(() => {
  //   if (wait_please) {
  //     clearInterval(wait_please_interval)
  //
  //   }
  // }, 100)



});


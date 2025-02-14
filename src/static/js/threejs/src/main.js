
// src/main.js
import * as THREE from 'three';
import Init from './init.js';
import { intToPlayerSide, Mode } from "./pongLogic/setting.js";
import { updateLightsForActivePlayers } from "./modelLoading/light_manage.js";



let startInit = false;
let config = null;
let datainfo = null;

document.addEventListener("startGame", (event) => {
  const detail = event.detail;
  config = detail.gameConfig;
  datainfo = detail.dataInfo;
  console.log(config);
  console.log(datainfo)

  startInit = true;
  console.log("Game event received! Initializing...");
});

document.addEventListener('DOMContentLoaded', () => {
  const init = new Init();

  const waitForInit = setInterval(() => {
    if (startInit) {
      clearInterval(waitForInit);
      init.initialize(config, datainfo);
    }
  }, 100);

  const gameScene = init.gameScene;

  const scene = gameScene.getScene();
  const lightManager = init.lightManager;
  // const controlHandler = init.controlHandler;
  const pongLogic = init.pongLogic;
  const score = init.score;
  const allPowers = init.allPower;

  const canvas = document.getElementById('pong-game');
  if (!canvas) {
    console.error('Canvas element with id "pong-game" not found.');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  const camera = new THREE.PerspectiveCamera(120, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 30;

  allPowers.activatePowerUp('Star')

  function animate() {
    if (init.doneLoadingAssets === false) {
      // Assets are still loading; skip rendering
      return;
    }

    allPowers.update(gameScene, pongLogic);


    const input = init.controlHandler.getPaddleSpeeds();

    pongLogic.update(input, gameScene);
    if (init.settings.mode === Mode.NETWORKED) {
      pongLogic.socket.update(pongLogic, init.score, init.settings, init.allPower.powerUps);
    }
    let Paddle2Win = 0;
    let Paddle1Win = 0;
    let Ball_Reset = false;

    if (pongLogic.paddleCollided) {
      Paddle2Win = 0;
      Paddle1Win = 0;
      Ball_Reset = false;
    }

    if (pongLogic.resetBall) {
      init.score.incrementScore(intToPlayerSide(pongLogic.lastWinner));
      Ball_Reset = true;
      pongLogic.resetBall = false;
      gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
    }

    updateLightsForActivePlayers(init.lightManager, gameScene, init.settings.playerSide, pongLogic.lastWinner)

    const ballCurrentSpeed = { x: pongLogic.ballSpeed.x, y: pongLogic.ballSpeed.y, z: 0 };
    gameScene.moveAssetBy('Ball', ballCurrentSpeed);

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});


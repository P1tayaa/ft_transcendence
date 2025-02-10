
// src/main.js
import * as THREE from 'three';
import Init from './init.js';
import { intToPlayerSide } from "./pongLogic/setting.js";
import updateLightPositions, { updateLightsForActivePlayers } from "./modelLoading/light_manage.js";

document.addEventListener('DOMContentLoaded', () => {
  const init = new Init();
  init.initialize();

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

    allPowers.update(gameScene);


    const input = init.controlHandler.getPaddleSpeeds();

    pongLogic.update(input, gameScene);

    let Paddle2Win = 0;
    let Paddle1Win = 0;
    let Ball_Reset = false;

    if (pongLogic.paddleCollided) {
      Paddle2Win = 0;
      Paddle1Win = 0;
      Ball_Reset = false;
    }

    // Handle Ball Reset
    if (pongLogic.resetBall) {
      init.score.incrementScore(intToPlayerSide(pongLogic.lastWinner));
      Ball_Reset = true;
      pongLogic.resetBall = false;
      gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
    }

    // Update Lights
    updateLightsForActivePlayers(init.lightManager, gameScene, init.settings.playerSide, pongLogic.lastWinner)

    // Move Ball
    const ballCurrentSpeed = { x: pongLogic.ballSpeed.x, y: pongLogic.ballSpeed.y, z: 0 };
    gameScene.moveAssetBy('Ball', ballCurrentSpeed);
    // gameScene.update();
    // Debug Logging
    // if (controlHandler.isDebugEnabled()) {
    //   console.log(BallPos);
    // }

    // Render Scene
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});


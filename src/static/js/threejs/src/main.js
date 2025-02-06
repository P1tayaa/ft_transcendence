
// src/main.js
import * as THREE from 'three';
import Init from './init.js';

document.addEventListener('DOMContentLoaded', () => {
  const init = new Init();
  init.initialize();

  const gameScene = init.gameScene;
  const scene = gameScene.getScene();
  const lightManager = init.lightManager;
  const controlHandler = init.controlHandler;
  const pongLogic = init.pongLogic;
  const score = init.score;

  const canvas = document.getElementById('pong-game');
  if (!canvas) {
    console.error('Canvas element with id "pong-game" not found.');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  const camera = new THREE.PerspectiveCamera(120, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 30;

  controlHandler.setupControls();

  let Paddle2Win = 0;
  let Paddle1Win = 0;
  let Ball_Reset = false;

  function animate() {
    if (init.assetsLoaded !== init.totalAssets) {
      // Assets are still loading; skip rendering
      return;
    }

    const { left, right } = controlHandler.getPaddleSpeeds();

    // Move Paddles
    gameScene.moveAssetBy('Padle1', { x: 0, y: left, z: 0 });
    gameScene.moveAssetBy('Padle2', { x: 0, y: right, z: 0 });

    // Get Positions
    const BallPos = gameScene.getAssetPossition('Ball');
    const Paddle1Pos = gameScene.getAssetPossition('Padle1');
    const Paddle2Pos = gameScene.getAssetPossition('Padle2');

    // Check Collisions
    pongLogic.checkCollisions(BallPos, Paddle1Pos, Paddle2Pos);
    if (pongLogic.paddle_collided) {
      Paddle2Win = 0;
      Paddle1Win = 0;
      Ball_Reset = false;
    }

    // Handle Ball Reset
    if (pongLogic.reset_ball) {
      if (pongLogic.last_winner === 1) {
        Paddle2Win = 2;
        Paddle1Win = 1;
        score.incrementPlayer1Score();
      } else {
        Paddle2Win = 1;
        Paddle1Win = 2;
        score.incrementPlayer2Score();
      }
      Ball_Reset = true;
      gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
    }

    // Update Lights
    lightManager.updateLightPositions(
      BallPos,
      Paddle1Pos,
      Paddle2Pos,
      Ball_Reset,
      Paddle1Win,
      Paddle2Win
    );

    // Move Ball
    const ballCurrentSpeed = { x: pongLogic.ballSpeed.x, y: pongLogic.ballSpeed.y, z: 0 };
    gameScene.moveAssetBy('Ball', ballCurrentSpeed);

    // Debug Logging
    if (controlHandler.isDebugEnabled()) {
      console.log(BallPos);
    }

    // Render Scene
    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});


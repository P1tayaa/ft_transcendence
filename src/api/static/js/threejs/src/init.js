
// src/init/init.js
import GameScene from './modelLoading/loadgltf.js';
import LightManager from './modelLoading/light_manage.js';
import ControlHandler from './control.js';
import Pong from './pongLogic/pong.js';
import Score from './pongLogic/score.js';

const assetsPath = "http://localhost:8000/static/glfw/";


// src/init/loadingScreen.js
export function showLoadingScreen() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading-screen';
  loadingDiv.style.position = 'fixed';
  loadingDiv.style.top = '0';
  loadingDiv.style.left = '0';
  loadingDiv.style.width = '100%';
  loadingDiv.style.height = '100%';
  loadingDiv.style.display = 'flex';
  loadingDiv.style.justifyContent = 'center';
  loadingDiv.style.alignItems = 'center';
  loadingDiv.style.backgroundColor = '#000';
  loadingDiv.style.color = '#fff';
  loadingDiv.style.fontSize = '2em';
  loadingDiv.innerText = 'Loading...';
  document.body.appendChild(loadingDiv);
}

export function hideLoadingScreen() {
  const loadingDiv = document.getElementById('loading-screen');
  if (loadingDiv) {
    loadingDiv.remove();
  }
}


export default class Init {
  constructor() {
    this.assetsLoaded = 0;
    this.totalAssets = 4; // Floor, Paddle1, Paddle2, Ball
    this.gameScene = new GameScene();
    this.lightManager = new LightManager(this.gameScene.getScene());
    this.controlHandler = new ControlHandler();
    this.pongLogic = new Pong();
    this.pongLogic.initialize();
    this.score = new Score(this.gameScene.getScene());
  }

  loadAssets(callback) {
    this.gameScene.loadModel('Floor', `${assetsPath}Floor.glb`, (model) => {
      console.log('Floor model loaded.');
      this.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
      this.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
      this.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
      this.assetsLoaded++;
      this.checkAllAssetsLoaded(callback);
    });

    this.gameScene.loadModel('Padle1', `${assetsPath}padle.glb`, (model) => {
      console.log('Paddle1 model loaded.');
      this.gameScene.moveAsset('Padle1', { x: -40, y: 0, z: 0 });
      this.gameScene.rotateAsset('Padle1', 'x', Math.PI / 2);
      this.gameScene.rotateAsset('Padle1', 'y', Math.PI / 2);
      this.assetsLoaded++;
      this.checkAllAssetsLoaded(callback);
    });

    this.gameScene.loadModel('Padle2', `${assetsPath}padle.glb`, (model) => {
      console.log('Paddle2 model loaded.');
      this.gameScene.moveAsset('Padle2', { x: 40, y: 0, z: 0 });
      this.gameScene.rotateAsset('Padle2', 'x', Math.PI / 2);
      this.gameScene.rotateAsset('Padle2', 'y', Math.PI / 2);
      this.assetsLoaded++;
      this.checkAllAssetsLoaded(callback);
    });

    this.gameScene.loadModel('Ball', `${assetsPath}Ball.glb`, (model) => {
      console.log('Ball model loaded.');
      this.gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
      this.gameScene.rotateAsset('Ball', 'x', Math.PI / 2);
      this.gameScene.rotateAsset('Ball', 'y', Math.PI / 2);
      this.assetsLoaded++;
      this.checkAllAssetsLoaded(callback);
    });
  }

  checkAllAssetsLoaded(callback) {
    if (this.assetsLoaded === this.totalAssets) {
      hideLoadingScreen();
      callback();
    }
  }

  initialize() {
    showLoadingScreen();
    this.loadAssets(() => {
      // Initialize lights, controls, and start the game loop
      this.lightManager.setupLights();
      this.controlHandler.setupControls();
      // You can trigger other initializations here
    });
  }
}

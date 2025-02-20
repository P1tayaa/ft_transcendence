
// src/init/init.js
import GameScene from './modelLoading/loadgltf.js';
import LightManager from './modelLoading/light_manage.js';
import ControlHandler from './control.js';
import Pong from './pongLogic/pong.js';
import Score from './pongLogic/score.js';
import { initPowerUp, AllPowerUp } from './powerUp/AllPowerUp.js';
import { Mode, MapStyle, get_settings, Setting } from "./pongLogic/setting.js";
const assetsPath = "http://localhost:8000/static/glfw/";


import { loadClassicMap, loadBathMap, loadCircleMap, loadRectangleMap } from "./init/loadMap.js";
import { spawnPadles } from './init/loadPadle.js';



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
    this.doneLoadingAssets = false;
    this.assetsLoaded = 0;
    this.totalAssets = 4;
    this.gameScene = new GameScene();
    this.lightManager;
    this.controlHandler;
    this.pongLogic = new Pong();
    this.score;
    this.allPower = new AllPowerUp();
    this.settings;
  }

  loadAssets(callback) {
    initPowerUp(assetsPath, this.gameScene);
    switch (this.settings.mapStyle) {
      case MapStyle.CLASSIC:
        loadClassicMap(assetsPath, callback, this);
        break;
      case MapStyle.BATH:
        loadBathMap(assetsPath, callback, this);
        break;
      case MapStyle.CIRCLE:
        loadCircleMap(assetsPath, callback, this);
        break;
      case MapStyle.RECTANGLE:
        loadRectangleMap(assetsPath, callback, this);
        break;
      default:
        console.error(`Unknown map style: map`);
        break;
    }

    spawnPadles(this.settings, this, assetsPath, callback)


    this.gameScene.loadModel('Ball', `${assetsPath}Ball.glb`, (model) => {
      console.log('Ball model loaded.');
      this.gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
      this.gameScene.rotateAsset('Ball', 'x', Math.PI / 2);
      this.gameScene.rotateAsset('Ball', 'y', Math.PI / 2);
      this.assetsLoaded++;
      this.checkAllAssetsLoaded(callback);
    });
  }

  countAssetToLoad() {
    if (this.settings.playercount == 2) {
      this.totalAssets = 2 + 2;
    } else if (this.settings.playercount == 4) {
      this.totalAssets = 4 + 2;
    } else {
      delete this.settings;
      console.error("player cound was not 2 or 4");
      this.settings = new this.settings();
      this.countAssetToLoad();
      return;
    }
  }

  checkAllAssetsLoaded(callback) {
    console.log(this.assetsLoaded + "= loaded and total =" + this.totalAssets);
    if (this.assetsLoaded === this.totalAssets) {
      callback();
    }
  }

  async waitForGameStart() {
    this.pongLogic.socket.player_ready();
    while (!this.pongLogic.socket.allPlayerReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.pongLogic.socket.tryStartGame()
    }
    console.log("Game has started!");
  };



  async initialize(settings, roomName) {
    showLoadingScreen();
    // try {
    //   const json_settings = await get_settings(0);
    //   console.log(json_settings);
    //   console.log(this.settings);
    // } catch {
    //   console.error('Error: An error occurred. Please try again.', error);
    //   this.settings = new Setting();
    // }
    this.settings = new Setting(settings);
    this.countAssetToLoad();
    await this.pongLogic.initialize(this.settings, roomName);
    this.controlHandler = new ControlHandler(this.settings);
    await this.controlHandler.Init(this.pongLogic.socket);
    this.lightManager = new LightManager(this.gameScene.getScene(), this.settings.playerSide);
    this.score = new Score(this.gameScene.getScene(), this.settings.playerSide);
    this.loadAssets(() => {


      this.doneLoadingAssets = true;

      this.lightManager.setupLights();
    });

    if (this.settings.mode === Mode.NETWORKED)
      await this.waitForGameStart();

    hideLoadingScreen();
  }
}


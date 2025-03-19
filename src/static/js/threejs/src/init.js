
// src/init/init.js
import GameScene from './modelLoading/loadgltf.js';
import LightManager from './modelLoading/light_manage.js';
import ControlHandler from './control.js';
import Pong from './pongLogic/pong.js';
import Score from './pongLogic/score.js';
import { initPowerUp, AllPowerUp } from './powerUp/AllPowerUp.js';
import { Mode, MapStyle, get_settings, Setting } from "./pongLogic/setting.js";
var assetsPath = window.location.protocol + '//' + window.location.host + "/static/glfw/";

import { loadClassicMap, loadBathMap, loadCircleMap, loadRectangleMap } from "./init/loadMap.js";
import { spawnPadles } from './init/loadPadle.js';
import { showLoadingScreen, hideLoadingScreen, updateLoadingScreen } from "./style/intro.js"


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
    this.allPower;
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
    console.log(this.settings.playercount);
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
    while (!this.pongLogic.socket.allPlayerReady) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.pongLogic.socket.tryStartGame()
    console.log("Game has started!");
  };

  async startUpdateLoadingLoop(intervalTime = 100) {
    const intervalId = setInterval(() => {


      if (this.settings.mode === Mode.NETWORKED) {
        let sides = [];
        if (this.pongLogic.socket.myPosStruc) {
          sides[0] = this.pongLogic.socket.myPosStruc;
        }
        updateLoadingScreen(this, sides, this.pongLogic.socket);
      }
      else {
        updateLoadingScreen(this, this.settings.playerSide);
      }
      if (this.doneLoadingAssets) {
        clearInterval(intervalId);
        return;
      }
    }, intervalTime);

    return intervalId;
  }

  async initialize(settings, roomName) {
    // Show loading screen and initialize settings
    showLoadingScreen();
    this.settings = new Setting(settings);

    // Initialize power-ups if enabled in settings
    if (this.settings.powerup) {
      this.allPower = new AllPowerUp();
    }

    // Calculate how many assets need to be loaded
    this.countAssetToLoad();

    // Initialize the Pong game logic
    await this.pongLogic.initialize(this.settings, roomName);

    // Start the loading screen update loop
    this.startUpdateLoadingLoop();

    // Initialize controls
    this.controlHandler = new ControlHandler(this.settings);
    await this.controlHandler.Init(this.pongLogic.socket);

    // Setup lights and score display
    this.lightManager = new LightManager(this.gameScene.getScene(), this.settings.playerSide);
    this.score = new Score(this.gameScene.getScene(), this.settings.playerSide);

    // Load all game assets
    this.loadAssets(() => {
      console.log("Assets finished loading");
      this.doneLoadingAssets = true;

      if (this.settings.mode === Mode.NETWORKED) {
        this.pongLogic.socket.player_ready();
      } else {
        hideLoadingScreen();
      }

      this.lightManager.setupLights();
    });

    // For network mode, wait until all players are ready
    if (this.settings.mode === Mode.NETWORKED) {
      await this.waitForGameStart();
      hideLoadingScreen();
    }
  }
}


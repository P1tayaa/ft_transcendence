// src/init/init.js
import GameScene from './modelLoading/loadgltf.js';
import LightManager from './modelLoading/light_manage.js';
import ControlHandler from './control.js';
import Pong from './pongLogic/pong.js';
import Score from './pongLogic/score.js';
import { Mode, MapStyle, Setting } from "./pongLogic/setting.js";
var assetsPath = window.location.protocol + '//' + window.location.host + "/assets/models/"; // add dynamic path?

import { loadClassicMap, loadBathMap, loadBeachMap, loadLavaMap } from "./init/loadMap.js";
import { spawnPadles } from './init/loadPadle.js';


export default class Init {
  constructor() {
    this.assetsLoaded = 0;
    this.totalAssets;
    this.gameScene = new GameScene();
    this.lightManager;
    this.controlHandler;
    this.pongLogic = new Pong();
    this.score;
    this.allPower;
    this.settings;
  }

  loadAssets() {
    this.totalAssets = 2 + this.settings.playercount;

    switch (this.settings.mapStyle) {
      case MapStyle.CLASSIC:
        loadClassicMap(assetsPath, this);
        break;
      case MapStyle.BATH:
        loadBathMap(assetsPath, this);
        break;
      case MapStyle.Beach:
        loadBeachMap(assetsPath, this);
        break;
      case MapStyle.Lava:
        loadLavaMap(assetsPath, this);
        break;
      default:
        console.error(`Unknown map style: map`);
        break;
    }

    spawnPadles(this.settings, this, assetsPath)

    this.gameScene.loadModel('Ball', `${assetsPath}Ball.glb`, (model) => {
      console.debug('Ball model loaded.');
      this.gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });
      this.gameScene.rotateAsset('Ball', 'x', Math.PI / 2);
      this.gameScene.rotateAsset('Ball', 'y', Math.PI / 2);
      this.assetsLoaded++;
    });
  }

  async waitForAssets() {
    return new Promise((resolve) => {
        const id = setInterval(() => {

        if (this.assetsLoaded === this.totalAssets) {
          console.debug("Assets finished loading");

          clearInterval(id);

          resolve(true);
        }
      }, 100);
    });
  }

  async initialize(map, players, local) {
    // Show loading screen and initialize settings
    this.settings = new Setting(map, players, local);

    // Load all game assets
    this.loadAssets();

    // Start the loading screen update loop
    await this.waitForAssets();

    // Initialize the Pong game logic without socket connection
    this.pongLogic.initialize(this.settings);

    // Initialize controls
    this.controlHandler = new ControlHandler(this.settings);

    // Setup lights and score display
    this.lightManager = new LightManager(this.gameScene.getScene(), this.settings.playerSide);
    this.score = new Score(this.gameScene.getScene(), this.settings.playerSide);

    this.lightManager.setupLights();
  }
}


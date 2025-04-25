
// src/powerUp/AllPowerUp.js

import { PowerUpRegistry, offScreen, PowerUpType } from './powerUp.js';

export class AllPowerUp {
  constructor() {
    this.powerUps = Object.values(PowerUpRegistry);
    this.timer = this.getRandomTime();
  }

  // Activate a power-up by its name
  activatePowerUp(name, scene) {
    const powerUp = this.powerUps.find(p => p.type === name);
    console.log(powerUp);
    if (powerUp && !powerUp.active) {
      powerUp.init(scene); // Initialize the power-up
      console.log(`${name} power-up activated.`);
    }
  }

  // Deactivate a specific power-up by name
  deactivatePowerUp(name, scene) {
    const powerUp = this.powerUps.find(p => p.type === name);
    if (powerUp && powerUp.active) {
      powerUp.activateEffect(scene); // Deactivate its effect
      console.log(`${name} power-up deactivated.`);
    }
  }
  getRandomTime() {
    return Math.floor(Math.random() * (150 - 50) + 500); // Example: 50 to 150 frames
  }

  // Initialize a random power-up
  initRandomPowerUp(scene) {
    const randomPowerUp = this.powerUps[Math.floor(Math.random() * this.powerUps.length)];
    if (randomPowerUp) {
      randomPowerUp.init(scene);
      console.log(`${randomPowerUp.type} power-up initialized.`);
    }
  }

  // Update the active power-ups in the scene
  update(scene, playArea) {
    if (this.timer <= 0) {
      this.initRandomPowerUp(scene); // Initialize a random power-up
      this.timer = this.getRandomTime(); // Reset the timer
    } else {
      this.timer--; // Decrease timer each update
    }

    this.powerUps.forEach(powerUp => {
      if (powerUp.active) {
        powerUp.update(scene, playArea); // Update only active power-ups
      }
    });
  }
}

const PowerUpStartPos = { x: 0, y: 0, z: 0 };
export function initPowerUp(assetsPath, gameScene) {
  let i = 0;
  for (const type in PowerUpType) {
    const modelFile = PowerUpType[type];
    const modelName = type;
    i++;
    gameScene.loadModel(modelFile, `${assetsPath}${modelFile}`, (model) => {
      console.log(`${modelName} model loaded.`);
      gameScene.moveAsset(modelFile, offScreen);
      gameScene.setScale(modelFile, 3);
      gameScene.rotateAsset(modelFile, 'x', Math.PI / 2);
    });
  }
}

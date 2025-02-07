
// src/powerUp/AllPowerUp.js

import { PowerUpRegistry, offScreen, PowerUpType } from './powerUp.js';

export class AllPowerUp {
  constructor() {
    this.powerUps = Object.values(PowerUpRegistry); // Grab all power-ups from the registry
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

  // Update the active power-ups in the scene
  update(scene) {
    this.powerUps.forEach(powerUp => {
      if (powerUp.active) {
        powerUp.update(scene); // Update only active power-ups
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
    gameScene.loadModel(modelName, `${assetsPath}${modelFile}`, (model) => {
      console.log(`${modelName} model loaded.`);
      gameScene.moveAsset(modelName, PowerUpStartPos);
      // gameScene.rotateAsset(modelName, 'y', Math.PI / 2);
    });
  }
}

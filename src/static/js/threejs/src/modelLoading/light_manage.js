

// src/lights/LightManager.js
import * as THREE from 'three';
import { intToPlayerSide } from '../pongLogic/setting.js'

const COLORS = {
  blue: 0x0000ff,
  green: 0x00ff00,
  red: 0xff0000,
  white: 0xffffff,
};


export function updateLightsForActivePlayers(lightManager, gameScene, playerSides, last_winner) {
  const positions = { ball: gameScene.getAssetPossition('Ball') };
  const colorChanges = { ball: false };

  playerSides.forEach(side => {
    positions[side] = gameScene.getAssetPossition(side);
    colorChanges[side] = 0;
  });
  // Determine winner side
  const winnerSide = intToPlayerSide(last_winner);
  // Assign colors if there's a valid winner
  if (winnerSide) {
    colorChanges[winnerSide] = 1; // Winner glows green

    playerSides
      .filter(side => side !== winnerSide) // Get all non-winner sides
      .forEach(side => colorChanges[side] = 2); // Set them to red
  }
  lightManager.updateLightPositions(positions, colorChanges);
}



export default class LightManager {
  constructor(scene, playerSides) {
    this.scene = scene;
    this.playerSides = playerSides; // Dynamically handle players
    this.lights = {};
    this.targets = {};
  }

  setupLights() {
    // Main Light for the ball
    this.lights.mainLight = new THREE.PointLight(COLORS.white, 100, 10000);
    this.lights.mainLight.position.set(0, 0, 10);
    this.scene.add(this.lights.mainLight);
    this.targets.ball = new THREE.Vector3();

    // Create lights for each paddle dynamically
    this.playerSides.forEach((side) => {
      this.lights[side] = new THREE.PointLight(COLORS.white, 100, 10000);
      this.lights[side].position.set(0, 0, 5); // Default position, will update dynamically
      this.scene.add(this.lights[side]);
      this.targets[side] = new THREE.Vector3();
    });
  }

  updateLightPositions(positions, colorChanges) {
    // Update Ball Light
    if (positions.ball) {
      this.targets.ball.copy(positions.ball).setZ(10);
      this.lights.mainLight.position.lerp(this.targets.ball, 0.1);
      this.lights.mainLight.color.set(colorChanges.ball ? COLORS.blue : COLORS.white);
    }

    // Update Paddle Lights dynamically
    this.playerSides.forEach((side) => {
      if (positions[side]) {
        this.targets[side].copy(positions[side]).setZ(10);
        this.lights[side].position.lerp(this.targets[side], 0.2);

        // Set color based on game events
        switch (colorChanges[side]) {
          case 1:
            this.lights[side].intensity = 200;
            this.lights[side].color.set(COLORS.green);
            break;
          case 2:
            this.lights[side].intensity = 200;
            this.lights[side].color.set(COLORS.red);
            break;
          default:
            this.lights[side].intensity = 100;
            this.lights[side].color.set(COLORS.white);
        }
      }
    });
  }
}



// src/lights/LightManager.js
import * as THREE from 'three';

const blue = 0x0000ff;
const green = 0x00ff00;
const red = 0xff0000;
const white = 0xffffff;

export default class LightManager {
  constructor(scene) {
    this.scene = scene;
    this.lights = {
      mainLight: null,
      paddle1Light: null,
      paddle2Light: null,
    };
    this.targets = {
      ball: new THREE.Vector3(),
      paddle1: new THREE.Vector3(),
      paddle2: new THREE.Vector3(),
    };
  }

  setupLights() {
    // Main Light
    this.lights.mainLight = new THREE.PointLight(0xffffff, 100, 10000);
    this.lights.mainLight.position.set(0, 0, 0);
    this.scene.add(this.lights.mainLight);

    // Paddle1 Light
    this.lights.paddle1Light = new THREE.PointLight(0xffffff, 100, 10000);
    this.lights.paddle1Light.position.set(-40, 0, 5);
    this.scene.add(this.lights.paddle1Light);

    // Paddle2 Light
    this.lights.paddle2Light = new THREE.PointLight(0xffffff, 100, 10000);
    this.lights.paddle2Light.position.set(40, 0, 5);
    this.scene.add(this.lights.paddle2Light);
  }

  updateLightPositions(ballPos, paddle1Pos, paddle2Pos, ballColorChange, paddle1ColorChange, paddle2ColorChange) {
    // Update positions with lerp for smooth movement
    this.targets.ball.copy(ballPos).setZ(10);
    this.lights.mainLight.position.lerp(this.targets.ball, 0.1);

    this.targets.paddle1.copy(paddle1Pos).setZ(10);
    this.lights.paddle1Light.position.lerp(this.targets.paddle1, 0.2);

    this.targets.paddle2.copy(paddle2Pos).setZ(10);
    this.lights.paddle2Light.position.lerp(this.targets.paddle2, 0.2);

    // Update colors based on game state
    this.lights.mainLight.color.set(ballColorChange ? blue : white);

    switch (paddle1ColorChange) {
      case 1:
        this.lights.paddle1Light.intensity = 200;
        this.lights.paddle1Light.color.set(green);
        break;
      case 2:
        this.lights.paddle1Light.intensity = 200;
        this.lights.paddle1Light.color.set(red);
        break;
      default:
        this.lights.paddle1Light.intensity = 100;
        this.lights.paddle1Light.color.set(white);
    }

    switch (paddle2ColorChange) {
      case 1:
        this.lights.paddle2Light.intensity = 200;
        this.lights.paddle2Light.color.set(green);
        break;
      case 2:
        this.lights.paddle2Light.intensity = 200;
        this.lights.paddle2Light.color.set(red);
        break;
      default:
        this.lights.paddle2Light.intensity = 100;
        this.lights.paddle2Light.color.set(white);
    }
  }
}

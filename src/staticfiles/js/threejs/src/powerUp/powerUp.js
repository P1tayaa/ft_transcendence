import * as THREE from 'three';
import Init from "../init.js";
import { star_path, circular_path, random_movement, bouncing_slide } from "./powerUpMovement.js";
import { pointUV } from 'three/src/nodes/TSL.js';

export const PowerUpType = {
  Star: "Star.glb",
  Snail: "Snail.glb",
  SpeedUp: "Speedup.glb",
  Grow: "Sniper.glb",
  Magnette: "Magnette.glb",
};


export const offScreen = { x: 200, y: 200, z: 200 };
const powerUpStartPos = { x: 0, y: 0, z: 0 };


// export const PowerUpType = {
//   Star: "Ball.glb",
//   Snail: "Ball.glb",
//   SpeedUp: "Ball.glb",
//   Grow: "Ball.glb",
//   Magnet: "Ball.glb",
// };



// const PowerUpEffect = (paddle) => { };
// const PowerUpDisplacement = (speed, location, scene) => { };

export default class PowerUp {

  constructor(type, effect, displacement) {
    this.size = { x: 1, y: 1 };
    this.speed = { x: 0, y: 0, z: 0 };
    this.type = type;
    this.effect = effect;
    this.active = false;
    this.displacement = displacement;
    this.position = { x: 0, y: 0, z: 0 };
  }

  update(scene, pongLogic) {
    if (!this.active)
      return;
    this.displacement(this.speed, this.position, pongLogic.playArea);
    scene.moveAsset(this.type, this.position)
    const ballPosition = scene.getAssetPossition('Ball');
    const ballSize = pongLogic.ballSize;

    if (this.checkCollision(ballPosition, ballSize)) {
      this.activateEffect(pongLogic.lastContact, scene, pongLogic);
      return;
    }

    pongLogic.settings.playerSide.forEach(Paddle => {
      const playerPosition = scene.getAssetPossition(Paddle);
      const paddleSize = pongLogic.settings.paddleSize[Paddle];

      if (this.checkCollision(playerPosition, paddleSize)) {
        this.activateEffect(Paddle, scene, pongLogic);
      }
    });
  }

  init(scene) {
    this.active = true;
    // scene.doRender(this.type, true);
    this.position.x = powerUpStartPos.x;
    this.position.y = powerUpStartPos.y;
    scene.moveAsset(this.type, powerUpStartPos)
  }


  activateEffect(paddle, scene, pongLogic) {
    this.active = false;
    scene.doRender(this.type, false);
    this.effect(paddle, pongLogic, scene, this);
    scene.moveAsset(this.type, offScreen,)
  }

  checkCollision(objectPosition, objectSize) {
    return (
      this.position.x < objectPosition.x + objectSize.x &&
      this.position.x + this.size.x > objectPosition.x &&
      this.position.y < objectPosition.y + objectSize.y &&
      this.position.y + this.size.y > objectPosition.y
    );
  };
}

const starEffect = (paddle, pongLogic) => {
  console.log("Star power-up activated!");
  pongLogic.defineLastWinner(paddle);
  pongLogic.resetBall = true;
};

const snailEffect = (paddle, pongLogic) => {
  console.log("Snail power-up activated!");
  pongLogic.ballSpeed.x *= 0.5;
  pongLogic.ballSpeed.y *= 0.5;
};

const speedUpEffect = (paddle, pongLogic) => {
  console.log("Speed-up power-up activated!");
  pongLogic.ballSpeed.x *= 2;
  pongLogic.ballSpeed.y *= 2;
};

const growEffect = (paddle, pongLogic, scene) => {
  console.log("Grow power-up activated!");
  scene.setScale(paddle, 1.5);
  pongLogic.settings.paddleSize[paddle].x *= 1.5;
  pongLogic.settings.paddleSize[paddle].y *= 1.5;
};

const magnetteEffect = (paddle, pongLogic, scene, self) => {
  console.log("Magnette power-up activated!");
  const pos = scene.getAssetPossition(paddle); // Paddle position

  // Calculate direction vector to paddle
  let dx = pos.x - self.position.x;
  let dy = pos.y - self.position.y;
  let length = Math.sqrt(dx * dx + dy * dy); // Get distance (magnitude)

  // Normalize the direction vector
  if (length !== 0) {
    dx /= length;
    dy /= length;
  }

  // Maintain the original speed magnitude
  let speedMagnitude = Math.sqrt(self.speed.x * self.speed.x + self.speed.y * self.speed.y);

  self.speed.x = dx * speedMagnitude;
  self.speed.y = dy * speedMagnitude;
};



// PowerUpRegistry stores all power-ups
export const PowerUpRegistry = {
  Star: new PowerUp(PowerUpType.Star, starEffect, star_path),
  Snail: new PowerUp(PowerUpType.Snail, snailEffect, circular_path),
  SpeedUp: new PowerUp(PowerUpType.SpeedUp, speedUpEffect, bouncing_slide),
  Grow: new PowerUp(PowerUpType.Grow, growEffect, bouncing_slide),
  Magnette: new PowerUp(PowerUpType.Magnette, magnetteEffect, circular_path)
};


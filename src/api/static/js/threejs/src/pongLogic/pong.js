

import * as THREE from 'three';

class Pong {
  constructor() {
    this.ballSpeed = { x: 0.5, y: 0 };
    this.paddle1Size = { x: 1, y: 8 };
    this.paddle2Size = { x: 1, y: 8 };
    this.ballSize = { x: 1, y: 1 };
    this.playArea = { width: 100, height: 60 };
    this.ySpeedCap = 50;
    this.reset_ball = false;
    this.last_winner = 0;
    this.paddle_collided = false;
    this.multiSidePush = 0.1; // Multiplier for side pushes
  }

  createBoundingBox(position, size) {
    return {
      min: { x: position.x - size.x / 2, y: position.y - size.y / 2 },
      max: { x: position.x + size.x / 2, y: position.y + size.y / 2 },
    };
  }

  intersectsBox(box1, box2) {
    return (
      box1.min.x < box2.max.x &&
      box1.max.x > box2.min.x &&
      box1.min.y < box2.max.y &&
      box1.max.y > box2.min.y
    );
  }

  checkCollisions(ballPosition3D, paddle1Position3D, paddle2Position3D) {
    const ballPosition = { x: ballPosition3D.x, y: ballPosition3D.y };
    const paddle1Position = { x: paddle1Position3D.x, y: paddle1Position3D.y };
    const paddle2Position = { x: paddle2Position3D.x, y: paddle2Position3D.y };
    const ballBox = this.createBoundingBox(ballPosition, this.ballSize);
    const paddle1Box = this.createBoundingBox(paddle1Position, this.paddle1Size);
    const paddle2Box = this.createBoundingBox(paddle2Position, this.paddle2Size);
    this.paddle_collided = false;
    this.reset_ball = false;
    // Paddle collisions
    if (this.intersectsBox(ballBox, paddle1Box)) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle1Position.y) * this.multiSidePush;
      this.paddle_collided = true
    }

    if (this.intersectsBox(ballBox, paddle2Box)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle2Position.y) * this.multiSidePush;
      this.paddle_collided = true
    }

    // Wall collisions
    if (
      ballPosition.y + this.ballSize.y / 2 >= this.playArea.height / 2 ||
      ballPosition.y - this.ballSize.y / 2 <= -this.playArea.height / 2
    ) {
      this.ballSpeed.y = -this.ballSpeed.y;
    }

    if (Math.abs(ballPosition.x) >= this.playArea.width / 2) {
      console.log("was here")
      this.reset_ball = true;
      if (ballPosition.x > 0)
        this.last_winner = 1;
      else
        this.last_winner = 2;
      this.ballSpeed = { x: 0.5, y: 0 };
    }

    // Cap vertical speed
    if (Math.abs(this.ballSpeed.y) > this.ySpeedCap) {
      this.ballSpeed.y = this.ballSpeed.y < 0 ? -this.ySpeedCap : this.ySpeedCap;
    }
  }
}

export default Pong;


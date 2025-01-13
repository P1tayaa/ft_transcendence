
import * as THREE from 'three';


class Pong {
  constructor() {
    this.ballSpeed = { x: 1, y: 0 };
    this.padle1_size = { x: 1., y: 4. };
    this.padle2_size = { x: 1., y: 4. };
    this.ball_size = { x: 1., y: 1. };
    this.play_area = { width: 150, height: 100 };
    this.y_speed_cap = 50;
  }

  // Helper function to create a bounding box
  createBoundingBox(position, size) {
    return {
      min: { x: position.x - size.x / 2, y: position.y - size.y / 2 },
      max: { x: position.x + size.x / 2, y: position.y + size.y / 2 }
    };
  }

  // Helper function to check if two boxes intersect
  intersectsBox(box1, box2) {
    return (
      box1.min.x < box2.max.x &&
      box1.max.x > box2.min.x &&
      box1.min.y < box2.max.y &&
      box1.max.y > box2.min.y
    );
  }

  checkCollisions(ball_position_3d, padle1_position_3d, padle2_position_3d) {
    const ball_position = { x: ball_position_3d.x, y: ball_position_3d.y };
    const padle1_position = { x: padle1_position_3d.x, y: padle1_position_3d.y };
    const padle2_position = { x: padle2_position_3d.x, y: padle2_position_3d.y };

    const ballBox = this.createBoundingBox(ball_position, this.ball_size);
    const leftPaddleBox = this.createBoundingBox(padle1_position, this.padle1_size);
    const rightPaddleBox = this.createBoundingBox(padle2_position, this.padle2_size);

    // Walls bounding boxes
    const leftWallBox = { min: { x: -this.play_area.width / 2, y: -this.play_area.height / 2 }, max: { x: -this.play_area.width / 2, y: this.play_area.height / 2 } };
    const rightWallBox = { min: { x: this.play_area.width / 2, y: -this.play_area.height / 2 }, max: { x: this.play_area.width / 2, y: this.play_area.height / 2 } };
    const topWallBox = { min: { x: -this.play_area.width / 2, y: this.play_area.height / 2 }, max: { x: this.play_area.width / 2, y: this.play_area.height / 2 } };
    const bottomWallBox = { min: { x: -this.play_area.width / 2, y: -this.play_area.height / 2 }, max: { x: this.play_area.width / 2, y: -this.play_area.height / 2 } };

    if (this.intersectsBox(ballBox, leftPaddleBox)) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x);
      ballSpeed.y += (ball_position.y - padle1_position.y) * multi_side_push;
    }

    if (this.intersectsBox(ballBox, rightPaddleBox)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ball_position.y - padle2_position.y) * multi_side_push;
    }

    if (this.intersectsBox(ballBox, leftWallBox)) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x);
    }

    if (this.intersectsBox(ballBox, rightWallBox)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
    }

    if (this.intersectsBox(ballBox, topWallBox)) {
      this.ballSpeed.y = -Math.abs(this.ballSpeed.y);
    }

    if (this.intersectsBox(ballBox, bottomWallBox)) {
      this.ballSpeed.y = Math.abs(this.ballSpeed.y);
    }

    if (Math.abs(this.ballSpeed.y) > this.y_speed_cap) {
      this.ballSpeed.y = this.ballSpeed.y < 0 ? -y_speed_cap : y_speed_cap;
    }

    if (Math.abs(ball_position.x) >= this.play_area.width / 2) {
      ball_position.set(0, 0, 0); // Reset ball to center
      this.ballSpeed.set(0.1, 0.05, 0); // Reset ball speed
    }
  }
}


export default Pong;

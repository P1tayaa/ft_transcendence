
// src/controllers/ControlHandler.js
export default class ControlHandler {
  constructor() {
    this.leftPaddleSpeed = 0;
    this.rightPaddleSpeed = 0;
    this.debug = false;
    this.padleLeftAcceleration = 0.2;
    this.padleRightAcceleration = 0.2;
  }

  setupControls() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(event) {
    switch (event.key) {
      case 'w':
        this.leftPaddleSpeed = this.padleLeftAcceleration;
        break;
      case 's':
        this.leftPaddleSpeed = -this.padleLeftAcceleration;
        break;
      case 'i':
        this.rightPaddleSpeed = this.padleRightAcceleration;
        break;
      case 'k':
        this.rightPaddleSpeed = -this.padleRightAcceleration;
        break;
      case 'b':
        this.debug = true;
        break;
      default:
        break;
    }
  }

  onKeyUp(event) {
    switch (event.key) {
      case 'w':
      case 's':
        this.leftPaddleSpeed = 0;
        break;
      case 'i':
      case 'k':
        this.rightPaddleSpeed = 0;
        break;
      case 'b':
        this.debug = false;
        break;
      default:
        break;
    }
  }

  getPaddleSpeeds() {
    return {
      left: this.leftPaddleSpeed,
      right: this.rightPaddleSpeed,
    };
  }

  isDebugEnabled() {
    return this.debug;
  }
}

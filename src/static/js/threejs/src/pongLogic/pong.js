
// src/pongLogic/pong.js
import * as THREE from 'three';

class Pong {
  constructor() {
    // Game properties
    this.ballSpeed = { x: 0.5, y: 0 };
    this.paddle1Size = { x: 1, y: 8 };
    this.paddle2Size = { x: 1, y: 8 };
    this.ballSize = { x: 1, y: 1 };
    this.playArea = { width: 100, height: 60 };
    this.ySpeedCap = 50;
    this.reset_ball = false;
    this.last_winner = 0;
    this.paddle_collided = false;
    this.multiSidePush = 0.2;

    // Settings and mode
    this.setterUrlPath = "api/static/js/threejs/settings/test.json"; // Ensure correct path
    this.settings = null;
    this.mode = 'local';
    this.serverUrl = '';
    this.playerSide = 'left';

    // WebSocket
    this.socket = null;
  }

  async initialize() {
    try {
      await this.loadSettings();
      if (this.settings.mode === 'networked') {
        this.mode = 'networked';
        this.serverUrl = this.settings.serverUrl;
        this.playerSide = this.settings.playerSide;

        if (!this.serverUrl || !['left', 'right'].includes(this.playerSide)) {
          throw new Error('Invalid settings for networked mode.');
        }

        this.startWebSocket();
      }
      console.log(`Pong initialized in ${this.mode} mode.`);
    } catch (error) {
      console.error('Failed to initialize Pong:', error);
      this.mode = 'local';
    }
  }

  async loadSettings() {
    const response = await fetch(this.setterUrlPath);
    if (!response.ok) {
      throw new Error('Failed to load settings.json');
    }
    this.settings = await response.json();
  }

  startWebSocket() {
    const wsUrl = `ws://${window.location.host}/ws/socket-server/`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
      // Optionally send initial data if needed
    };

    this.socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'gameState') {
          this.serverBallPosition = data.ballPosition;
          this.serverPaddle1Position = data.paddle1Position;
          this.serverPaddle2Position = data.paddle2Position;
          console.log('Received game state from server.');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
    };
  }

  sendPaddlePosition() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const localPaddlePosition = this.playerSide === 'left'
        ? this.localPaddle1Position
        : this.localPaddle2Position;

      const message = {
        type: 'updatePaddle',
        paddleSide: this.playerSide,
        position: localPaddlePosition,
      };

      this.socket.send(JSON.stringify(message));
      console.log('Sent paddle position to server.');
    }
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
    if (this.mode === 'local') {
      this.localCollisionDetection(ballPosition3D, paddle1Position3D, paddle2Position3D);
    } else if (this.mode === 'networked') {
      this.networkedCollisionDetection();
    }
  }

  localCollisionDetection(ballPosition3D, paddle1Position3D, paddle2Position3D) {
    const ballPosition = { x: ballPosition3D.x, y: ballPosition3D.y };
    const paddle1Position = { x: paddle1Position3D.x, y: paddle1Position3D.y };
    const paddle2Position = { x: paddle2Position3D.x, y: paddle2Position3D.y };
    const ballBox = this.createBoundingBox(ballPosition, this.ballSize);
    const paddle1Box = this.createBoundingBox(paddle1Position, this.paddle1Size);
    const paddle2Box = this.createBoundingBox(paddle2Position, this.paddle2Size);
    this.paddle_collided = false;
    this.reset_ball = false;

    if (this.intersectsBox(ballBox, paddle1Box)) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle1Position.y) * this.multiSidePush;
      this.paddle_collided = true;
      console.log('Collision with left paddle.');
    }

    if (this.intersectsBox(ballBox, paddle2Box)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle2Position.y) * this.multiSidePush;
      this.paddle_collided = true;
      console.log('Collision with right paddle.');
    }

    if (
      ballPosition.y + this.ballSize.y / 2 >= this.playArea.height / 2 ||
      ballPosition.y - this.ballSize.y / 2 <= -this.playArea.height / 2
    ) {
      this.ballSpeed.y = -this.ballSpeed.y;
      console.log('Collision with wall.');
    }

    if (Math.abs(ballPosition.x) >= this.playArea.width / 2) {
      console.log("Ball out of bounds. Resetting ball.");
      this.reset_ball = true;
      this.last_winner = ballPosition.x > 0 ? 1 : 2;
      this.ballSpeed = { x: 0.5, y: 0 };
    }

    if (Math.abs(this.ballSpeed.y) > this.ySpeedCap) {
      this.ballSpeed.y = this.ballSpeed.y < 0 ? -this.ySpeedCap : this.ySpeedCap;
    }
  }

  networkedCollisionDetection() {
    if (!this.serverBallPosition || !this.serverPaddle1Position || !this.serverPaddle2Position) {
      return;
    }

    const ballPosition = { x: this.serverBallPosition.x, y: this.serverBallPosition.y };
    const paddle1Position = { x: this.serverPaddle1Position.x, y: this.serverPaddle1Position.y };
    const paddle2Position = { x: this.serverPaddle2Position.x, y: this.serverPaddle2Position.y };
    const ballBox = this.createBoundingBox(ballPosition, this.ballSize);
    const paddle1Box = this.createBoundingBox(paddle1Position, this.paddle1Size);
    const paddle2Box = this.createBoundingBox(paddle2Position, this.paddle2Size);
    this.paddle_collided = false;
    this.reset_ball = false;

    if (this.intersectsBox(ballBox, paddle1Box)) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle1Position.y) * this.multiSidePush;
      this.paddle_collided = true;
      console.log('Networked collision with left paddle.');
    }

    if (this.intersectsBox(ballBox, paddle2Box)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle2Position.y) * this.multiSidePush;
      this.paddle_collided = true;
      console.log('Networked collision with right paddle.');
    }

    if (
      ballPosition.y + this.ballSize.y / 2 >= this.playArea.height / 2 ||
      ballPosition.y - this.ballSize.y / 2 <= -this.playArea.height / 2
    ) {
      this.ballSpeed.y = -this.ballSpeed.y;
      console.log('Networked collision with wall.');
    }

    if (Math.abs(ballPosition.x) >= this.playArea.width / 2) {
      console.log("Ball out of bounds. Resetting ball.");
      this.reset_ball = true;
      this.last_winner = ballPosition.x > 0 ? 1 : 2;
      this.ballSpeed = { x: 0.5, y: 0 };
    }

    if (Math.abs(this.ballSpeed.y) > this.ySpeedCap) {
      this.ballSpeed.y = this.ballSpeed.y < 0 ? -this.ySpeedCap : this.ySpeedCap;
    }
  }

  moveBall() {
    if (this.mode === 'local') {
      this.ballPosition.x += this.ballSpeed.x;
      this.ballPosition.y += this.ballSpeed.y;
    }
    // In networked mode, ball movement is handled by the server
  }

  update() {
    if (this.mode === 'networked') {
      this.sendPaddlePosition();
    }
    // Additional update logic can be added here
  }

  destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log('WebSocket connection terminated.');
    }
  }
}

export default Pong;


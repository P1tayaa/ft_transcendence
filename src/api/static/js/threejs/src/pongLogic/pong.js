


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
    this.multiSidePush = 0.2; // Multiplier for side pushes

    // Settings and mode
    // this.setterUrlPath = "../static/js/threejs/settings/test.json"
    this.setterUrlPath = "../static/js/threejs/settings/tet.json" // this will fail
    this.settings = null;
    this.mode = 'local'; // Default mode
    this.serverUrl = '';
    this.playerSide = 'left'; // 'left' or 'right'

    // Network intervals
    this.fetchInterval = null;
    this.postInterval = null;
  }

  /**
   * Initializes the Pong class by loading settings and setting up modes.
   */
  async initialize() {
    try {
      await this.loadSettings();
      if (this.settings.mode === 'networked') {
        this.mode = 'networked';
        this.serverUrl = this.settings.serverUrl;
        this.playerSide = this.settings.playerSide;

        // Validate settings for networked mode
        if (!this.serverUrl || !['left', 'right'].includes(this.playerSide)) {
          throw new Error('Invalid settings for networked mode.');
        }

        // Start network communication
        this.startNetworkCommunication();
      }
    } catch (error) {
      console.error('Failed to initialize Pong:', error);
      // Fallback to local mode if settings fail
      this.mode = 'local';
    }
  }

  /**
   * Loads settings from a JSON file.
   */
  async loadSettings() {
    const response = await fetch(this.setterUrlPath); // Update the path as needed
    if (!response.ok) {
      throw new Error('Failed to load settings.json');
    }
    this.settings = await response.json();
  }

  /**
   * Starts network communication by setting up periodic fetch and post.
   */
  startNetworkCommunication() {
    // Fetch data every 100ms
    this.fetchInterval = setInterval(() => this.fetchGameData(), 100);

    // Post data every 100ms
    this.postInterval = setInterval(() => this.postPaddlePosition(), 100);
  };

  /**
   * Fetches the current game data (ball and opponent paddle positions) from the server.
   */
  async fetchGameData() {
    try {
      const response = await fetch(`${this.serverUrl}/gameState`);
      if (!response.ok) {
        throw new Error('Failed to fetch game data.');
      }
      const data = await response.json();
      // Assuming server returns { ballPosition: {x, y}, paddle1Position: {x, y}, paddle2Position: {x, y} }
      this.serverBallPosition = data.ballPosition;
      this.serverPaddle1Position = data.paddle1Position;
      this.serverPaddle2Position = data.paddle2Position;
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
  }

  /**
   * Posts the local paddle's position to the server.
   */
  async postPaddlePosition() {
    try {
      // Determine which paddle the local player controls
      const localPaddlePosition = this.playerSide === 'left' ? this.localPaddle1Position : this.localPaddle2Position;

      const payload = {
        paddleSide: this.playerSide, // 'left' or 'right'
        position: localPaddlePosition,
      };

      const response = await fetch(`${this.serverUrl}/updatePaddle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to post paddle position.');
      }
    } catch (error) {
      console.error('Error posting paddle position:', error);
    }
  }

  /**
   * Creates a bounding box for collision detection.
   * @param {Object} position - The x and y coordinates.
   * @param {Object} size - The width (x) and height (y) of the object.
   * @returns {Object} Bounding box with min and max points.
   */
  createBoundingBox(position, size) {
    return {
      min: { x: position.x - size.x / 2, y: position.y - size.y / 2 },
      max: { x: position.x + size.x / 2, y: position.y + size.y / 2 },
    };
  }

  /**
   * Checks if two bounding boxes intersect.
   * @param {Object} box1 - First bounding box.
   * @param {Object} box2 - Second bounding box.
   * @returns {boolean} True if boxes intersect, else false.
   */
  intersectsBox(box1, box2) {
    return (
      box1.min.x < box2.max.x &&
      box1.max.x > box2.min.x &&
      box1.min.y < box2.max.y &&
      box1.max.y > box2.min.y
    );
  }

  /**
   * Performs collision detection and updates ball speed accordingly.
   * In local mode, uses the provided positions.
   * In networked mode, uses server-fetched positions and updates accordingly.
   * @param {Object} ballPosition3D - Current ball position.
   * @param {Object} paddle1Position3D - Current left paddle position.
   * @param {Object} paddle2Position3D - Current right paddle position.
   */
  checkCollisions(ballPosition3D, paddle1Position3D, paddle2Position3D) {
    if (this.mode === 'local') {
      // Existing local collision detection logic
      this.localCollisionDetection(ballPosition3D, paddle1Position3D, paddle2Position3D);
    } else if (this.mode === 'networked') {
      // Networked collision detection using server data
      this.networkedCollisionDetection();
    }
  }

  /**
   * Local collision detection logic.
   * @param {Object} ballPosition3D - Current ball position.
   * @param {Object} paddle1Position3D - Current left paddle position.
   * @param {Object} paddle2Position3D - Current right paddle position.
   */
  localCollisionDetection(ballPosition3D, paddle1Position3D, paddle2Position3D) {
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
      this.paddle_collided = true;
    }

    if (this.intersectsBox(ballBox, paddle2Box)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle2Position.y) * this.multiSidePush;
      this.paddle_collided = true;
    }

    // Wall collisions
    if (
      ballPosition.y + this.ballSize.y / 2 >= this.playArea.height / 2 ||
      ballPosition.y - this.ballSize.y / 2 <= -this.playArea.height / 2
    ) {
      this.ballSpeed.y = -this.ballSpeed.y;
    }

    if (Math.abs(ballPosition.x) >= this.playArea.width / 2) {
      console.log("Ball out of bounds. Resetting ball.");
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

  /**
   * Networked collision detection logic.
   * Uses server-fetched positions to perform collision detection.
   */
  networkedCollisionDetection() {
    if (!this.serverBallPosition || !this.serverPaddle1Position || !this.serverPaddle2Position) {
      // Data not yet fetched
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

    // Paddle collisions
    if (this.intersectsBox(ballBox, paddle1Box)) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle1Position.y) * this.multiSidePush;
      this.paddle_collided = true;
    }

    if (this.intersectsBox(ballBox, paddle2Box)) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x);
      this.ballSpeed.y += (ballPosition.y - paddle2Position.y) * this.multiSidePush;
      this.paddle_collided = true;
    }

    // Wall collisions
    if (
      ballPosition.y + this.ballSize.y / 2 >= this.playArea.height / 2 ||
      ballPosition.y - this.ballSize.y / 2 <= -this.playArea.height / 2
    ) {
      this.ballSpeed.y = -this.ballSpeed.y;
    }

    if (Math.abs(ballPosition.x) >= this.playArea.width / 2) {
      console.log("Ball out of bounds. Resetting ball.");
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

  /**
   * Moves the ball based on its current speed.
   * Should be called every frame or at a regular interval.
   */
  moveBall() {
    if (this.mode === 'local') {
      this.ballPosition.x += this.ballSpeed.x;
      this.ballPosition.y += this.ballSpeed.y;
    } else if (this.mode === 'networked') {
      // In networked mode, the server dictates the ball's position
      // Thus, local movement is not handled here
    }
  }

  /**
   * Stops network communication and cleans up intervals.
   * Should be called when the game is terminated or switched to local mode.
   */
  stopNetworkCommunication() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
    if (this.postInterval) {
      clearInterval(this.postInterval);
      this.postInterval = null;
    }
  }

  /**
   * Cleans up resources when the Pong class is no longer needed.
   */
  destroy() {
    this.stopNetworkCommunication();
  }
}

export default Pong;


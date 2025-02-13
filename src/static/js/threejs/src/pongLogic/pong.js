
// src/pongLogic/pong.js


import { PlayerSide, Mode, MapStyle, get_settings, Setting } from "./setting.js";
import { getRightSpeed } from "../init/loadPadle.js"
import MyWebSocket from "./websocket.js"


class Pong {
  constructor() {
    // Game properties
    this.ballSpeed = { x: 0.5, y: 0 };
    this.ballSize = { x: 1, y: 1 };
    this.playArea = { width: 100, depth: 60 };
    this.ySpeedCap = 50;
    this.resetBall = false;
    this.lastWinner = 0;
    this.paddleCollided = false;
    this.multiSidePush = 0.2;
    this.ballPos = { x: 0, y: 0 };
    this.settings;
    this.mode = Mode.LOCAL;
    this.playerSide = PlayerSide.LEFT;

    // WebSocket
    this.socket = new MyWebSocket;

    this.lastContact;
    this.lastLoser;
  }

  async initialize(settings) {
    this.settings = settings;
    if (this.settings.mode === Mode.NETWORKED) {
      this.mode = this.settings.mode;
      this.socket.init(this.settings);
    }
    console.log(`Pong initialized in ${this.mode} mode.`);
  }


  // sendPaddlePosition() {
  //   if (this.socket && this.socket.readyState === WebSocket.OPEN) {
  //     const localPaddlePosition = this.playerSide === 'left'
  //       ? this.localPaddle1Position
  //       : this.localPaddle2Position;
  //
  //     const message = {
  //       type: 'updatePaddle',
  //       paddleSide: this.playerSide,
  //       position: localPaddlePosition,
  //     };
  //
  //     this.socket.send(JSON.stringify(message));
  //     console.log('Sent paddle position to server.');
  //   }
  // }

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

  checkCollisions(ballPosition3D, gameScene) {
    if (this.mode === Mode.LOCAL) {
      this.localCollisionDetection(ballPosition3D, gameScene);
    } else if (this.mode === Mode.NETWORKED) {
      if (this.socket.host) {
        this.settings.paddleLoc = this.socket.getPaddlePosition();
        this.localCollisionDetection(ballPosition3D, gameScene);
      }
    }
  }


  localCollisionDetection(ballPosition3D, gameScene) {
    this.ballPos = { x: ballPosition3D.x, y: ballPosition3D.y };

    // Get active paddles from game settings
    const activePaddles = this.settings.playerSide.map(side => ({
      side,
      position: gameScene.getAssetPossition(side),
      size: this.settings.paddleSize[side],
    }));

    const ballBox = this.createBoundingBox(this.ballPos, this.ballSize);
    this.paddle_collided = false;
    this.reset_ball = false;

    // Check for paddle collisions
    activePaddles.forEach(({ side, position, size }) => {
      const paddleBox = this.createBoundingBox(position, size);

      if (this.intersectsBox(ballBox, paddleBox)) {
        this.handlePaddleCollision(side, this.ballPos, position);
      }
    });

    // Check for wall collisions (top & bottom bounds)
    if (Math.abs(this.ballPos.y) >= this.playArea.depth / 2) {
      if (this.settings.playercount == 2) {
        this.ballSpeed.y = -this.ballSpeed.y;
      } else {
        this.handleBallOutOfBounds(this.ballPos);
      }
    }

    // Check if ball is out of bounds (left & right bounds)
    if (Math.abs(this.ballPos.x) >= this.playArea.width / 2) {
      this.handleBallOutOfBounds(this.ballPos);
    }
    // Cap the Y speed
    if (Math.abs(this.ballSpeed.y) > this.ySpeedCap) {
      this.ballSpeed.y = this.ballSpeed.y < 0 ? -this.ySpeedCap : this.ySpeedCap;
    }
  }


  handlePaddleCollision(side, ballPosition, paddlePosition) {
    this.paddle_collided = true;
    if (this.lastWinner !== 0) {
      this.lastWinner = 0;
    }

    if (side === PlayerSide.LEFT) {
      this.ballSpeed.x = Math.abs(this.ballSpeed.x); // Ensure ball moves right
      this.ballSpeed.y = (ballPosition.y - paddlePosition.y) * this.multiSidePush;
      this.lastContact = PlayerSide.LEFT;
    }
    else if (side === PlayerSide.RIGHT) {
      this.ballSpeed.x = -Math.abs(this.ballSpeed.x); // Ensure ball moves left
      this.ballSpeed.y += (ballPosition.y - paddlePosition.y) * this.multiSidePush;
      this.lastContact = PlayerSide.RIGHT;
    }
    else if (side === PlayerSide.TOP) {
      this.ballSpeed.y = Math.abs(this.ballSpeed.y); // Ensure ball moves downward
      this.ballSpeed.x += (ballPosition.x - paddlePosition.x) * this.multiSidePush;
      this.lastContact = PlayerSide.TOP;
    }
    else if (side === PlayerSide.BOTTOM) {
      this.ballSpeed.y = -Math.abs(this.ballSpeed.y); // Ensure ball moves upward
      this.ballSpeed.x += (ballPosition.x - paddlePosition.x) * this.multiSidePush;
      this.lastContact = PlayerSide.BOTTOM;
    }
    else {
      console.warn("Unknown paddle side:", side);
    }
    // console.log(`Collision with ${side} paddle.`);
  }


  handleBallOutOfBounds(ballPosition) {
    this.resetBall = true;
    if (this.settings.playercount == 2) {

      if (Math.abs(ballPosition.x) >= this.playArea.width / 2) {
        this.lastWinner = ballPosition.x > 0 ? 1 : 2; // Left or Right wins
      }
    } else if (Math.abs(ballPosition.x) >= this.playArea.width / 2 || Math.abs(ballPosition.y) >= this.playArea.depth / 2) {
      this.defineLastWinner(this.lastContact);

    }


    this.ballSpeed = { x: 0.5, y: 0 };
  }

  defineLastWinner(paddle) {
    switch (paddle) {
      case PlayerSide.LEFT:
        this.lastWinner = 1;
        break;
      case PlayerSide.RIGHT:
        this.lastWinner = 2;
        break;
      case PlayerSide.BOTTOM:
        this.lastWinner = 3;
        break;
      case PlayerSide.TOP:
        this.lastWinner = 4;
        break;
      default:
        console.error(`Unknown plauer side: ${this.lastContact}`)
        break;
    }

  }

  networkedCollisionDetection() {
  }

  moveBall() {
    if (this.mode === 'local') {
      this.ballPosition.x += this.ballSpeed.x;
      this.ballPosition.y += this.ballSpeed.y;
    }
    // In networked mode, ball movement is handled by the server
  }

  update(input, gameScene) {
    if (this.mode === Mode.NETWORKED) {
      this.socket.sendPaddlePosition(input[this.playerSide], this.playerSide);
    } else if (this.mode === Mode.LOCAL) {
      this.settings.playerSide.forEach(Padle => {
        if (input[Padle] !== 0) {
          gameScene.moveAssetBy(Padle, getRightSpeed(Padle, input[Padle], this.settings, this));
        }
      });

      // Get Positions
    }

    const BallPos = gameScene.getAssetPossition('Ball');
    this.checkCollisions(BallPos, gameScene);
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


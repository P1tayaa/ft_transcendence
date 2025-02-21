

import { Mode, PlayerSide } from "./pongLogic/setting.js";

const inputKeys = {
  [PlayerSide.LEFT]: { up: 'w', down: 's' },
  [PlayerSide.RIGHT]: { up: 'k', down: 'i' },
  [PlayerSide.TOP]: { up: 'x', down: 'c' },
  [PlayerSide.BOTTOM]: { up: 'm', down: 'n' },
};

export default class ControlHandler {
  constructor(settings) {
    this.settings = settings; // Get player sides from settings
    this.paddleSpeeds = {}; // Store paddle speeds dynamically
    this.acceleration = 0.2; // Default acceleration
    this.debug = false;

  }

  async Init(socket) {
    // Initialize paddle speeds for active players
    if (this.settings.justMePaddle == Mode.LOCAL) {
      this.settings.playerSide.forEach(side => {
        this.paddleSpeeds[side] = 0;
      });
    } else if (this.settings.Mode == Mode.LOCALS_SOLO) {
      // find the not bots and make it the justMePaddle
      this.settings.playerSide.forEach(side => {
        this.paddleSpeeds[side] = 0;
      });
    } else {
      console.log("did send it");
      const cur_paddle = await socket.getWhichPadle(socket);
      console.log(cur_paddle)
      this.settings.playerSide[cur_paddle] = cur_paddle;
      this.paddleSpeeds[cur_paddle] = 0;
      this.settings.justMePaddle = cur_paddle;
    }
    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(event) {
    if (this.settings.justMePaddle === null) {
      this.settings.playerSide.forEach(side => {
        console.log(side);
        if (event.key === inputKeys[side].up) {
          this.paddleSpeeds[side] = this.acceleration;
        } else if (event.key === inputKeys[side].down) {
          this.paddleSpeeds[side] = -this.acceleration;
        }
      });
    } else {
      const side = this.settings.justMePaddle;
      if (event.key === inputKeys[side].up) {
        this.paddleSpeeds[side] = this.acceleration;
      } else if (event.key === inputKeys[side].down) {
        this.paddleSpeeds[side] = -this.acceleration;
      }
    }

    if (event.key === 'b') {
      this.debug = true;
    }
  }

  onKeyUp(event) {
    if (this.settings.justMePaddle === null) {
      this.settings.playerSide.forEach(side => {
        if (event.key === inputKeys[side].up || event.key === inputKeys[side].down) {
          this.paddleSpeeds[side] = 0;
        }
      });
    } else {
      const side = this.settings.justMePaddle;
      if (event.key === inputKeys[side].up || event.key === inputKeys[side].down) {
        this.paddleSpeeds[side] = 0;
      }

    }
    if (event.key === 'b') {
      this.debug = false;
    }
  }

  getPaddleSpeeds() {
    return this.paddleSpeeds;
  }

  isDebugEnabled() {
    return this.debug;
  }
}


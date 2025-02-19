

import { PlayerSide } from "./pongLogic/setting.js";

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

    // Initialize paddle speeds for active players
    this.settings.playerSide.forEach(side => {
      this.paddleSpeeds[side] = 0;
    });

    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(event) {
    this.settings.playerSide.forEach(side => {
      if (event.key === inputKeys[side].up) {
        this.paddleSpeeds[side] = this.acceleration;
      } else if (event.key === inputKeys[side].down) {
        this.paddleSpeeds[side] = -this.acceleration;
      }
    });

    if (event.key === 'b') {
      this.debug = true;
    }
  }

  onKeyUp(event) {
    this.settings.playerSide.forEach(side => {
      if (event.key === inputKeys[side].up || event.key === inputKeys[side].down) {
        this.paddleSpeeds[side] = 0;
      }
    });

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


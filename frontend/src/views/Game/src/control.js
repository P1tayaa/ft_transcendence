

import { Mode, PlayerSide } from "./pongLogic/setting.js";

export const inputKeys = {
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

	this.side = null; // Initialize side to null
  }

  async Init(socket) {
    // Initialize paddle speeds for active players
	this.settings.playerSide.forEach(side => {
	this.paddleSpeeds[side] = 0;
	});

	console.log("Socket:", socket);
	if (socket) {
      this.side = socket.mySide;
	}

    this.setupControls();
  }

  setupControls() {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(event) {
	if (this.settings.mode === Mode.NETWORKED) {
		if (event.key === inputKeys[this.side].up) {
			this.paddleSpeeds[this.side] = this.acceleration;
		} else if (event.key === inputKeys[this.side].down) {
			this.paddleSpeeds[this.side] = -this.acceleration;
		}
	} else {
		for (const side of this.settings.playerSide) {
			if (event.key === inputKeys[side].up) {
				this.paddleSpeeds[side] = this.acceleration;
			} else if (event.key === inputKeys[side].down) {
				this.paddleSpeeds[side] = -this.acceleration;
			}
		}
	}
  }

  onKeyUp(event) {
	if (this.settings.mode === Mode.NETWORKED) {
		if (event.key === inputKeys[this.side].up || event.key === inputKeys[this.side].down) {
			this.paddleSpeeds[this.side] = 0;
		}
	}
    else {
		for (const side of this.settings.playerSide) {
			if (event.key === inputKeys[side].up || event.key === inputKeys[side].down) {
				this.paddleSpeeds[side] = 0;
			}
		}
	}
  }

  getPaddleSpeeds() {
    return this.paddleSpeeds;
  }
}


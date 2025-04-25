export const Mode = {
  NETWORKED: "networked",
  LOCAL: "local",
};

export const MapStyle = {
  CLASSIC: "classic",
  BATH: "bath",
  CIRCLE: "circle",
  RECTANGLE: "rectangle",
};

export const PlayerSide = {
  LEFT: "left",
  RIGHT: "right",
  BOTTOM: "bottom",
  TOP: "top",
};

export function intToPlayerSide(last_winner) {
  const winnerSide =
    last_winner === 1 ? PlayerSide.LEFT :
      last_winner === 2 ? PlayerSide.RIGHT :
        last_winner === 3 ? PlayerSide.BOTTOM :
          last_winner === 4 ? PlayerSide.TOP :
            null;
  return winnerSide;

}

export class Setting {
  constructor(setting_json) {
    console.log("Setting constructor called with JSON:", setting_json);
    // Parse the JSON and fill in the settings
    this.mode = this.parseMode(setting_json.mode) || Mode.NETWORKED;
    this.playercount = setting_json.player_count;
    this.mapStyle = this.parseMapStyle(setting_json["map_style"]);
    this.playerSide = this.playercount === 2 ? ["left", "right"] : ["left", "right", "bottom", "top"];
    this.paddleSize = {};
    this.paddleLoc = {};
    this.playerSide.forEach(side => {
      if (side === PlayerSide.RIGHT || side === PlayerSide.LEFT) {
        this.paddleSize[side] = { x: 1, y: 8 };
      } else {
        this.paddleSize[side] = { x: 8, y: 1 };
      }
      this.paddleLoc[side] = 0;
    });

    console.log("Parsed settings:", this);
  }

  // Helper function to parse 'mode' and return valid options
  parseMode(mode) {
    if (Object.values(Mode).includes(mode)) {
      return mode;
    }
    console.error("Invalid mode, defaulting to 'local'");
    return Mode.LOCAL;
  }

  // Helper function to parse map styles and ensure validity
  parseMapStyle(mapStyle) {
    if (Object.values(MapStyle).includes(mapStyle)) {
      return mapStyle;
    }
    console.error("Invalid map style, defaulting to 'classic'");
    return MapStyle.CLASSIC; // Default value if invalid
  }
}

// Example usage
// const settingsJson = {
//   "mode": "networked",
//   "playerCount": "4",
//   "map style": "classic",
// };

// const gameSettings = new Setting(settingsJson);
// console.log(gameSettings);


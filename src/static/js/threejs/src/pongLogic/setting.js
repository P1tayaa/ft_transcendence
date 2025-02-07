
export const Mode = {
  NETWORKED: "networked",
  LOCAL: "local",
  LOCALS_SOLO: "localsolo",
};

const PowerUp = {
  STAR: "star",
  SNAIL: "snail",
  SPEEDUP: "speedup",
  GLOW: "glow",
  MAGNET: "magnet",
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
  TOP: "top",
  BOTTOM: "bottom",
};

export function intToPlayerSide(last_winner) {
  const winnerSide =
    last_winner === 1 ? PlayerSide.LEFT :
      last_winner === 2 ? PlayerSide.RIGHT :
        last_winner === 3 ? PlayerSide.TOP :
          last_winner === 4 ? PlayerSide.BOTTOM :
            null;
  return winnerSide;

}

export function getCSRFToken() {
  return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
    document.cookie.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
}

// const SETTING_URL = "api/get_user_setting/"
const SETTING_URL = "../static/js/threejs/settings/simpleDefault.json"

export async function get_settings(game_id) {
  const response = await fetch(SETTING_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken()
    },
    credentials: 'include',
    // body: JSON.stringify({
    //   game_id: game_id,
    // })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get get settings');
  }
  const result = await response.json();
  return result;
}

export class Setting {
  constructor(setting_json) {
    // Parse the JSON and fill in the settings
    this.mode = this.parseMode(setting_json.mode);
    this.serverurl = setting_json.serverurl || "http://localhost:8000/api/";
    this.powerup = setting_json.powerup === "true"; // Convert to boolean
    this.powerupList = this.parsePoweruplist(setting_json.poweruplist);
    this.playercount = parseInt(setting_json.playercount) || 2; // Default to 2 players
    this.mapStyle = this.parseMapStyle(setting_json["map style"]);
    this.playerSide = this.parseMultipleSides(setting_json.playerside);
    this.bots = setting_json.bots === "true"; // Convert to boolean
    this.botsSide = this.parseMultipleSides(setting_json.botsSide);
  }

  // Helper function to parse 'mode' and return valid options
  parseMode(mode) {
    if (Object.values(Mode).includes(mode)) {
      return mode;
    }
    console.error("Invalid mode, defaulting to 'networked'");
    return Mode.NETWORKED; // Default value if invalid
  }

  // Helper function to parse 'poweruplist' and ensure they are valid
  parsePoweruplist(poweruplist) {
    if (Array.isArray(poweruplist)) {
      return poweruplist.filter(powerup => Object.values(PowerUp).includes(powerup));
    }
    console.error("Invalid poweruplist, defaulting to empty array");
    return []; // Default empty list if invalid
  }

  // Helper function to parse map styles and ensure validity
  parseMapStyle(mapStyle) {
    if (Object.values(MapStyle).includes(mapStyle)) {
      return mapStyle;
    }
    console.error("Invalid map style, defaulting to 'classic'");
    return MapStyle.CLASSIC; // Default value if invalid
  }

  // Helper function to parse 'playerside' and allow multiple valid sides
  parseMultipleSides(sides) {
    if (Array.isArray(sides)) {
      return sides.filter(side => Object.values(PlayerSide).includes(side));
    } else if (typeof sides === 'string') {
      if (Object.values(PlayerSide).includes(sides)) {
        return [sides];
      }
    }
    console.error("Invalid player/bot side, defaulting to ['left']");
    return [PlayerSide.LEFT]; // Default to left side if invalid
  }
}

// Example usage
const settingsJson = {
  "mode": "networked",
  "serverurl": "http://example.com/api/",
  "powerup": "true",
  "poweruplist": ["star", "speedup"],
  "playercount": "4",
  "map style": "circle",
  "playerside": ["left", "top"],
  "bots": "true",
  "botsSide": ["right"]
};

const gameSettings = new Setting(settingsJson);
console.log(gameSettings);


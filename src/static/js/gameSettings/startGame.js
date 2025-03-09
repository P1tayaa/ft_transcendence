
import { getCSRFToken, getURL  } from '../utils.js';

const CREATE_GAME_URL = getURL() + '/api/create_game/'




async function make_room(config) {
  const csrfToken = getCSRFToken();

  if (!csrfToken) {
    throw new Error('CSRF token not found');
  }
  console.log(config);
  const response = await fetch(CREATE_GAME_URL, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken
    }, body: JSON.stringify({ config: config }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
    // throw new Error(errorData.errors || 'failed to make game room');
  }

  const data = await response.json();
  return data;

}
// data {status, room_id, room_name, config}


export async function initializeGame(config) {
  let gameConfig = {

    mode: config.gamemode,
    // serverurl: "ws://localhost:8000/ws/room/poop",
    powerup: config.powerUps,
    poweruplist: config.powerUpOptions,
    playerCount: config.playerCount,
    map_style: config.map,
    playerside: [],
    bots: false,
    botsSide: [],
    host: true,
    Spectator: false
  }

  // have to Change
  gameConfig.map = "classic";


  switch (gameConfig.playerCount) {
    case "2":
      gameConfig.playerside = [
        "left",
        "right",
      ]
      break;
    case "4":
      gameConfig.playerside = [
        "left",
        "right",
        "top",
        "bottom"
      ]
      break;
    default:
      console.error("player count error");
      break;
  }



  if (gameConfig.mode === "localsolo") {
    // Enable bot mode
    gameConfig.bots = true;

    // Pick a random index from the playerside array
    const playerIndex = Math.floor(Math.random() * gameConfig.playerside.length);
    for (let i = 0; i < gameConfig.playerside.length; i++) {
      if (i !== playerIndex) {
        gameConfig.botsSide.push(gameConfig.playerside[i]);
      }
    }
    // Keep one random side for the player
    gameConfig.playerside = [gameConfig.playerside[playerIndex]];

    // Move all other sides to botsSide
  }

  if (gameConfig.mode === "networked") {
    try {

      const datainfo = await make_room(gameConfig);

      console.log("the responce of the ", (datainfo));

      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("startGame", { detail: { gameConfig: gameConfig, room_name: datainfo.room_name } }));
      }, 3000);
      console.log('Initializing game with configuration:', config);
    } catch (error) {
      console.error('Error fetching matches:', error);
      alert('An error occurred while searching for friends.');
    }

  } else {
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("startGame", { detail: { gameConfig: gameConfig } }));
    }, 3000);
  }

}

export default initializeGame;


import { getCSRFToken } from '../utils.js';

const CREATE_GAME_URL = 'http://localhost:8000/api/create_game/'

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

  if (gameConfig.mode === "Local Ws Bots") {
    gameConfig.bots = true;
  }

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

  try {

    const datainfo = await make_room(gameConfig);

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("startGame", { detail: { gameConfig: gameConfig, gameInfo: datainfo } }));
    }, 3000);
    console.log('Initializing game with configuration:', config);
  } catch (error) {
    console.error('Error fetching matches:', error);
    alert('An error occurred while searching for friends.');
  }





}

export default initializeGame;

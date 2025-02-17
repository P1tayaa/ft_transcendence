
import { getCSRFToken, postRequest } from '../utils.js';






const socket = new WebSocket("ws://localhost:8000/ws/matchmaking/");

const GET_CONFIG_URL = "localhost:8000/api/get_config_game_room/";

async function getConfig(roomName) {
  try {
    const data = await postRequest(GET_CONFIG_URL, { roomName });

    if (!data || data.status !== "success") {
      throw new Error(data?.message || "Failed to fetch config");
    }

    return data.config;

  } catch (error) {
    console.error("Error fetching config:", error);
    return null;
  }
}

window.joinRoom = async function (roomName, config) {

  if (!config) {
    console.error("Failed to get config, cannot start game.");
    return;
  }

  setTimeout(() => {
    document.dispatchEvent(new CustomEvent("startGame", {
      detail: { gameConfig: config, room_name: roomName }
    }));

    // Hide matchmaking divs
    document.getElementById("matchmaking")?.classList.add("hidden");
  }, 3000);
}


socket.onopen = function () {
  socket.send(JSON.stringify({ type: 'list_rooms' }));
};

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (data.type === "room_list") {
    const tableBody = document.getElementById("roomsTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    data.rooms.forEach((room) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${room.room_name}</td>
        <td>${room.config.playerCount}</td>
        <td>${room.config.mode}</td>
        <td>${room.config.map_style}</td>
        <td>${room.config.powerup}</td>
        <td>
          <button onclick='joinRoom("${room.room_name}", ${JSON.stringify(
        room.config
      )})'>Join</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } else if (data.type === "match_found") {
    window.location.href = `/game/${data.room_name}`;
  }
};


const CLEAR_ROOMS_URL = `${window.location.origin}/api/clear_game_rooms/`

async function clearRoom() {
  const csrfToken = getCSRFToken();

  if (!csrfToken) {
    throw new Error('CSRF token not found');
  }
  const response = await fetch(CLEAR_ROOMS_URL, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken
    }// , body: JSON.stringify({ config: config }),
  });

  const data = await response.json();
  console.log(data);
  return data;

}





document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById("clearRooms");

  if (button) {
    button.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const result = await clearRoom();
        console.log("Room cleared:", result);
      } catch (error) {
        console.error("Error clearing room:", error);
      }
    });
  }
});

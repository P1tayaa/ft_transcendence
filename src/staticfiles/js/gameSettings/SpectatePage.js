// Get references to elements
const roomNameInput = document.getElementById("roomNameInput");
const roomNameValue = document.getElementById("roomNameValue");
const roomForm = document.getElementById("roomForm");
const statusDiv = document.getElementById("status");
const gameInfoPre = document.getElementById("gameInfo");

let socket = null;

// Update the room name preview in real time as the user types
roomNameInput.addEventListener("input", function () {
  roomNameValue.textContent = roomNameInput.value;
});

// Function to display game information in a pretty-printed format
function displayGameInfo(info) {
  gameInfoPre.textContent = JSON.stringify(info, null, 2);
}

// Handle form submission to connect to the WebSocket
roomForm.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent form reload
  const roomName = roomNameInput.value.trim();
  if (!roomName) return;

  // Build the WebSocket URL (adjust the path if needed)
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socketUrl = `${wsProtocol}://${window.location.host}/ws/spectate/${roomName}/`;

  // Create the WebSocket connection
  socket = new WebSocket(socketUrl);

  socket.onopen = function () {
    statusDiv.textContent = "Connected to " + socketUrl;
  };

  socket.onmessage = function (event) {
    try {
      const data = JSON.parse(event.data);
      // If it's a game state update, display it
      if (data.type === "game_state_update" && data.state) {
        displayGameInfo(data.state);
      } else {
        console.log("Received message:", data);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  };

  socket.onerror = function (error) {
    statusDiv.textContent = "WebSocket error occurred.";
    console.error("WebSocket error:", error);
  };

  socket.onclose = function () {
    statusDiv.textContent = "Disconnected.";
  };
});

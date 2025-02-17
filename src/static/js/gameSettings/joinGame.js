const socket = new WebSocket("ws://localhost:8000/ws/matchmaking/");

socket.onopen = function () {
  socket.send(JSON.stringify({ type: 'list_rooms' }));
};

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (data.type === 'room_list') {
    const tableBody = document.getElementById("roomsTableBody");
    tableBody.innerHTML = ""; // Clear existing rows

    data.rooms.forEach(room => {
      const row = document.createElement("tr");
      row.innerHTML = `
                        <td>${room.room_name}</td>
                        <td>${room.config__player_count}</td>
                        <td><button onclick="joinRoom('${room.room_name}')">Join</button></td>
                    `;
      tableBody.appendChild(row);
    });
  } else if (data.type === 'match_found') {
    window.location.href = `/game/${data.room_name}`;
  }
};

function joinRoom(roomName) {
  window.location.href = `/game/${roomName}`;
}

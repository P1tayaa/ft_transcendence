import './Home.css';

import WebSocket from '../../socket.js';
import router from '../../router.js';
import CreateGameModal from '../../components/CreateGame/CreateGame.js';

class Home {
	render() {
		return `
		<div class="container">
			<!-- Room list view (default) -->
			<div class="room-list-card">
				<div class="header">
					<h1>Available Games</h1>
					<button id="create-game-btn" class="create-btn">Create Game</button>
				</div>
				<div class="rooms-container" id="rooms-container">
					<!-- Rooms will be populated here by JavaScript -->
					<p class="no-rooms-message" id="no-rooms-message">No games available. Create a new game!</p>
				</div>
			</div>
		</div>
		`;
	}

	constructor() {
		this.socket = null;
		this.createGameModal = null;
	}

	onLoad() {
		// Room list elements
		const createGameBtn = document.getElementById('create-game-btn');
		const roomsContainer = document.getElementById('rooms-container');
		const noRoomsMessage = document.getElementById('no-rooms-message');

		const socket = new WebSocket('matchmaking');
		this.socket = socket; // Store in home instance for cleanup

		socket.handleMessage = (data) => {
			if (data.type === 'room_list') {
				if (data.rooms.length === 0) {
					noRoomsMessage.classList.remove('hidden');
				} else {
					noRoomsMessage.classList.add('hidden');
					roomsContainer.innerHTML = '';
				}

				data.rooms.forEach(room => {
					const roomElement = createRoomElement(room);
					roomsContainer.appendChild(roomElement);
				});
			}

			if (data.type === 'room_created') {
				console.debug('New room created:', data.room);

				const roomElement = createRoomElement(data.room);
				roomsContainer.appendChild(roomElement);
				noRoomsMessage.classList.add('hidden');
			}
		};

		socket.connect();
		
		// Open create game modal
		createGameBtn.addEventListener('click', () => {
			this.createGameModal = new CreateGameModal();
			this.createGameModal.init();
			this.createGameModal.show();
		});

		// Create a room element by rendering HTML
		function createRoomElement(room) {
			// Create a div element for the room
			const roomElement = document.createElement('div');
			roomElement.dataset.roomName = room.name;

			// Fill with HTML based on room type
			if (room.type === 'tournament') {
				roomElement.className = 'room-item tournament';
				roomElement.innerHTML = renderRoom(room, 'trophy');
			} else {
				roomElement.className = 'room-item';
				roomElement.innerHTML = renderRoom(room, 'gamepad');
			}

			// Make the entire room item clickable to join the game
			roomElement.addEventListener('click', () => {
				socket.disconnect();

				// Join the game room or tournament based on type
				if (room.type === 'tournament') {
					router.navigate('/tournament/' + room.name);
				} else {
					router.navigate('/game/' + room.name);
				}
			});

			return roomElement;
		}

		// Render HTML for a regular game room
		function renderRoom(room, type) {			
			return `
				<div class="game-icon-container">
					<i class="fas fa-${type} game-icon"></i>
				</div>
				<div class="room-info">
					<div class="room-header">
						<h3 class="room-name">${room.name}</h3>
					</div>
					<div class="room-details">
						<span class="room-map">${room.map}</span>
					</div>
				</div>
				<span class="room-players">${room.players}/${room.max_players}</span>
			`;
		}
	}

	onUnload() {
		// Clean up any resources when navigating away
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}

		// Close the modal if it's open
		if (this.createGameModal) {
			this.createGameModal.close();
			this.createGameModal = null;
		}
	}
}

// Create and export a single instance
export default new Home();
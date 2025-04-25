import './Home.css';

import api from '../../api.js';
import WebSocket from '../../socket.js';
import router from '../../router.js';

class Config {
	constructor(selection) {
		this.mode = selection.mode;
		this.playerCount = selection.players;
		this.map_style = selection.map;
		this.playerside = [];
		this.host = true;

		const sides = this.playerCount === 2 ? ["left", "right"] : ["left", "right", "top", "bottom"];
		this.playerside = sides;
	}

	get() {
		return {
			mode: this.mode,
			playerCount: this.playerCount,
			map_style: this.map_style,
			playerside: this.playerside,
			host: this.host,
		}
	}
}

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

		<!-- Create game modal (original setup form) -->
		<div class="modal hidden" id="create-game-modal">
			<div class="modal-content setup-modal">
				<div class="setup-card">
					<!-- Progress indicator -->
					<div class="progress-bar">
						<div class="progress-line active"></div>
						<div class="progress-line"></div>
						<div class="progress-line"></div>
					</div>

					<!-- Step 1: Game Mode Selection -->
					<div class="setup-step active" id="step-1">
						<h2>Select Game Mode</h2>
						<div class="options-container">
							<button class="option-btn" data-mode="networked">
								<span>Online</span>
							</button>
							<button class="option-btn" data-mode="local">
								<span>Local Multiplayer</span>
							</button>
						</div>
					</div>

					<!-- Step 2: Player Count Selection -->
					<div class="setup-step" id="step-2">
						<h2>Select Players</h2>
						<div class="options-container">
							<button class="option-btn" data-players="2">
								<span class="player-count">2</span>
								<span>Players</span>
							</button>
							<button class="option-btn" data-players="4">
								<span class="player-count">4</span>
								<span>Players</span>
							</button>
							<button id="tournament-btn" class="option-btn" data-players="8">
								<span>Tournament</span>
							</button>
						</div>
					</div>

					<!-- Step 3: Map Selection -->
					<div class="setup-step" id="step-3">
						<h2>Select Map</h2>
						<!-- 2-player maps -->
						<div class="map-container" id="maps-2-player">
							<div class="map-option" data-map="classic">
								<div class="map-preview" id="classic-preview"></div>
								<div class="map-name">Classic</div>
							</div>
							<div class="map-option" data-map="arena">
								<div class="map-preview" id="arena-preview"></div>
								<div class="map-name">Arena</div>
							</div>
						</div>
						<!-- 4-player maps -->
						<div class="map-container hidden" id="maps-4-player">
							<div class="map-option" data-map="classic4p">
								<div class="map-preview" id="classic4p-preview"></div>
								<div class="map-name">Classic 4 player</div>
							</div>
							<div class="map-option" data-map="battle">
								<div class="map-preview" id="battle-preview"></div>
								<div class="map-name">Battle Arena</div>
							</div>
							<div class="map-option" data-map="maze">
								<div class="map-preview" id="maze-preview"></div>
								<div class="map-name">Maze</div>
							</div>
						</div>
					</div>

					<!-- Navigation buttons -->
					<div class="navigation-buttons">
						<button id="prev-btn" class="nav-btn" disabled>Back</button>
						<button id="next-btn" class="nav-btn" disabled>Next</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Final confirmation modal -->
		<div class="modal hidden" id="confirmation-modal">
			<div class="modal-content">
				<h2>Game Setup Complete</h2>
				<div class="setup-summary">
					<p><strong>Mode:</strong> <span id="summary-mode"></span></p>
					<p><strong>Players:</strong> <span id="summary-players"></span></p>
					<p><strong>Map:</strong> <span id="summary-map"></span></p>
					<p><strong>Powerups:</strong> <span id="summary-powerups"></span></p>
				</div>
				<div class="modal-buttons">
					<button id="cancel-btn">Back to Setup</button>
					<button id="start-game-btn">Start Game</button>
				</div>
			</div>
		</div>

		<!-- Room template (for cloning) - Hidden -->
		<template id="room-template">
			<div class="room-item">
				<div class="room-info">
					<div class="room-header">
						<h3 class="room-name"></h3>
						<span class="room-players"></span>
					</div>
					<div class="room-details">
						<span class="room-map"></span>
						<span class="room-powerups"></span>
					</div>
				</div>
				<button class="join-btn">Join Game</button>
			</div>
		</template>
		`;
	}

	constructor() {
		this.socket = null;
	}

	onLoad() {
		// DOM Elements
		const modals = document.querySelectorAll('.modal');
		const setupSteps = document.querySelectorAll('.setup-step');
		const progressLines = document.querySelectorAll('.progress-line');
		const prevBtn = document.getElementById('prev-btn');
		const nextBtn = document.getElementById('next-btn');

		// Step 1: Game Mode Selection
		const modeButtons = document.querySelectorAll('[data-mode]');

		// Step 2: Player Count Selection
		const playerButtons = document.querySelectorAll('[data-players]');
		const tournamentBtn = document.getElementById('tournament-btn');

		// Step 3: Map Selection
		const maps2Player = document.getElementById('maps-2-player');
		const maps4Player = document.getElementById('maps-4-player');
		const mapOptions = document.querySelectorAll('.map-option');

		// Confirmation Modal
		const confirmationModal = document.getElementById('confirmation-modal');
		const summaryMode = document.getElementById('summary-mode');
		const summaryPlayers = document.getElementById('summary-players');
		const summaryMap = document.getElementById('summary-map');
		const cancelBtn = document.getElementById('cancel-btn');
		const startGameBtn = document.getElementById('start-game-btn');

		// Room list elements
		const createGameBtn = document.getElementById('create-game-btn');
		const createGameModal = document.getElementById('create-game-modal');
		const roomsContainer = document.getElementById('rooms-container');
		const noRoomsMessage = document.getElementById('no-rooms-message');
		const roomTemplate = document.getElementById('room-template');

		// Initialize class member variables here
		let selection = {
			mode: null,
			players: null,
			map: null,
			tournament: false
		};

		let currentStep = 0;
		const totalSteps = 3;

		const socket = new WebSocket('matchmaking');
		this.socket = socket; // Store in home instance for cleanup

		socket.handleMessage = (data) => {
			console.log("event:", data);

			if (data.type === 'room_list') {
				console.log('Received room list:', data.rooms);

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
				console.log('Room created:', data.room);
				const roomElement = createRoomElement(data.room);
				roomsContainer.appendChild(roomElement);
				noRoomsMessage.classList.add('hidden');
			}
		};

		socket.connect();
		init();

		// Create a room element from the template
		function createRoomElement(room) {
			console.log('Creating room element:', room);

			// Clone the template
			const roomElement = roomTemplate.content.cloneNode(true).querySelector('.room-item');

			// Fill in room details
			roomElement.querySelector('.room-name').textContent = room.name;

			// Display current/max players
			const playerInfo = `${room.players.length}/${room.settings.playerCount}`;
			roomElement.querySelector('.room-players').textContent = "Players: " + playerInfo;

			// Map name
			const mapNames = {
				'classic': 'Classic',
				'arena': 'Arena',
				'classic4p': 'Classic 4-Player',
				'battle': 'Arena 4-Player',
				'maze': 'Maze'
			};
			const mapText = "Map: " + mapNames[room.settings.map_style] || room.settings.map_style;
			roomElement.querySelector('.room-map').textContent = mapText;

			// Handle join button click
			const joinBtn = roomElement.querySelector('.join-btn');
			joinBtn.addEventListener('click', () => {
				console.log(room.settings);
				sessionStorage.setItem('config', JSON.stringify(room.settings));
				socket.disconnect();

				// Join the game room
				router.navigate('/game/' + room.name);
			});

			// Store room ID as data attribute for easier access
			roomElement.dataset.roomName = room.name;

			return roomElement;
		};

		// Initialize the setup wizard
		function init() {
			// Open setup modal
			createGameBtn.addEventListener('click', function() {
				createGameModal.classList.remove('hidden');
			});

			// Set up event listeners for mode selection
			modeButtons.forEach(button => {
				button.addEventListener('click', function() {
					modeButtons.forEach(btn => btn.classList.remove('selected'));
					this.classList.add('selected');
					nextBtn.disabled = false;

					const mode = this.getAttribute('data-mode');

					tournamentBtn.classList.toggle('hidden', mode !== 'networked');

					selection.mode = mode;
				});
			});

			// Set up event listeners for player selection
			playerButtons.forEach(button => {
				button.addEventListener('click', function() {
					playerButtons.forEach(player => player.classList.remove('selected'));
					this.classList.add('selected');
					nextBtn.disabled = false;

					// Rreset map selection if player count changed
					let players = parseInt(this.getAttribute('data-players'));
					if (selection.map !== null && selection.players !== players) {
						selection.map = null;
						mapOptions.forEach(map => map.classList.remove('selected'));
					}

					if (players === 8) {
						selection.tournament = true;
						players = 2
					} else {
						selection.tournament = false;
					}

					maps2Player.classList.toggle('hidden', players !== 2);
					maps4Player.classList.toggle('hidden', players !== 4);

					selection.players = players;
				});
			});

			// Set up event listeners for map selection
			mapOptions.forEach(option => {
				option.addEventListener('click', function() {
					mapOptions.forEach(map => map.classList.remove('selected'));
					this.classList.add('selected');
					nextBtn.disabled = false;

					selection.map = this.getAttribute('data-map');
				});
			});

			modals.forEach(modal => {
				modal.addEventListener('click', function(event) {
					if (event.target === modal) {
						modal.classList.add('hidden');
					}
				});
			});

			// Navigation buttons
			prevBtn.addEventListener('click', prev);
			nextBtn.addEventListener('click', next);

			// Modal buttons
			cancelBtn.addEventListener('click', function() {
				confirmationModal.classList.add('hidden');
			});

			startGameBtn.addEventListener('click', async function() {
				const config = new Config(selection);
				sessionStorage.setItem('config', JSON.stringify(config.get()));

				if (selection.tournament) {
					const room = await api.createTournament(config);
					window.location.href = `/tournament/${room.tournament_id}`;
				}
				else if (selection.mode === "networked") {
					const room = await api.createGame({
						map: selection.map,
						players: selection.players,
					});

					const rooms = await api.getGameList();
					console.log(rooms);

					if (!room) {
						console.error("Failed to create game room.");
						return;
					}

					router.navigate('/game/' + room.room_name);
				}
				else {
					router.navigate('/game/local');
				}
				modals.forEach(modal => modal.classList.add('hidden'));
			});
		}

		// Go to next step
		function next() {
			if (currentStep < totalSteps - 1) {
				updateStep(currentStep + 1);
			} else {
				// On final step, show confirmation modal
				showConfirmationModal();
			}
		}

		// Go to previous step
		function prev() {
			if (currentStep > 0) {
				updateStep(currentStep - 1);
			}
		}

		// Update the current step
		function updateStep(stepNumber) {
			setupSteps[currentStep].classList.remove('active');
			setupSteps[stepNumber].classList.add('active');

			// Update progress bar
			progressLines[currentStep].classList.remove('active');
			progressLines[stepNumber].classList.add('active');
			if (stepNumber > currentStep) {
				progressLines[currentStep].classList.add('completed');
			} else {
				progressLines[stepNumber].classList.remove('completed');
			}

			nextBtn.disabled = true;

			// Step specific logic
			if (stepNumber === 0 && selection.mode!== null) {
				nextBtn.disabled = false;
			}

			if (stepNumber === 1 && selection.players !== null) {
				nextBtn.disabled = false;
			}

			if (stepNumber === 2 && selection.map !== null) {
				nextBtn.disabled = false;
			}

			prevBtn.disabled = (stepNumber === 0);

			nextBtn.innerHTML = (stepNumber === totalSteps - 1) ? 'Finish' : 'Next';

			currentStep = stepNumber;
			currentStep = currentStep; // Update the this currentStep
		}

		// Show confirmation modal with summary
		function showConfirmationModal() {
			// Update summary
			const modeNames = {
				'local': 'Local Multiplayer',
				'networked': 'Online Multiplayer',
			};
			summaryMode.textContent = modeNames[selection.mode] || selection.mode;

			if (selection.tournament) {
				summaryPlayers.textContent = "8 Players (Tournament)";
			} else {
				summaryPlayers.textContent = selection.players + " Players";
			}

			// Map names
			const mapNames = {
				'classic': 'Classic',
				'arena': 'Arena',
				'classic4p': 'Classic 4-Player',
				'battle': 'Arena 4-Player',
				'maze': 'Maze'
			};
			summaryMap.textContent = mapNames[selection.map] || selection.map;

			// Show modal
			confirmationModal.classList.remove('hidden');
		}
	}

	onUnload() {
		// Clean up any resources when navigating away
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}
}

// Create and export a single instance
const home = new Home();
export default home;
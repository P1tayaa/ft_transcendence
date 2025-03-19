import { getWebsocketHost } from './utils.js';
import { Config } from './gameSettings/startGame.js';
import { api } from './ApiManager.js';

document.addEventListener('DOMContentLoaded', function() {
	const selection = {
		mode: null,
		players: null,
		map: null,
		powerups: [],
		tournament: false
	};

	// Current step tracking
	let currentStep = 0;
	const totalSteps = 4;

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

	// Step 4: Powerup Selection
	const powerupOptions = document.querySelectorAll('.powerup-option');

	// Confirmation Modal
	const confirmationModal = document.getElementById('confirmation-modal');
	const summaryMode = document.getElementById('summary-mode');
	const summaryPlayers = document.getElementById('summary-players');
	const summaryMap = document.getElementById('summary-map');
	const summaryPowerups = document.getElementById('summary-powerups');
	const cancelBtn = document.getElementById('cancel-btn');
	const startGameBtn = document.getElementById('start-game-btn');

	// Room list elements
	const createGameBtn = document.getElementById('create-game-btn');
	const createGameModal = document.getElementById('create-game-modal');
	const closeSetupBtn = document.getElementById('close-setup-btn');
	const roomsContainer = document.getElementById('rooms-container');
	const noRoomsMessage = document.getElementById('no-rooms-message');
	const roomTemplate = document.getElementById('room-template');

	const SOCKET_URL = getWebsocketHost() + "/ws/matchmaking/"
	const socket = new WebSocket(SOCKET_URL);

	socket.addEventListener('open', function() {
		socket.send(JSON.stringify({ type: 'list_rooms' }));
	});

	socket.addEventListener('message', function(event) {
		const data = JSON.parse(event.data);

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
	});

	// Create a room element from the template
	function createRoomElement(room) {
		console.log('Creating room element:', room);

		// Clone the template
		const roomElement = roomTemplate.content.cloneNode(true).querySelector('.room-item');

		// Fill in room details
		roomElement.querySelector('.room-name').textContent = room.room_name;

		// Display current/max players
		const playerInfo = `?/${room.config.playerCount}`;
		roomElement.querySelector('.room-players').textContent = "Players: " + playerInfo;

		// Map name
		const mapNames = {
			'classic': 'Classic',
			'arena': 'Arena',
			'classic4p': 'Classic 4-Player',
			'battle': 'Arena 4-Player',
			'maze': 'Maze'
		};
		const mapText = "Map: " + mapNames[room.config.map_style] || room.config.map_style;
		roomElement.querySelector('.room-map').textContent = mapText;

		// Powerups
		const powerupNames = {
			'speed': 'Speed',
			'size': 'Size',
			'multi': 'Multi-Ball'
		};

		let powerupText = "Powerups: ";

		if (room.config.powerup === "true") {
			room.config.poweruplist.forEach(powerupId => {
				powerupText += powerupNames[powerupId] + ", " || "Invalid";
			});
		} else {
			powerupText += "None";
		}
		
		roomElement.querySelector('.room-powerups').textContent = powerupText;

		// Handle join button click
		const joinBtn = roomElement.querySelector('.join-btn');
		joinBtn.addEventListener('click', () => {
			console.log(room.config);
			setTimeout(3000);
			sessionStorage.setItem('config', JSON.stringify(room.config));
			// window.location.href = '/game/' + room.room_name;
		});

		// Store room ID as data attribute for easier access
		roomElement.dataset.roomName = room.room_name;

		return roomElement;
	}

	// Initialize the setup wizard
	function init() {
		// Open setup modal
		createGameBtn.addEventListener('click', function() {
			createGameModal.classList.remove('hidden');
		});

		// Close button for setup modal
		closeSetupBtn.addEventListener('click', function() {
			createGameModal.classList.add('hidden');
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

		// Set up event listeners for powerup selection
		powerupOptions.forEach(option => {
			option.addEventListener('click', function() {
				const powerup = this.getAttribute('data-powerup');

				if (this.classList.contains('selected')) {
					this.classList.remove('selected');
					const index = selection.powerups.indexOf(powerup);

					selection.powerups.splice(index, 1);
				}
				else {
					this.classList.add('selected');
	
					selection.powerups.push(powerup);
				}
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
				const room = await api.createGame(config);

				if (!room) {
					console.error("Failed to create game room.");
					return;
				}

				window.location.href = '/game/' + room.room_name;
			}
			else {
				window.location.href = '/game';
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

		if (stepNumber === 3) {
			nextBtn.disabled = false;
		}

		prevBtn.disabled = (stepNumber === 0);

		nextBtn.innerHTML = (stepNumber === totalSteps - 1) ? 'Finish' : 'Next';

		currentStep = stepNumber;
	}

	// Show confirmation modal with summary
	function showConfirmationModal() {
		// Update summary
		const modeNames = {
			'localsolo': 'Local against AI',
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
		
		// Powerup names
		const powerupNames = {
			'speed': 'Speed Boost',
			'size': 'Paddle Resize',
			'multi': 'Multi-Ball'
		};
		const powerupsList = selection.powerups.map(p => powerupNames[p] || p).join(", ");
		summaryPowerups.textContent = powerupsList || "None";
		
		// Show modal
		confirmationModal.classList.remove('hidden');
	}

	init();
});

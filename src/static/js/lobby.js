import { getURL, postRequest } from './utils.js';

const CREATE_GAME_URL = 'http://localhost:8000/api/create_game/'

class Config {
	constructor () {
		this.mode = null,

		this.playerCount = null,
		this.playerside = [],

		this.bots = false,
		this.botsSide = [],

		this.powerup = false,
		this.poweruplist = [],
		
		this.map_style = null,

		this.host = true,

		this.Spectator = false
	}

	async makeRoom() {
		try {
			const response = await postRequest(CREATE_GAME_URL, { config: this.config });
			return response;
		} catch (error) {
			console.error(error);
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const gameState = {
		mode: null,
		players: null,
		map: null,
		powerups: []
	};

	// Current step tracking
	let currentStep = 0;
	const totalSteps = 4;

	// DOM Elements
	const setupSteps = document.querySelectorAll('.setup-step');
	const progressLines = document.querySelectorAll('.progress-line');
	const prevBtn = document.getElementById('prev-btn');
	const nextBtn = document.getElementById('next-btn');

	// Step 1: Game Mode Selection
	const modeButtons = document.querySelectorAll('[data-mode]');

	// Step 2: Player Count Selection
	const playerButtons = document.querySelectorAll('[data-players]');

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

	// Initialize the setup wizard
	function init() {
		// Set up event listeners for mode selection
		modeButtons.forEach(button => {
			button.addEventListener('click', function() {
				modeButtons.forEach(btn => btn.classList.remove('selected'));
				this.classList.add('selected');
				gameState.mode = this.getAttribute('data-mode');
				nextBtn.disabled = false;
			});
		});

		// Set up event listeners for player selection
		playerButtons.forEach(button => {
			button.addEventListener('click', function() {
				playerButtons.forEach(player => player.classList.remove('selected'));
				this.classList.add('selected');
				nextBtn.disabled = false;

				// Rreset map selection if player count changed
				const players = parseInt(this.getAttribute('data-players'));
				if (gameState.map !== null && gameState.players !== players) {
					gameState.map = null;
					mapOptions.forEach(map => map.classList.remove('selected'));
				}

				gameState.players = players;
			});
		});

		// Set up event listeners for map selection
		mapOptions.forEach(option => {
			option.addEventListener('click', function() {
				mapOptions.forEach(map => map.classList.remove('selected'));
				this.classList.add('selected');
				nextBtn.disabled = false;

				gameState.map = this.getAttribute('data-map');
			});
		});

		// Set up event listeners for powerup selection
		powerupOptions.forEach(option => {
			option.addEventListener('click', function() {
				const powerup = this.getAttribute('data-powerup');

				if (this.classList.contains('selected')) {
					this.classList.remove('selected');
					const index = gameState.powerups.indexOf(powerup);

					gameState.powerups.splice(index, 1);
				}
				else {
					this.classList.add('selected');
	
					gameState.powerups.push(powerup);
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

		startGameBtn.addEventListener('click', function() {
			console.log('Current settings:', gameState);
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
		if (stepNumber === 0 && gameState.mode!== null) {
			nextBtn.disabled = false;
		}

		if (stepNumber === 1 && gameState.players !== null) {
			nextBtn.disabled = false;
		}

		if (stepNumber === 2) {
			// Show appropriate maps based on player count
			maps2Player.classList.toggle('hidden', gameState.players === 4);
			maps4Player.classList.toggle('hidden', gameState.players === 2);

			if (gameState.map !== null) {
				nextBtn.disabled = false;
			}
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
		summaryMode.textContent = modeNames[gameState.mode] || gameState.mode;
		
		let playerText = gameState.players + " Players";
		summaryPlayers.textContent = playerText;
		
		// Map names
		const mapNames = {
			'classic': 'Classic',
			'arena': 'Arena',
			'classic4p': 'Classic 4-Player',
			'battle': 'Arena 4-Player',
			'maze': 'Maze'
		};
		summaryMap.textContent = mapNames[gameState.map] || gameState.map;
		
		// Powerup names
		const powerupNames = {
			'speed': 'Speed Boost',
			'size': 'Paddle Resize',
			'multi': 'Multi-Ball'
		};
		const powerupsList = gameState.powerups.map(p => powerupNames[p] || p).join(", ");
		summaryPowerups.textContent = powerupsList;
		
		// Show modal
		confirmationModal.classList.remove('hidden');

	}

	init();
});

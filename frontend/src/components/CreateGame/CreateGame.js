import './CreateGame.css';

import api from '../../api.js';
import router from '../../router.js';

export default class CreateGameModal {
	constructor() {
		this.element = null;
		this.selection = {
			mode: null,
			players: null,
			map: null,
			tournament: false
		};
		this.currentStep = 0;
		this.totalSteps = 3;
	}

	async init() {
		// Create modal element
		this.element = document.createElement('div');
		this.element.className = 'modal';
		this.element.id = 'create-game-modal';
		document.body.appendChild(this.element);

		// Setup the modal
		await this.render();
		this.setupEventListeners();
	}

	show() {
		if (this.element) {
			this.element.classList.remove('hidden');
		}
	}

	hide() {
		if (this.element) {
			this.element.classList.add('hidden');
		}
	}

	close() {
		if (this.element) {
			this.element.remove();
		}
	}

	render() {
		this.element.innerHTML = `
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
						<div class="map-option" data-map="bath">
							<div class="map-preview" id="bath-preview"></div>
							<div class="map-name">Bath</div>
						</div>
					</div>
					<!-- 4-player maps -->
					<div class="map-container hidden" id="maps-4-player">
						<div class="map-option" data-map="lava">
							<div class="map-preview" id="lava-preview"></div>
							<div class="map-name">Lava</div>
						</div>
						<div class="map-option" data-map="beach">
							<div class="map-preview" id="beach-preview"></div>
							<div class="map-name">Beach</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	setupEventListeners() {
		// DOM Elements
		const setupSteps = this.element.querySelectorAll('.setup-step');
		const progressLines = this.element.querySelectorAll('.progress-line');

		// Step 1: Game Mode Selection
		const modeButtons = this.element.querySelectorAll('[data-mode]');

		// Step 2: Player Count Selection
		const playerButtons = this.element.querySelectorAll('[data-players]');
		const tournamentBtn = this.element.querySelector('#tournament-btn');

		// Step 3: Map Selection
		const maps2Player = this.element.querySelector('#maps-2-player');
		const maps4Player = this.element.querySelector('#maps-4-player');
		const mapOptions = this.element.querySelectorAll('.map-option');

		// Click outside to close
		this.element.addEventListener('click', (event) => {
			if (event.target === this.element) {
				this.hide();
			}
		});

		// Set up event listeners for mode selection
		modeButtons.forEach(button => {
			button.addEventListener('click', () => {
				modeButtons.forEach(btn => btn.classList.remove('selected'));
				button.classList.add('selected');

				const mode = button.getAttribute('data-mode');
				tournamentBtn.classList.toggle('hidden', mode !== 'networked');
				this.selection.mode = mode;
				
				// Automatically go to next step
				this.updateStep(1);
			});
		});

		// Set up event listeners for player selection
		playerButtons.forEach(button => {
			button.addEventListener('click', () => {
				playerButtons.forEach(player => player.classList.remove('selected'));
				button.classList.add('selected');

				// Reset map selection if player count changed
				let players = parseInt(button.getAttribute('data-players'));
				if (this.selection.map !== null && this.selection.players !== players) {
					this.selection.map = null;
					mapOptions.forEach(map => map.classList.remove('selected'));
				}

				if (players === 8) {
					this.selection.tournament = true;
					players = 2;
				} else {
					this.selection.tournament = false;
					maps2Player.classList.toggle('hidden', players !== 2);
					maps4Player.classList.toggle('hidden', players !== 4);
				}

				this.selection.players = players;

				this.updateStep(2);
			});
		});

		// Set up event listeners for map selection
		mapOptions.forEach(option => {
			option.addEventListener('click', () => {
				mapOptions.forEach(map => map.classList.remove('selected'));
				option.classList.add('selected');

				this.selection.map = option.getAttribute('data-map');

				// When map is selected, start the game
				this.createGame();
			});
		});
	}

	// Update the current step
	updateStep(stepNumber) {
		const setupSteps = this.element.querySelectorAll('.setup-step');
		const progressLines = this.element.querySelectorAll('.progress-line');

		setupSteps[this.currentStep].classList.remove('active');
		setupSteps[stepNumber].classList.add('active');

		// Update progress bar
		progressLines[this.currentStep].classList.remove('active');
		progressLines[stepNumber].classList.add('active');
		if (stepNumber > this.currentStep) {
			progressLines[this.currentStep].classList.add('completed');
		} else {
			progressLines[stepNumber].classList.remove('completed');
		}

		this.currentStep = stepNumber;
	}

	// Function to start the game with current selections
	async createGame() {
		if (this.selection.tournament) {
			const room = await api.createTournament(this.selection);

			if (!room) {
				console.error("Failed to create tournament room.");
				return;
			}

			router.navigate('/tournament/' + room.name);
		}
		else if (this.selection.mode === "networked") {
			const room = await api.createGame(this.selection);

			if (!room) {
				console.error("Failed to create game room.");
				return;
			}

			router.navigate('/game/' + room.room_name);
		}
		else {
			sessionStorage.setItem('map', this.selection.map);
			sessionStorage.setItem('playercount', this.selection.players);
			router.navigate('/game/local');
		}
		
		// Hide the game creation modal
		this.hide();
		this.close();
	}
}

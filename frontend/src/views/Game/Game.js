import './Game.css';

import Socket from '../../socket.js';
import user from '../../User.js';
import api from '../../api.js';
import router from '../../router.js';

import PongGame from './src/main.js';

class Game {
	constructor() {
		// Initialize class member variables
		this.socket = null;
		this.isHost = false;
		this.isReady = false;

		this.local = false;
		this.roomName = '';
		this.map = '';
		this.playercount = 0;

		this.game = null;
	}

	render() {
		return `
			<div class="game-container">
				<div class="game-header">
					<h1>Pong Game</h1>
					<div class="header-buttons">
						<button id="start-btn" class="btn btn-start">Start Game</button>
						<button id="leave-btn" class="btn btn-leave">Leave Game</button>
					</div>
				</div>
				<div class="game-content">
					<div class="gameplay-area">
						<div id="game-waiting" class="game-waiting-container">
							<div class="waiting-animation">
								<div class="waiting-subtitle">Waiting for players to join and start the game</div>
								<div class="dots">
									<div class="dot"></div>
									<div class="dot"></div>
									<div class="dot"></div>
								</div>
							</div>
						</div>
						<div id="game-not-found" class="game-waiting-container" style="display: none;">
							<div class="waiting-animation">
								<div class="waiting-title">Game Not Found</div>
								<div class="waiting-subtitle">The game you're looking for doesn't exist or has ended.</div>
							</div>
							<button id="back-to-home" class="btn">Back to Home</button>
						</div>
						<div id="game-over" class="game-waiting-container" style="display: none;">
							<div class="waiting-animation">
								<div class="waiting-subtitle" id="game-result-message">Game Over!</div>
							</div>
						</div>
						<canvas id="pong-game" width="960" height="720">
							Your browser does not support the canvas element.
						</canvas>
					</div>
					<div class="player-sidebar">
						<h2>Players</h2>
						<div class="player-cards" id="player-list">
							<!-- Players will be added here dynamically -->
						</div>
					</div>
				</div>
			</div>
		`;
	}

	async onLoad() {
		 // Reset state when loading a new game view
		this.isHost = false;
		this.isReady = false;

		const path = window.location.pathname;

		// Set up event listener for leaving the game
		const leaveBtn = document.getElementById('leave-btn');
		leaveBtn.addEventListener('click', () => {
			router.navigate('/');
		});

		try {
			this.game = new PongGame();

			if (path === '/game/local') {
				await this.initLocalGame();
			} else {
				const success = await this.initOnlineGame();
				if (!success) {
					this.showGameNotFound();
					return;
				}
			}
		} catch (error) {
			console.error('Error initializing game:', error);
			this.showGameNotFound();
			return;
		}

		// Set up event listener for start button
		this.startBtn = document.getElementById('start-btn');

		if (this.startBtn) {
			this.startBtn.addEventListener('click', () => this.handleStartClick());
		}
	}

	async initLocalGame() {
		this.local = true;
		this.roomName = 'local';

		const map = sessionStorage.getItem('map');

		if (!map) {
			console.error("No map found in session storage");
			return;
		}

		const playercount = sessionStorage.getItem('playercount');

		if (!playercount) {
			console.error("No player count found in session storage");
			return;
		}

		this.map = map;
		this.playercount = parseInt(playercount);

		await this.game.initialize(this.map, this.playercount);
		
		// Show start button for local game
		this.startBtn = document.getElementById('start-btn');
		if (this.startBtn) {
			this.startBtn.style.display = 'block';
			this.startBtn.disabled = false;
		}
		
		// Create and display local players
		this.createLocalPlayersList();
	}
	
	// Create player cards for local game
	createLocalPlayersList() {
		const playerList = document.getElementById('player-list');
		if (!playerList)
			return;
		
		// Clear existing player list
		playerList.innerHTML = '';
		
		// Create player cards for local game based on player count
		const players = [];
		for (let i = 1; i <= this.playercount; i++) {
			players.push({
				name: `Player ${i}`,
				position: i === 1 ? 'Left' : i === 2 ? 'Right' : i === 3 ? 'Top' : 'Bottom',
				isReady: true,
				score: 0
			});
		}

		players.forEach(player => {
			playerList.innerHTML += `
				<div class="player-card" data-position="${player.position.toLowerCase()}">
					<div class="player-avatar-container">
						<div class="player-avatar">${player.name.charAt(0)}</div>
						<div class="status-indicator ready"></div>
					</div>
					<div class="player-info">
						<div class="player-name">${player.name}</div>
						<div class="player-status">${player.position}</div>
					</div>
					<div class="player-score">0</div>
				</div>
			`;
		});
	}

	async initOnlineGame() {
		this.local = false;

		this.roomName = window.location.pathname.split('/').pop();
		if (!this.roomName) {
			console.error("No room name found in URL");
			return false;
		}

		const response = await api.getGameInfo(this.roomName);

		if (!response) {
			console.error("No game info found");
			return false;
		}

		this.map = response.map;
		this.playercount = response.playercount;

		await this.game.initialize(response.map, response.playercount, false);

		this.setupWebSocket();
		return true;
	}

	// Setup WebSocket connection
	setupWebSocket() {
		this.socket = new Socket(`game/${this.roomName}`);

		this.socket.connect();

		this.socket.handleMessage = (data) => {
			console.debug('WebSocket message:', data);

			switch (data.type) {
				case 'game_state_update':
					this.updatePlayersList(data.state.players);
					break;
				case 'started_game':
					this.showGameCanvas();
					this.game.onScoreUpdate = (side, score) => this.updateScoreInSidebar(side, score);
					this.game.startOnline(this.socket, data.side, this.isHost);
					break;
				case 'player_disconnected':
					// Handle player disconnect
					console.debug('Player disconnected:', data.user_id);
					break;
			}
		};
	}

	// Show game canvas and hide waiting screen when game starts
	showGameCanvas() {
		const waitingElement = document.getElementById('game-waiting');
		const gameOverElement = document.getElementById('game-over');
		const canvasElement = document.getElementById('pong-game');
		
		if (waitingElement) {
			waitingElement.style.display = 'none';
		}
		
		if (gameOverElement) {
			gameOverElement.style.display = 'none';
		}
		
		if (canvasElement) {
			canvasElement.style.display = 'block';
			canvasElement.width = 960;
			canvasElement.height = 720;
			canvasElement.style.width = '100%';
			canvasElement.style.height = '100%';
		}
		
		// Hide the start button after game starts
		if (this.startBtn) {
			this.startBtn.style.display = 'none';
		}
	}

	// Show game not found message
	showGameNotFound() {
		// Hide other game elements
		const waitingElement = document.getElementById('game-waiting');
		const gameOverElement = document.getElementById('game-over');
		const canvasElement = document.getElementById('pong-game');
		const gameNotFoundElement = document.getElementById('game-not-found');
		
		if (waitingElement) {
			waitingElement.style.display = 'none';
		}
		
		if (gameOverElement) {
			gameOverElement.style.display = 'none';
		}
		
		if (canvasElement) {
			canvasElement.style.display = 'none';
		}
		
		if (gameNotFoundElement) {
			gameNotFoundElement.style.display = 'flex';
			const backButton = document.getElementById('back-to-home');
			if (backButton) {
				backButton.addEventListener('click', () => {
					router.navigate('/');
				});
			}
		}
		
		// Hide the start button
		if (this.startBtn) {
			this.startBtn.style.display = 'none';
		}
	}

	// Update players list in the sidebar
	updatePlayersList(players) {
		if (!players)
			return;

		const playerList = document.getElementById('player-list');
		if (!playerList)
			return;

		// Clear the player list
		playerList.innerHTML = '';

		// Add each player to the list
		for (const player of players) {
			const isCurrentPlayer = player.id === user.id;

			if (isCurrentPlayer) {
				this.isHost = player.is_host;
				this.isReady = player.is_ready;
			}

			// Append player card HTML to the player list
			playerList.innerHTML += `
				<div class="player-card" data-position="${player.position.toLowerCase()}">
					<div class="player-avatar-container">
						<div class="player-avatar">${player.username.charAt(0)}</div>
						<div class="status-indicator ${player.is_ready ? 'ready' : 'not-ready'} ${player.is_host ? 'host' : ''}"></div>
					</div>
					<div class="player-info">
						<div class="player-name">${player.username}${isCurrentPlayer ? ' (You)' : ''}</div>
						<div class="player-status">${player.is_host ? 'Host' : `${player.position}`}</div>
					</div>
					<div class="player-score">${player.score || 0}</div>
				</div>
			`;
		}

		// Update start button state based on all players ready
		this.startBtn.style.display = this.isHost ? 'block' : 'none';
		this.startBtn.disabled = !(this.isHost && this.ready(players));
	}

	// Check if all players are ready to start the game
	ready(players) {
		if (!players || players.length < this.playercount) {
			return false;
		}

		// Check if all players are ready
		return players.every(player => player.is_ready);
	}

	// Handle start button click
	handleStartClick() {
		if (this.local) {
			this.showGameCanvas();
			this.game.onScoreUpdate = (side, score) => this.updateScoreInSidebar(side, score);
			this.game.startLocal();
			return ;
		}
		
		if (!this.socket || !this.isHost)
			return;

		this.socket.send({type: 'start_game'});
	}

	// New method to update score in the sidebar
	updateScoreInSidebar(side, score) {
		const sideMapping = {
			'left': 'left',
			'right': 'right',
			'top': 'top',
			'bottom': 'bottom'
		};
		
		const position = sideMapping[side.toLowerCase()];
		if (!position) return;
		
		const playerCard = document.querySelector(`.player-card[data-position="${position}"]`);
		if (playerCard) {
			const scoreElement = playerCard.querySelector('.player-score');
			if (scoreElement) {
				scoreElement.textContent = score;
			}
		}
	}

	onUnload() {
		if (this.socket) {
			console.debug('Cleaning up game socket connection');
			this.socket.disconnect();
			this.socket = null;
		}

		if (this.game) {
			console.debug('Cleaning up game instance');
			this.game.game_done();
			this.game = null;
		}

		// Reset game state
		this.isHost = false;
		this.isReady = false;
		this.local = false;
		this.roomName = '';
		this.map = '';
		this.playercount = 0;
		this.startBtn = null;
	}
}

// Create and export a single instance
export default new Game();
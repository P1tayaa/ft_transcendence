// import { api } from './ApiManager.js';
// import { WebSocketManager } from './WebSocket.js';

export class Config {
	constructor(selection) {
		this.mode = selection.mode;
		this.playerCount = selection.players;
		this.map_style = selection.map;
		this.powerup = (selection.powerups.length > 0);
		this.poweruplist = selection.powerups;
		this.bots = (selection.mode === "localsolo");
		this.playerside = [];
		this.botsSide = [];
		this.host = true;
		this.Spectator = false;

		const sides = this.playerCount === 2 ? ["left", "right"] : ["left", "right", "top", "bottom"];

		if (this.bots) {
			const playerIndex = Math.floor(Math.random() * sides.length);
			this.playerside = sides.splice(playerIndex, 1);
			this.botsSide = sides;
		} else {
			this.playerside = sides;
		}
	}

	get() {
		return {
			mode: this.mode,
			powerup: this.powerup,
			poweruplist: this.poweruplist,
			playerCount: this.playerCount,
			map_style: this.map_style,
			playerside: this.playerside,
			bots: this.bots,
			botsSide: this.botsSide,
			host: this.host,
			Spectator: this.Spectator
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	// Get match ID from URL parameter
	const roomName = window.location.pathname.split('/')[2];
	let config = null;
	
	// Try to load game configuration from sessionStorage
	try {
		const storedConfig = sessionStorage.getItem('config');
		if (storedConfig) {
			console.log("Stored Config", storedConfig);
			config = JSON.parse(storedConfig);
			console.log('Loaded game config from sessionStorage:', config);
		}
	} catch (error) {
		console.error('Error loading game config from sessionStorage:', error);
	}

	window.startGame(config, roomName);
});

// document.addEventListener('DOMContentLoaded', function() {
//     // Get match ID from URL parameter
//     const path = window.location.pathname;
//     const roomName = path.split('/')[2];
//     const me = api.getCurrentUser();
	
//     // Game configuration - will be loaded from sessionStorage when needed
//     let config = null;
	
//     // Try to load game configuration from sessionStorage
//     try {
//         const storedConfig = sessionStorage.getItem('config');
//         if (storedConfig) {
//             config = JSON.parse(storedConfig);
//             console.log('Loaded game config from sessionStorage:', config);
//         }
//     } catch (error) {
//         console.error('Error loading game config from sessionStorage:', error);
//     }

//     // if (!config) {
//     //     console.error('No match ID provided');
//     //     document.querySelector('.match-card').innerHTML = '<h2>Redirecting</h2> <p>No id provided, redirecting to the game list...</p>';
//     //     setTimeout(() => {
//     //         window.location.href = '/lobby';
//     //     }, 2000);

//     //     return;
//     // }

//     // WebSocket connection
//     const ws = new WebSocketManager(`/ws/room/${roomName}/`);
//     ws.handleMessage = (data) => {
//         console.log('Received message:', data);
//     };

//     ws.connect();


//     // DOM elements
//     const matchName = document.getElementById('match-name');
//     const matchCreator = document.getElementById('match-creator');
//     const matchPlayers = document.getElementById('match-players');
//     const matchIdElement = document.getElementById('match-id');
//     const matchStatus = document.getElementById('match-status');
//     const playersList = document.getElementById('players-list');
//     const noPlayersMessage = document.getElementById('no-players-message');
//     const gameStats = document.getElementById('game-stats');
//     const noStatsMessage = document.getElementById('no-stats-message');

//     const backBtn = document.getElementById('back-btn');
//     const joinBtn = document.getElementById('join-btn');
//     const readyBtn = document.getElementById('ready-btn');
//     const startBtn = document.getElementById('start-btn');

//     const playerTemplate = document.getElementById('player-template');
//     const gameStatsTemplate = document.getElementById('game-stats-template');

//     // Update match status class
//     function updateStatusClass(status) {
//         matchStatus.classList.remove('status-waiting', 'status-in-progress', 'status-completed');

//         switch (status) {
//             case 'WAITING':
//                 matchStatus.classList.add('status-waiting');
//                 break;
//             case 'IN_PROGRESS':
//                 matchStatus.classList.add('status-in-progress');
//                 break;
//             case 'COMPLETED':
//                 matchStatus.classList.add('status-completed');
//                 break;
//             default:
//                 matchStatus.classList.add('status-waiting');
//         }
//     }

//     // Create a player element from the template
//     function createPlayerElement(player) {
//         const playerElement = playerTemplate.content.cloneNode(true).querySelector('.player-item');

//         // Fill in player details
//         playerElement.querySelector('.player-name').textContent = player.username;
//         playerElement.querySelector('.score').textContent = player.score || 0;
		
//         // Add ready indicator if applicable
//         if (player.ready) {
//             playerElement.classList.add('player-ready');
//             const readyIndicator = document.createElement('span');
//             readyIndicator.className = 'ready-indicator';
//             readyIndicator.textContent = 'Ready';
//             playerElement.querySelector('.player-info').appendChild(readyIndicator);
//         }
		
//         // Add bot indicator if applicable
//         if (player.isBot) {
//             playerElement.classList.add('player-bot');
//             const botIndicator = document.createElement('span');
//             botIndicator.className = 'bot-indicator';
//             botIndicator.textContent = 'Bot';
//             playerElement.querySelector('.player-info').appendChild(botIndicator);
//         }

//         return playerElement;
//     }

//     // Create a game stats element from the template
//     function createGameStatsElement(data) {
//         const statsElement = gameStatsTemplate.content.cloneNode(true).querySelector('.game-stats-item');

//         // Fill in game stats details
//         if (data.players && data.players.length > 0) {
//             statsElement.querySelector('.player1-name').textContent = data.players[0].name || 'Player 1';
//             statsElement.querySelector('.player1-score').textContent = data.players[0].score || 0;
			
//             if (data.players.length > 1) {
//                 statsElement.querySelector('.player2-name').textContent = data.players[1].name || 'Player 2';
//                 statsElement.querySelector('.player2-score').textContent = data.players[1].score || 0;
//             } else {
//                 statsElement.querySelector('.player2-name').textContent = 'Waiting...';
//                 statsElement.querySelector('.player2-score').textContent = 0;
//             }
//         }

//         // Set game time if available
//         if (data.gameTime) {
//             statsElement.querySelector('#game-time').textContent = formatTime(data.gameTime);
//         }

//         return statsElement;
//     }

//     // Format seconds to mm:ss
//     function formatTime(seconds) {
//         const minutes = Math.floor(seconds / 60);
//         const remainingSeconds = seconds % 60;
//         return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
//     }

//     // Fetch match data
//     async function fetchMatchData() {
//         try {
//             const data = await api.getGameInfo(roomName);

//             console.log('Match data:', data);

//             // Update match info
//             matchName.textContent = data.name;
//             matchCreator.textContent = data.creator;
//             matchPlayers.textContent = `${data.players.length}/${data.config.playerCount}`;
//             matchIdElement.textContent = data.id;
//             matchStatus.textContent = data.status;
//             updateStatusClass(data.status);

//             // Update player list
//             if (!data.players || data.players.length === 0) {
//                 noPlayersMessage.classList.remove('hidden');
//             } else {
//                 noPlayersMessage.classList.add('hidden');
//                 playersList.innerHTML = '';

//                 data.players.forEach(player => {
//                     const playerElement = createPlayerElement(player);
//                     playersList.appendChild(playerElement);
//                 });
//             }

//             // Update game stats if match is in progress or completed
//             if (data.status === 'IN_PROGRESS' || data.status === 'COMPLETED') {
//                 noStatsMessage.classList.add('hidden');
//                 gameStats.innerHTML = '';
				
//                 const statsElement = createGameStatsElement(data);
//                 gameStats.appendChild(statsElement);
//             } else {
//                 noStatsMessage.classList.remove('hidden');
//             }

//             // Update button states based on match configuration
//             updateButtonStates(data);

//         } catch (error) {
//             console.error('Error fetching match data:', error);
//         }
//     }
	
//     // Update button states based on match data
//     function updateButtonStates(data) {
//         const isCreator = data.creator === me;
//         const isPlayer = data.players && data.players.some(p => p.name === me);
//         const isFull = data.players_count >= 2;
//         const allPlayersReady = data.players && data.players.length > 1 && 
//                                data.players.every(p => p.ready || p.isBot);
		
//         // Get match mode from gameConfig in sessionStorage
//         const matchMode = config ? config.mode : 'networked';
		
//         // Join button state
//         if (isPlayer) {
//             joinBtn.textContent = 'Already Joined';
//             joinBtn.disabled = true;
//             joinBtn.classList.add('hidden');
//         } else if (isFull && matchMode === 'networked') {
//             joinBtn.textContent = 'Match Full';
//             joinBtn.disabled = true;
//         } else if (data.status !== 'WAITING') {
//             joinBtn.textContent = 'Match Started';
//             joinBtn.disabled = true;
//         } else {
//             joinBtn.textContent = 'Join Match';
//             joinBtn.disabled = false;
//             joinBtn.classList.remove('hidden');
//         }
		
//         // Ready button state
//         if (isPlayer && !isCreator && data.status === 'WAITING') {
//             const currentPlayer = data.players.find(p => p.name === me);
//             if (currentPlayer && currentPlayer.ready) {
//                 readyBtn.textContent = 'Not Ready';
//             } else {
//                 readyBtn.textContent = 'Ready';
//             }
//             readyBtn.classList.remove('hidden');
//             readyBtn.disabled = false;
//         } else {
//             readyBtn.classList.add('hidden');
//         }
		
//         // Start button state
//         if (isCreator && data.status === 'WAITING') {
//             // For networked games, need 2 players and all must be ready
//             if (matchMode === 'networked') {
//                 if (data.players_count >= 2 && allPlayersReady) {
//                     startBtn.classList.remove('hidden');
//                     startBtn.disabled = false;
//                 } else {
//                     startBtn.classList.remove('hidden');
//                     startBtn.disabled = true;
//                 }
//             } 
//             // For local/bot games, just need the creator
//             else if (matchMode === 'local' || matchMode === 'bot') {
//                 startBtn.classList.remove('hidden');
//                 startBtn.disabled = false;
//             }
//         } else {
//             startBtn.classList.add('hidden');
//         }
//     }

//     // Initialize
//     fetchMatchData();

//     // Set up polling for updates
//     const pollingInterval = setInterval(fetchMatchData, 5000);

//     // Clear interval when leaving page
//     window.addEventListener('beforeunload', () => {
//         clearInterval(pollingInterval);
//     });

//     // Event listeners
//     backBtn.addEventListener('click', () => {
//         api.leaveMatch(roomName);
//         window.location.href = '/lobby';
//     });

//     joinBtn.addEventListener('click', () => {
//         api.joinMatch(roomName);
//         // Refresh data immediately after joining
//         setTimeout(fetchMatchData, 500);
//     });

//     startBtn.addEventListener('click', () => {
//         api.startMatch(roomName);
//         // Refresh data immediately after starting
//         setTimeout(fetchMatchData, 500);
//     });
// });
import './Tournament.css';
import Socket from '../../socket.js';
import user from '../../User.js';
import router from '../../router.js';

class Tournament {
	constructor() {
		// Initialize class member variables
		this.socket = null;
		this.tournamentData = null;
		this.isCreator = false;
		this.tournamentName = '';
	}

	render() {
		return `
			<div class="tournament-container">
				<div class="tournament-header">
					<h1 id="tournament-title">Tournament</h1>
					<div class="header-buttons">
						<button id="start-btn" class="btn btn-start" style="display:none;">Start Tournament</button>
						<button id="leave-btn" class="btn btn-leave">Leave</button>
					</div>
				</div>
				<div class="tournament-content">
					<div id="tournament-winner" style="display:none;"></div>
					<div id="tournament-bracket" class="tournament-bracket">
						<!-- Tournament bracket will be loaded here -->
					</div>
				</div>
			</div>
		`;
	}

	async onLoad() {
		// Reset state
		this.tournamentData = null;
		this.isCreator = false;

		// Get tournament name from URL
		this.tournamentName = window.location.pathname.split('/').pop();

		// Set up event listeners
		document.getElementById('leave-btn').addEventListener('click', () => this.handleLeave());
		document.getElementById('start-btn').addEventListener('click', () => this.handleStartTournament());

		// Connect to socket
		this.connectToSocket();
	}

	connectToSocket() {
		// Create websocket connection
		this.socket = new Socket(`tournament/${this.tournamentName}`);

		// Set up message handler
		this.socket.handleMessage = (data) => {
			console.debug('Tournament socket message:', data);

			switch (data.type) {
				case 'tournament_state':
					this.updateTournamentState(data.state);
					break;
				case 'tournament_started':
					this.handleTournamentStarted();
					break;
				case 'error':
					this.showError(data.message);
					break;
			}
		};

		// Connect
		this.socket.connect();
	}

	updateTournamentState(state) {
		if (!state) return;

		// Update tournament data
		this.tournamentData = state;

		// Update title
		document.getElementById('tournament-title').textContent = state.name;

		// Check if current user is the creator
		this.isCreator = state.creator && state.creator.id === user.id;

		// Show winner if tournament is completed
		if (state.status === 'completed' && state.winner) {
			this.showWinner(state.winner);
		} else {
			document.getElementById('tournament-winner').style.display = 'none';
		}

		// Update start button visibility
		const startBtn = document.getElementById('start-btn');
		if (this.isCreator && state.status === 'waiting' && state.players.length === state.max_players) {
			startBtn.style.display = 'block';
			startBtn.disabled = false;
		} else {
			startBtn.style.display = 'none';
		}

		// Render the tournament bracket
		this.renderTournamentBracket();
	}

	renderTournamentBracket() {
		const bracketContainer = document.getElementById('tournament-bracket');
		if (!bracketContainer || !this.tournamentData) return;

		// Get matches by round
		const semifinalMatches = this.tournamentData.matches.filter(m => m.round === 1);
		const finalMatch = this.tournamentData.matches.find(m => m.round === 2);

		if (!semifinalMatches.length || !finalMatch) return;

		// Create bracket HTML using template strings
		const bracketHTML = `
			<div class="tournament-round semifinals">
				<div class="tournament-round-title">Semifinals</div>
				${semifinalMatches.map(match => this.renderMatchTemplate(match)).join('')}
			</div>
			<div class="tournament-round finals">
				<div class="tournament-round-title">Final</div>
				${this.renderMatchTemplate(finalMatch)}
			</div>
		`;

		// Set the HTML
		bracketContainer.innerHTML = bracketHTML;
	}

	renderMatchTemplate(match) {
		// Determine match class based on status
		let matchClass = 'tournament-match';
		if (match.game_room) {
			matchClass += match.winner ? ' completed' : ' in-progress';
		}

		// Generate player 1 HTML
		const player1Class = `tournament-player${match.winner && match.winner.id === match.player1?.id ? ' winner' : ''}${!match.player1 ? ' empty' : ''}`;
		const player1HTML = match.player1
			? `<span class="player-name">${match.player1.username}</span>`
			: `<span class="player-name">Waiting...</span>`;

		// Generate player 2 HTML
		const player2Class = `tournament-player${match.winner && match.winner.id === match.player2?.id ? ' winner' : ''}${!match.player2 ? ' empty' : ''}`;
		const player2HTML = match.player2
			? `<span class="player-name">${match.player2.username}</span>`
			: `<span class="player-name">Waiting...</span>`;

		// Generate match status HTML
		let statusHTML = '';
		if (match.game_room) {
			const statusClass = match.winner ? 'match-status completed' : 'match-status in-progress';
			const statusText = match.winner ? 'Match completed' : 'Match in progress';
			statusHTML = `<div class="${statusClass}">${statusText}</div>`;
		} else if (match.player1 && match.player2) {
			statusHTML = `<div class="match-status waiting">Waiting to start</div>`;
		}

		// Assemble the complete match HTML
		return `
			<div class="${matchClass}">
				<div class="${player1Class}">${player1HTML}</div>
				<div class="${player2Class}">${player2HTML}</div>
				${statusHTML}
			</div>
		`;
	}

	showWinner(winner) {
		const winnerElement = document.getElementById('tournament-winner');
		winnerElement.className = 'tournament-winner';
		winnerElement.innerHTML = `
			<div class="trophy-icon">🏆</div>
			<div>Tournament Champion: ${winner.username}</div>
		`;
		winnerElement.style.display = 'flex';
	}

	showError(message) {
		console.error(`Tournament error: ${message}`);
		// Display error in a more subtle way or as an alert since status bar is gone
		alert(`Tournament error: ${message}`);
	}

	handleTournamentStarted() {
		// Update UI for tournament started
		if (this.tournamentData) {
			this.tournamentData.status = 'in_progress';
			this.renderTournamentBracket();

			// Hide start button
			document.getElementById('start-btn').style.display = 'none';
		}
	}

	handleStartTournament() {
		if (!this.socket)
			return;

		this.socket.send({type: 'start_tournament'});
	}

	handleLeave() {
		// Navigate back to main page
		router.navigate('/');
	}

	onUnload() {
		// Clean up resources
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}
}

export default new Tournament();

import { api } from './ApiManager.js';

/**
 * Socket:
 * 	- On connect
 * 		-> Backend adds the user to the tournament room
 * 		-> Backend sends the tournament data to the user
 * 
 * - On disconnect
 * 		-> Backend removes the user from the tournament room
 * 
 * - On tournament update
 * 		-> Backend sends the updated tournament data to all users in the room
 */

document.addEventListener('DOMContentLoaded', function() {
	// Get tournament ID from URL parameter
	const path = window.location.pathname;
	console.log('Path:', path);
	const tournamentId = path.split('/')[2];
	const me = api.getCurrentUser();

	if (!tournamentId) {
		console.error('No tournament ID provided');
		document.querySelector('.tournament-card').innerHTML = '<h2>Error: No tournament ID provided</h2>';
		return;
	}

	// DOM elements
	const tournamentName = document.getElementById('tournament-name');
	const tournamentCreator = document.getElementById('tournament-creator');
	const tournamentParticipants = document.getElementById('tournament-participants');
	const tournamentIdElement = document.getElementById('tournament-id');
	const tournamentStatus = document.getElementById('tournament-status');
	const participantsList = document.getElementById('participants-list');
	const noParticipantsMessage = document.getElementById('no-participants-message');
	const matchesContainer = document.getElementById('matches-container');
	const noMatchesMessage = document.getElementById('no-matches-message');
	const backBtn = document.getElementById('back-btn');
	const joinBtn = document.getElementById('join-btn');
	const resetBtn = document.getElementById('reset-btn');

	const participantTemplate = document.getElementById('participant-template');
	const matchTemplate = document.getElementById('match-template');

	// Update tournament status class
	function updateStatusClass(status) {
		tournamentStatus.classList.remove('status-waiting', 'status-in-progress', 'status-completed');

		switch (status) {
			case 'WAITING':
				tournamentStatus.classList.add('status-waiting');
				break;
			case 'IN_PROGRESS':
				tournamentStatus.classList.add('status-in-progress');
				break;
			case 'COMPLETED':
				tournamentStatus.classList.add('status-completed');
				break;
			default:
				tournamentStatus.classList.add('status-waiting');
		}
	}

	// Create a participant element from the template
	function createParticipantElement(participant) {
		const participantElement = participantTemplate.content.cloneNode(true).querySelector('.participant-item');

		// Fill in participant details
		participantElement.querySelector('.participant-name').textContent = participant.player;
		participantElement.querySelector('.matches-played').textContent = participant.matches_played;
		participantElement.querySelector('.wins').textContent = participant.wins;
		participantElement.querySelector('.losses').textContent = participant.losses;
		participantElement.querySelector('.points').textContent = participant.points;

		return participantElement;
	}

	// Create a match element from the template
	function createMatchElement(match) {
		const matchElement = matchTemplate.content.cloneNode(true).querySelector('.match-item');

		// Fill in match details
		matchElement.querySelector('.player1').textContent = match.player1 || 'TBD';
		matchElement.querySelector('.player2').textContent = match.player2 || 'TBD';
		matchElement.querySelector('.match-status').textContent = match.status || 'Scheduled';

		return matchElement;
	}

	// Fetch tournament data
	async function fetchTournamentData() {
		try {
			const data = await api.getTournamentInfo(tournamentId);

			console.log('Tournament data:', data);

			// Update tournament info
			tournamentName.textContent = data.info.name;
			tournamentCreator.textContent = data.info.creator;
			tournamentParticipants.textContent = `${data.standings.length}/${data.info.max_participants}`;
			tournamentIdElement.textContent = data.info.id;
			tournamentStatus.textContent = data.info.status;
			updateStatusClass(data.info.status);

			// Update participant list
			if (data.standings.length === 0) {
				noParticipantsMessage.classList.remove('hidden');
			} else {
				noParticipantsMessage.classList.add('hidden');
				participantsList.innerHTML = '';

				data.standings.forEach(participant => {
					const participantElement = createParticipantElement(participant);
					participantsList.appendChild(participantElement);
				});
			}

			console.log('Status:', data.status);
			// Update matches list (if available)
			if (data.matches && data.matches.length > 0) {
				noMatchesMessage.classList.add('hidden');

				// data.matches.forEach(match => {
				// 	const matchElement = createMatchElement(match);
				// 	matchesContainer.appendChild(matchElement);
				// });

			} else {
				noMatchesMessage.classList.remove('hidden');
			}

			// Update join button state
			const isParticipant = data.standings.some(p => p.player === me);
			const isFull = data.standings.length >= data.info.max_participants;

			if (isParticipant) {
				joinBtn.textContent = 'Already Joined';
				joinBtn.disabled = true;
			} else if (isFull) {
				joinBtn.textContent = 'Tournament Full';
				joinBtn.disabled = true;
			} else {
				joinBtn.textContent = 'Join Tournament';
				joinBtn.disabled = false;
			}

			// Disable join button if tournament is in progress or completed
			if (data.info.status !== 'WAITING') {
				joinBtn.textContent = 'Tournament Started';
				joinBtn.disabled = true;
			}

		} catch (error) {
			console.error('Error fetching tournament data:', error);
		}
	}

	// Initialize
	fetchTournamentData();

	// Set up polling for updates
	const pollingInterval = setInterval(fetchTournamentData, 5000);

	// Clear interval when leaving page
	window.addEventListener('beforeunload', () => {
		clearInterval(pollingInterval);
	});

	// Event listeners
	backBtn.addEventListener('click', () => {
		api.leaveTournament(tournamentId);

		// window.location.href = '/lobby';
	});

	resetBtn.addEventListener('click', () => {
		api.resetDatabase();
	});

	joinBtn.addEventListener('click', () => {
		api.joinTournament(tournamentId);
	});
});
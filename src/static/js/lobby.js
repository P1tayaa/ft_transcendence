import { getRequest, postRequest } from './utils.js';

const LOBBY_LIST_URL = '../api/lobbies';

const LOBBY_MAKE_URL = '../api/lobby/create/';

// Need id:
// const LOBBY_JOIN_URL = '../api/lobby/join/';
// const LOBBY_LEAVE_URL = '../api/lobby/leave/';
// const LOBBY_INFO_URL = '../api/lobby/';

async function createLobby() {
	try {
		const response = await postRequest(LOBBY_MAKE_URL, { name: 'test' });
		return response;
	} catch (error) {
		console.error('Error creating lobby:', error);
	}
}


document.addEventListener('DOMContentLoaded', async () => {
	const lobby = await createLobby();
	console.log(lobby);
	
});
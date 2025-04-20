
import startGame from './src/main.js';

const gameOnLoad = async () => {
	// Get match ID from URL parameter
	const roomName = window.location.pathname.split('/').pop();
	console.log("roomName", roomName);
	let config = null;
	
	// Try to load game configuration from sessionStorage
	try {
		const storedConfig = sessionStorage.getItem('config');
		if (storedConfig) {
			console.log("Stored Config", storedConfig);
			config = JSON.parse(storedConfig);
			console.log('Loaded game config from sessionStorage:', config);
		} else {
			console.log('No game config found in sessionStorage.');
			return false;
		}
	} catch (error) {
		console.error('Error loading game config from sessionStorage:', error);
	}

	startGame(config, roomName);
};

export default gameOnLoad;
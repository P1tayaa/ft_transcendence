
import startGame from './src/main.js';

const gameOnLoad = () => {
	// Get match ID from URL parameter
	// const roomName = window.location.pathname.split('/')[2];
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

	startGame(config);
};

export default gameOnLoad;
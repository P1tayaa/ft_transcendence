function setCookie(name, value, hours = undefined, path = '/') {
	let expires = "";

	if (hours) {
		const date = new Date();
		date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
		expires = `; expires=${date.toGMTString()}`;
	}

	document.cookie = `${name}=${value}${expires}; path=/`;
}

function getCookie(name) {
	const cookies = document.cookie.split(';');
	const cookie = cookies.find(cookie => cookie.trim().startsWith(name + '='));

	return cookie ? cookie.split('=')[1] : null;
}

function eraseCookie(name) {
	createCookie(name, "" );
}

class ApiManager {
	constructor() {
		// API base URL
		this.baseUrl = window.location.origin + '/api/';

		// API endpoints
		this.endpoints = {
			me: 'me/',
			search: 'search/',

			register: 'register/',
			login: 'login/',
			logout: 'logout/',

			friends: 'follow/following/',
			addFriend: 'follow/',
			removeFriend: 'follow/unfollow/',

			matchHistory: 'score/',

			chat: 'chats/',
			sendMessage: 'chats/message/',

			createTournament: 'tournament/create/',
			getTournamentList: 'tournament/list/',
			getTournamentInfo: 'tournament/get/',
			joinTournament: 'tournament/join/',
			leaveTournament: 'tournament/leave/',
			updateTournament: 'tournament/update_score/',

			createGame: 'game/create/',
			getGameInfo: 'game/get/',

			resetDatabase: 'dev_reset/',
		};
	}

	async request(url, headers, method = 'GET', body = null) {
		const options = {
			method,
			headers,
			credentials: 'include',
		};

		if (body && method !== 'GET') {
			options.body = JSON.stringify(body);
		}

		console.log(method, ' Request to url:', url);
	
		const response = await fetch(url, options);
		const data = await response.json();
	
		if (!response.ok) {
			throw new Error(data.message || `${method} request failed`);
		}

		return data;
	}

	getHeaders() {
		const csrfToken = getCookie('csrftoken');
		const authToken = getCookie('auth-token');

		if (!csrfToken) {
			throw new Error('CSRF token not found');
		}

		if (!authToken) {
			throw new Error('Token not found');
		}

		return {
			"Content-Type": 'application/json',
			"X-CSRFToken": csrfToken,
			"Authorization": `Bearer ${authToken}`
		};
	}

	/**
	 * Make a GET request to the API
	 * @param {string} endpoint - The endpoint to request
	 * @param {Object} params - The query parameters
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async get(endpoint, params = {}) {
		// Build the URL with query parameters
		const url = new URL(this.baseUrl + endpoint);

		// Add query parameters
		Object.keys(params).forEach(key => {
			url.searchParams.append(key, params[key]);
		});

		try {
			return this.request(url, this.getHeaders());
		} catch (error) {
			console.error('GET request failed', error);
			throw error;
		}
	}

	/**
	 * Make a POST request to the API
	 * @param {string} endpoint - The endpoint to request
	 * @param {Object} data - The data to send
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async post(endpoint, data = {}) {
		try {
			return this.request(this.baseUrl + endpoint, this.getHeaders(), 'POST', data);
		} catch (error) {
			console.error('POST request failed', error);
			throw error;
		}
	}

	/**
	 * SPECIAL FUNCTION, BECAUSE OF THE FORM DATA
	 * Register a new user
	 * @param {FormData} data - The registration form data
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async register(data) {
		const headers = {
			"X-CSRFToken": getCookie('csrftoken'),
		}

		try {
			const response = await fetch(this.baseUrl + this.endpoints.register, {
				method: 'POST',
				headers: headers,
				credentials: 'include',
				body: data
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Registration failed');
			}

			const reponseJSON = await response.json();

			setCookie('auth-token', reponseJSON.token, 1);
			return reponseJSON;
		} catch (error) {
			console.error('Register request failed', error);
			throw error;
		}
	}

	/**
	 * Log the user in
	 * @param {string} username - The username
	 * @param {string} password - The password
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async login(username, password) {
		const headers = {
			"X-CSRFToken": getCookie('csrftoken'),
			"Content-Type": 'application/json',
		}

		const data = {
			username: username,
			password: password
		};

		try {
			const response = await this.request(this.baseUrl + this.endpoints.login, headers, 'POST', data);
			setCookie('auth-token', response.token, 1);
			return response;
		} catch (error) {
			console.error('Login request failed', error);
			throw error;
		}
	}

	/**
	 * Get the current user
	 * @returns {Promise} A promise that resolves with the current user data
	 */
	async getCurrentUser() {
		return this.get(this.endpoints.me);
	}

	/**
	 * Get the current user's friends
	 * @returns {Promise} A promise that resolves with the friends data
	 */
	async getFriends() {
		const response = await this.get(this.endpoints.friends);
		return response.following || [];
	}

	/**
	 * Search for users by username
	 * @param {string} username - The username to search for
	 * @returns {Promise} A promise that resolves with the search results
	 */
	async searchUsers(username) {
		const response = await this.get(this.endpoints.search, { username: username });
		return response.results || [];
	}

	/**
	 * Add a friend
	 * @param {string} userId - The user ID to add as a friend
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async addFriend(userId) {
		return this.post(this.endpoints.addFriend, { user_id: userId });
	}

	/**
	 * Remove a friend
	 * @param {string} userId - The user ID to remove as a friend
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async removeFriend(userId) {
		return this.post(this.endpoints.removeFriend, { user_id: userId });
	}

	/**
	 * Get a user's match history
	 * @param {string} userId - The user ID
	 * @returns {Promise} A promise that resolves with the match history data
	 */
	async getMatchHistory(userId) {
		const response = await this.get(this.endpoints.matchHistory, { user_id: userId });
		return response.games || [];
	}

	/**
	 * Get chat history with a user
	 * @param {string} userId - The user ID
	 * @returns {Promise} A promise that resolves with the chat history data
	 */
	async getChatHistory(userId) {
		return this.get(this.endpoints.chat, { user_id: userId });
	}

	/**
	 * Send a message to a user
	 * @param {string} userId - The recipient user ID
	 * @param {string} message - The message content
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async sendMessage(userId, message) {
		return this.post(this.endpoints.sendMessage, {
			recipient_id: userId,
			content: message
		});
	}

	/** 
	 * Create a game
	 * @param {Object} config - The game configuration
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async createGame(config) {
		return this.post(this.endpoints.createGame, { config: config });
	}

	/**
	 * Get game information by name
	 * @param {string} gameName - The game name
	 * @returns {Promise} A promise that resolves with the game data
	 */
	async getGameInfo(gameName) {
		return this.get(this.endpoints.getGameInfo, { name: gameName });
	}

	/**
	 * Create a tournament
	 * @param {Object} config - The tournament configuration
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async createTournament(config) {
		return this.post(this.endpoints.createTournament, { config: config });
	}

	/**
	 * Get a list of tournaments
	 * @returns {Promise} A promise that resolves with the tournament list
	 */
	async getTournamentList() {
		return this.get(this.endpoints.getTournamentList);
	}

	/**
	 * Get tournament information by ID
	 * @param {string} tournamentId - The tournament ID
	 * @returns {Promise} A promise that resolves with the tournament data
	 */
	async getTournamentInfo(tournamentId) {
		return this.get(this.endpoints.getTournamentInfo, { tournament_id: tournamentId });
	}

	/**
	 * Join a tournament
	 * @param {string} tournamentId - The tournament ID
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async joinTournament(tournamentId) {
		return this.post(this.endpoints.joinTournament, { tournament_id: tournamentId });
	}

	/**
	 * Leave a tournament
	 * @param {string} tournamentId - The tournament ID
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async leaveTournament(tournamentId) {
		return this.post(this.endpoints.leaveTournament, { tournament_id: tournamentId });
	}

	/**
	 * DEV ONLY: Reset the database
	 */
	async resetDatabase() {
		return this.post(this.endpoints.resetDatabase);
	}
}

const api = new ApiManager();
export default api;
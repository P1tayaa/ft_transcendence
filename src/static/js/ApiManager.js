export class ApiManager {
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

			friends: 'follow/following',
			addFriend: 'follow/',
			removeFriend: 'follow/unfollow',

			matchHistory: 'score/',

			chat: 'chats/',
			sendMessage: 'chats/message/',

			createTournament: 'tournament/create/',
			getTournamentList: 'tournament/list/',
			getTournamentInfo: 'tournament/get/',
			joinTournament: 'tournament/join/',
			leaveTournament: 'tournament/leave/',
			updateTournament: 'tournament/update_score/',

			createGame: 'game/create',
			getGameInfo: 'game/get',

			resetDatabase: 'dev_reset/',
		};
	}

	/**
	 * Get the CSRF token from the page
	 * @returns {string} The CSRF token
	 */
	getCSRFToken() {
		return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
		  document.cookie.split('; ')
			.find(row => row.startsWith('csrftoken='))
			?.split('=')[1];
	}

	/**
	 * Make a request to the API
	 * @param {string} url - The URL to request
	 * @param {string} method - The request method
	 * @param {Object} body - The request body
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async makeRequest(url, method = 'GET', body = null) {
		const csrfToken = this.getCSRFToken();
	
		if (!csrfToken) {
			throw new Error('CSRF token not found');
		}
	
		const headers = {
			"Content-Type": 'application/json',
			"X-CSRFToken": csrfToken
		};
	
		const options = {
			method,
			headers,
			credentials: 'include',
		};
	
		if (body && method !== 'GET') {
			options.body = JSON.stringify(body);
		}
	
		const response = await fetch(url, options);
		const data = await response.json();
	
		if (!response.ok) {
			throw new Error(data.message || `${method} request failed`);
		}
	
		return data;
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
			return this.makeRequest(url);
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
			return this.makeRequest(this.baseUrl + endpoint, 'POST', data);
		} catch (error) {
			console.error('POST request failed', error);
			throw error;
		}
	}

	/**
	 * SPECIAL FUNCTION, BECAUSE OF THE FORM DATA
	 * Register a new user
	 * @param {Object} formData - The registration form data
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async register(formData) {
		const csrfToken = this.getCSRFToken();
	
		if (!csrfToken) {
			throw new Error('CSRF token not found');
		}
	
		const options = {
			method: 'POST',
			headers: { 'X-CSRFToken': csrfToken },
			credentials: 'include',
			body: formData
		};

		try {
			const response = await fetch(this.baseUrl + this.endpoints.register, options);

			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.message || 'Registration failed');
			}

			return data;
		} catch (error) {
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
		return this.post(this.endpoints.login, { username, password });
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

export const api = new ApiManager();
export class ApiManager {
	constructor() {
		// API base URL
		this.baseUrl = window.location.origin;

		// API endpoints
		this.endpoints = {
			me: '/api/me',
			user: '/api/user/',
			search: '/api/search/',

			friends: '/api/follow/following',
			addFriend: '/api/follow/',
			removeFriend: '/api/follow/unfollow',

			matchHistory: '/api/score/',

			chat: '/api/chats/',
			sendMessage: '/api/chats/message/',

			createTournament: '/api/tournament/create/',
			getTournamentList: '/api/tournament/list/',
			getTournamentInfo: '/api/tournament/get_data/',
			joinTournament: '/api/tournament/join/',
			updateTournament: '/api/tournament/update_score/',

			createGame: '/api/create_game/',
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
			"Content-Type": "application/json",
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
	 * Get a user by ID
	 * @param {string} userId - The user ID
	 * @returns {Promise} A promise that resolves with the user data
	 */
	async getUser(userId) {
		return this.get(this.endpoints.user, { user_id: userId });
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
		const response = await this.get(this.endpoints.search, { username });
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

	async createGame(config) {
		return this.post(this.endpoints.createGame, { config: config });
	}

	async createTournament(config) {
		return this.post(this.endpoints.createTournament, { config: config });
	}

	async getTournamentList() {
		return this.get(this.endpoints.getTournamentList);
	}

	async getTournamentInfo(tournamentId) {
		return this.get(this.endpoints.getTournamentInfo, { tournament_id: tournamentId });
	}

	async joinTournament(tournamentId) {
		return this.post(this.endpoints.joinTournament, { tournament_id: tournamentId });
	}
}

export const api = new ApiManager();
function getCookie(name) {
	const cookies = document.cookie.split(';');
	const cookie = cookies.find(cookie => cookie.trim().startsWith(name + '='));

	return cookie ? cookie.split('=')[1] : null;
}

class ApiManager {
	constructor() {
		// API base URL
		this.baseUrl = window.location.origin + '/api/';

		// API endpoints
		this.endpoints = {
			user: {
				me: 'me/',
				search: 'users/search',
				get: 'users/',
			},
			
			auth: {
				register: 'register/',
				login: 'login/',
				logout: 'logout/',
			},
			
			social: {
				friends: 'follow/following/',
				addFriend: 'follow/',
				removeFriend: 'follow/unfollow/',
				block: 'block/',
				unblock: 'unblock/',
			},
			
			score: {
				matchHistory: 'score/',
			},
			
			chat: {
				history: 'chats/',
				sendMessage: 'chats/message/',
			},
			
			tournament: {
				create: 'tournament/create/',
				list: 'tournament/list/',
				info: 'tournament/get/',
				join: 'tournament/join/',
				leave: 'tournament/leave/',
				updateScore: 'tournament/update_score/',
			},
			
			game: {
				create: 'game/create/',
				info: 'game/get/',
				list: 'game/list/',
			},
			
			dev: {
				resetDatabase: 'dev_reset/',
			}
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

		return this.request(url, this.getHeaders());
	}

	/**
	 * Make a POST request to the API
	 * @param {string} endpoint - The endpoint to request
	 * @param {Object} data - The data to send
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async post(endpoint, data = {}) {
		return this.request(this.baseUrl + endpoint, this.getHeaders(), 'POST', data);
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

		const response = await fetch(this.baseUrl + this.endpoints.auth.register, {
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

		return reponseJSON;
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

		const response = await this.request(this.baseUrl + this.endpoints.auth.login, headers, 'POST', data);

		return response;
	}

	/**
	 * Get the current user
	 * @returns {Promise} A promise that resolves with the current user data
	 */
	async getCurrentUser() {
		return this.get(this.endpoints.user.me);
	}

	getUser(userId) {
		return this.get(this.endpoints.user.get + userId + '/');
	}

	/**
	 * Get the current user's friends
	 * @returns {Promise} A promise that resolves with the friends data
	 */
	async getFriends() {
		const response = await this.get(this.endpoints.social.friends);
		return response.following || [];
	}

	/**
	 * Search for users by username
	 * @param {string} username - The username to search for
	 * @returns {Promise} A promise that resolves with the search results
	 */
	async searchUsers(username) {
		const response = await this.get(this.endpoints.user.search, { username: username });
		return response.results || [];
	}

	/**
	 * Add a friend
	 * @param {string} userId - The user ID to add as a friend
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async addFriend(userId) {
		return this.post(this.endpoints.social.addFriend, { user_id: userId });
	}

	/**
	 * Remove a friend
	 * @param {string} userId - The user ID to remove as a friend
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async removeFriend(userId) {
		return this.post(this.endpoints.social.removeFriend, { user_id: userId });
	}

	/**
	 * Block a user
	 * @param {string} userId - The user ID to block
	 * @returns {Promise} A promise that resolves with the response data
	 * */
	async block(userId) {
		return this.post(this.endpoints.social.block, { user_id: userId });
	}

	/**
	 * Unblock a user
	 * @param {string} userId - The user ID to unblock
	 * @returns {Promise} A promise that resolves with the response data
	 * */
	async unblock(userId) {
		return this.post(this.endpoints.social.unblock, { user_id: userId });
	}
	
	/**
	 * Get a user's match history
	 * @param {string} userId - The user ID
	 * @returns {Promise} A promise that resolves with the match history data
	 */
	async getMatchHistory(userId) {
		const response = await this.get(this.endpoints.score.matchHistory, { user_id: userId });
		return response.games || [];
	}

	/**
	 * Get chat history with a user
	 * @param {string} userId - The user ID
	 * @returns {Promise} A promise that resolves with the chat history data
	 */
	async getChatHistory(userId) {
		return this.get(this.endpoints.chat.history, { user_id: userId });
	}

	/**
	 * Send a message to a user
	 * @param {string} userId - The recipient user ID
	 * @param {string} message - The message content
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async sendMessage(userId, message) {
		return this.post(this.endpoints.chat.sendMessage, {
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
		return this.post(this.endpoints.game.create, { config: config });
	}

	/**
	 * Get game information by name
	 * @param {string} gameName - The game name
	 * @returns {Promise} A promise that resolves with the game data
	 */
	async getGameInfo(gameName) {
		return this.get(this.endpoints.game.info, { name: gameName });
	}

	/**
	 * Get a list of games
	 * @returns {Promise} A promise that resolves with the game list
	 */
	async getGameList() {
		return this.get(this.endpoints.game.list);
	}

	/**
	 * Create a tournament
	 * @param {Object} config - The tournament configuration
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async createTournament(config) {
		return this.post(this.endpoints.tournament.create, { config: config });
	}

	/**
	 * Get a list of tournaments
	 * @returns {Promise} A promise that resolves with the tournament list
	 */
	async getTournamentList() {
		return this.get(this.endpoints.tournament.list);
	}

	/**
	 * Get tournament information by ID
	 * @param {string} tournamentId - The tournament ID
	 * @returns {Promise} A promise that resolves with the tournament data
	 */
	async getTournamentInfo(tournamentId) {
		return this.get(this.endpoints.tournament.info, { tournament_id: tournamentId });
	}

	/**
	 * Join a tournament
	 * @param {string} tournamentId - The tournament ID
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async joinTournament(tournamentId) {
		return this.post(this.endpoints.tournament.join, { tournament_id: tournamentId });
	}

	/**
	 * Leave a tournament
	 * @param {string} tournamentId - The tournament ID
	 * @returns {Promise} A promise that resolves with the response data
	 */
	async leaveTournament(tournamentId) {
		return this.post(this.endpoints.tournament.leave, { tournament_id: tournamentId });
	}

	/**
	 * DEV ONLY: Reset the database
	 */
	async resetDatabase() {
		return this.post(this.endpoints.dev.resetDatabase);
	}
}

const api = new ApiManager();
export default api;
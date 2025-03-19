// ProfileManager.js - Manages user profiles and profile modal
export class ProfileManager {
	/**
	 * Constructor for the ProfileManager class
	 * @param {ApiClient} api - The API client for server communication
	 * @param {TemplateManager} templateManager - The template manager for cloning templates
	 * @param {Object} currentUser - The current user object
	 * @param {ChatManager} chatManager - The chat manager for chat functionality
	 */
	constructor(api, templateManager, currentUser, chatManager) {
		// Dependencies
		this.api = api;
		this.templateManager = templateManager;
		this.currentUser = currentUser;
		this.chatManager = chatManager;

		// State
		this.activeProfile = null;

		// DOM Elements
		this.profileModal = document.getElementById('profile-modal');
		this.profileAvatar = document.getElementById('profile-avatar');
		this.profileUsername = document.getElementById('profile-username');
		this.profileStatus = document.getElementById('profile-status');
		this.profileActions = document.getElementById('profile-actions');
		this.closeProfileBtn = document.getElementById('close-profile');
		this.matchHistoryContainer = document.getElementById('match-history-container');
		this.emptyMatches = document.getElementById('empty-matches');
		this.profileChatMessages = document.getElementById('profile-chat-messages');
		this.emptyChat = document.getElementById('empty-chat');
		this.profileChatInput = document.getElementById('profile-chat-input');
		this.profileChatSend = document.getElementById('profile-chat-send');
	}

	/**
	 * Initialize the ProfileManager
	 * @returns {Promise} A promise that resolves when initialization is complete
	 */
	async init() {
		// Set up event listeners
		this.setupEventListeners();

		return true;
	}

	/**
	 * Open a user's profile
	 * @param {Object} user The user object
	 * @returns {Promise} A promise that resolves when the profile is opened
	 */
	async open(user) {
		try {
			this.activeProfile = user;

			// Update the profile UI
			this.updateProfileUI(user);

			// Load match history
			await this.loadMatchHistory(user.id);

			// If we're viewing someone else's profile, load chat history
			if (user.id !== this.currentUser.id) {
				await this.loadProfileChat(user.id);
			}

			// Show the profile modal
			this.profileModal.classList.add('active');

			return true;
		} catch (error) {
			console.error('Failed to open profile:', error);
			return false;
		}
	}

	/**
	 * Update the profile UI with user data
	 * @param {Object} user - The user object
	 */
	updateProfileUI(user) {
		// Set avatar and username
		this.profileAvatar.src = user.avatar;
		this.profileAvatar.alt = `${user.username}'s avatar`;
		this.profileUsername.textContent = user.username;

		// Set online status
		this.profileStatus.textContent = user.online ? 'Online' : 'Offline';

		// Update action buttons
		this.updateProfileActions(user);

		// Show/hide chat tab based on whether it's own profile
		const chatTab = document.querySelector('.profile-tab[data-tab="chat"]');
		if (user.id === this.currentUser.id) {
			chatTab.style.display = 'none';

			// Make sure we're on the history tab
			const historyTab = document.querySelector('.profile-tab[data-tab="match-history"]');
			if (!historyTab.classList.contains('active')) {
				historyTab.click();
			}
		} else {
			chatTab.style.display = 'block';
		}
	}

	/**
	 * Update the profile action buttons
	 * @param {Object} user - The user object
	 */
	updateProfileActions(user) {
		// Clear current actions
		this.profileActions.innerHTML = '';

		// For own profile, show edit button
		if (user.id === this.currentUser.id) {
			const editBtn = this.createActionButton('Edit Profile', 'primary');
			editBtn.addEventListener('click', () => {
				alert('Profile editing coming soon!');
			});

			this.profileActions.appendChild(editBtn);
			return;
		}

		// For other users, show friend/message buttons

		// Add/remove friend button
		const friendBtn = this.createActionButton(
			user.isFriend ? 'Remove Friend' : 'Add Friend',
			user.isFriend ? 'secondary' : 'primary'
		);

		friendBtn.addEventListener('click', async () => {
			if (user.isFriend) {
				await this.api.removeFriend(user.id);
				friendBtn.textContent = 'Add Friend';
				friendBtn.classList.remove('secondary');
				friendBtn.classList.add('primary');
				user.isFriend = false;
			} else {
				await this.api.addFriend(user.id);
				friendBtn.textContent = 'Remove Friend';
				friendBtn.classList.remove('primary');
				friendBtn.classList.add('secondary');
				user.isFriend = true;
			}
		});

		// Message button
		const messageBtn = this.createActionButton('Message', 'primary');
		messageBtn.addEventListener('click', () => {
			// Switch to chat tab
			document.querySelector('.profile-tab[data-tab="chat"]').click();

			// Focus the chat input
			this.profileChatInput.focus();
		});

		// Invite to game button
		const inviteBtn = this.createActionButton('Invite to Game', 'secondary');
		inviteBtn.addEventListener('click', () => {
			alert('Game invitations coming soon!');
		});

		// Add buttons to actions container
		this.profileActions.appendChild(friendBtn);
		this.profileActions.appendChild(messageBtn);
		this.profileActions.appendChild(inviteBtn);
	}

	/**
	 * Create an action button element
	 * @param {string} text - The button text
	 * @param {string} type - The button type (primary or secondary)
	 * @returns {HTMLElement} The button element
	 */
	createActionButton(text, type = 'primary') {
		// Clone the action button template
		const buttonElement = this.templateManager.fillTemplate('action-button-template');

		// Set the button text
		const button = buttonElement.querySelector('.profile-action-btn');
		button.textContent = text;

		// Set the button type
		if (type === 'secondary') {
			button.classList.add('secondary');
		}

		return button;
	}

	/**
	 * Load match history for a user
	 * @param {string} userId - The ID of the user
	 * @returns {Promise} A promise that resolves when match history is loaded
	 */
	async loadMatchHistory(userId) {
		try {
			// Get match history from the API
			const matches = await this.api.getMatchHistory(userId);

			// Render match history
			this.renderMatchHistory(matches, userId === this.currentUser.id);

			return true;
		} catch (error) {
			console.error('Failed to load match history:', error);
			return false;
		}
	}

	/**
	 * Render match history
	 * @param {Array} matches - The match history array
	 * @param {boolean} isOwnProfile - Whether this is the current user's profile
	 */
	renderMatchHistory(matches, isOwnProfile) {
		this.matchHistoryContainer.innerHTML = '';

		if (!matches || matches.length === 0) {
			// Show empty state
			this.emptyMatches.style.display = 'block';

			this.matchHistoryContainer.appendChild(container);
			return;
		}

		// Hide empty state
		this.emptyMatches.style.display = 'none';

		// Add each match
		matches.forEach(match => {
			const matchEl = this.createMatchElement(match);
			this.matchHistoryContainer.appendChild(matchEl);
		});
	}

	// TODO: Find out correct match object structure

	/**
	 * Create a match history element
	 * @param {Object} match - The match object
	 * @returns {HTMLElement} The match element
	 */
	createMatchElement(match) {
		const matchElement = this.templateManager.cloneTemplate('match-item-template');

		// Set the match date
		const dateEl = matchElement.querySelector('.match-date');
		dateEl.textContent = new Date(match.date).toLocaleDateString();

		// Set the match result
		const resultEl = matchElement.querySelector('.match-result');
		const isWin = match.is_win;
		resultEl.textContent = isWin ? 'Win' : 'Loss';
		resultEl.classList.add(isWin ? 'match-win' : 'match-loss');

		// Set the match score
		matchElement.querySelector('.match-score').textContent = match.score;

		return matchElement.querySelector('.match-item');
	}

	/**
	 * Load chat for a user in the profile modal
	 * @param {string} userId - The ID of the user
	 * @returns {Promise} A promise that resolves when chat is loaded
	 */
	async loadProfileChat(userId) {
		try {
			const chatData = await this.api.getChatHistory(userId);

			// Render chat messages
			this.renderProfileChat(chatData.messages || []);

			return true;
		} catch (error) {
			console.error('Failed to load profile chat:', error);
			return false;
		}
	}

	/**
	 * Render chat messages in the profile modal
	 * @param {Array} messages - The chat messages array
	 */
	renderProfileChat(messages) {
		// Clear current messages
		this.profileChatMessages.innerHTML = '';

		if (!messages || messages.length === 0) {
			// Show empty state
			emptyChat.style.display = 'block';
			return;
		}

		// Hide empty state
		emptyChat.style.display = 'none';

		// Add each message
		messages.forEach(message => {
			const messageEl = this.createProfileMessageElement(message);
			this.profileChatMessages.appendChild(messageEl);
		});

		// Scroll to bottom
		this.profileChatMessages.scrollTop = this.profileChatMessages.scrollHeight;
	}

	/**
	 * Create a profile chat message element
	 * @param {Object} message - The message object
	 * @returns {HTMLElement} The message element
	 */
	createProfileMessageElement(message) {
		// Clone the message template
		const messageElement = this.templateManager.cloneTemplate('message-template');

		// Set the message content
		const msgDiv = messageElement.querySelector('.message');
		msgDiv.textContent = message.content;

		// Set the message class based on sender
		if (message.senderId === this.currentUser.id) {
			msgDiv.classList.add('sent');
		} else {
			msgDiv.classList.add('received');
		}

		return msgDiv;
	}

	/**
	 * Send a message from the profile chat
	 * @param {string} content - The message content
	 * @returns {Promise} A promise that resolves when the message is sent
	 */
	async sendProfileMessage(content) {
		if (!this.activeProfile || this.activeProfile.id === this.currentUser.id)
			return;

		try {
			// Send the message via the chat manager
			await this.chatManager.sendMessage(this.activeProfile.id, content);

			// Clear the input field
			this.profileChatInput.value = '';

			return true;
		} catch (error) {
			console.error('Failed to send profile message:', error);
			return false;
		}
	}

	/**
	 * Set up event listeners
	 */
	setupEventListeners() {
		// Close profile button
		this.closeProfileBtn.addEventListener('click', () => {
			this.profileModal.classList.remove('active');
		});

		// Close when clicking outside the profile content
		this.profileModal.addEventListener('click', (event) => {
			if (event.target === this.profileModal) {
				this.profileModal.classList.remove('active');
			}
		});

		// Tab switching
		const tabs = document.querySelectorAll('.profile-tab');
		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				// Remove active class from all tabs
				tabs.forEach(t => t.classList.remove('active'));

				// Add active class to clicked tab
				tab.classList.add('active');

				// Get the tab ID
				const tabId = tab.getAttribute('data-tab');

				// Hide all tab panes
				document.querySelectorAll('.tab-pane').forEach(pane => {
					pane.classList.remove('active');
				});

				// Show the selected tab pane
				document.getElementById(tabId).classList.add('active');
			});
		});

		// Send message from profile chat
		this.profileChatSend.addEventListener('click', () => {
			const message = this.profileChatInput.value.trim();
			if (message) {
				this.sendProfileMessage(message);
			}
		});

		// Send message on Enter key
		this.profileChatInput.addEventListener('keypress', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				const message = this.profileChatInput.value.trim();
				if (message) {
					this.sendProfileMessage(message);
				}
			}
		});

		// Listen for openProfile events
		document.addEventListener('openProfile', (event) => {
			const { userId } = event.detail;
			this.openProfile(userId);
		});

		// Listen for new message events
		document.addEventListener('newMessage', (event) => {
			const message = event.detail;

			// If this message is from/to the active profile, update the chat
			if (this.activeProfile &&
				(message.senderId === this.activeProfile.id ||
				 message.receiverId === this.activeProfile.id)) {

				// Add the message to the profile chat
				const messageElement = this.createProfileMessageElement(message);
				this.profileChatMessages.appendChild(messageElement);

				// Scroll to bottom
				this.profileChatMessages.scrollTop = this.profileChatMessages.scrollHeight;
			}
		});
	}
}
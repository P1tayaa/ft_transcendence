// ChatManager.js - Manages chat functionality
export class ChatManager {
	/**
	 * Constructor for the ChatManager class
	 * @param {ApiClient} api - The API client for server communication
	 * @param {WebSocketManager} webSocketManager - The WebSocket manager for real-time updates
	 * @param {TemplateManager} templateManager - The template manager for cloning templates
	 * @param {Object} currentUser - The current user object
	 */
	constructor(api, webSocketManager, templateManager, currentUser) {
		// Dependencies
		this.api = api;
		this.webSocketManager = webSocketManager;
		this.templateManager = templateManager;
		this.currentUser = currentUser;

		// State
		this.activeChats = {}; // Map of userId -> chat window element
		this.chatMessages = {}; // Map of userId -> messages array

		// Templates
		this.chatWindowTemplate = document.getElementById('chat-window-template');
		this.messageTemplate = document.getElementById('message-template');

		// Register for WebSocket events
		this.webSocketManager.onNewMessage = this.handleNewMessage.bind(this);
	}

	/**
	 * Initialize the ChatManager
	 * @returns {Promise} A promise that resolves when initialization is complete
	 */
	async init() {
		// No initialization needed for now
		return true;
	}

	/**
	 * Open a chat window with a user
	 * @param {Object} user - The user to chat with
	 * @returns {Promise} A promise that resolves when the chat is opened
	 */
	async openChat(user) {
		try {
			// Don't open chat with yourself
			if (user.id === this.currentUser.id)
				return;

			// Check if chat window already exists
			if (this.activeChats[user.id]) {
				// Chat window exists, just make it active
				this.activeChats[user.id].classList.add('active');

				// Focus the input field
				const inputField = this.activeChats[user.id].querySelector('.chat-input-field');
				inputField.focus();

				// Clear unread messages
				this.clearUnreadMessages(user.id);

				return;
			}

			// Create a new chat window
			const chatWindow = this.createChatWindow(user);
			document.body.appendChild(chatWindow);

			// Store the chat window
			this.activeChats[user.id] = chatWindow;

			// Load chat history
			await this.loadChatHistory(user.id);

			// Clear unread messages
			this.clearUnreadMessages(user.id);

			// Focus the input field
			const inputField = chatWindow.querySelector('.chat-input-field');
			inputField.focus();

			return true;
		} catch (error) {
			console.error('Failed to open chat:', error);
			return false;
		}
	}

	/**
	 * Create a chat window element
	 * @param {Object} user - The user to chat with
	 * @returns {HTMLElement} The chat window element
	 */
	createChatWindow(user) {
		// Clone the chat window template
		const chatWindow = this.templateManager.cloneTemplate('chat-window-template');

		// Set the chat window properties
		const chatEl = chatWindow.querySelector('.chat-window');
		chatEl.classList.add('active');
		chatEl.setAttribute('data-user-id', user.id);

		// Set the chat header
		chatEl.querySelector('.chat-friend-name').textContent = user.username;

		// Set up event listeners
		this.setupChatEventListeners(chatEl, user.id);

		return chatEl;
	}

	/**
	 * Set up event listeners for a chat window
	 * @param {HTMLElement} chatEl - The chat window element
	 * @param {string} userId - The ID of the user
	 */
	setupChatEventListeners(chatEl, userId) {
		// Close button
		const closeBtn = chatEl.querySelector('.close-chat');
		closeBtn.addEventListener('click', () => {
			this.closeChat(userId);
		});

		// Minimize button
		const minimizeBtn = chatEl.querySelector('.minimize-chat');
		minimizeBtn.addEventListener('click', () => {
			this.minimizeChat(userId);
		});

		// Send message on Enter key
		const inputField = chatEl.querySelector('.chat-input-field');
		inputField.addEventListener('keypress', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				const message = inputField.value.trim();
				if (message) {
					this.sendMessage(userId, message);
					inputField.value = '';
				}
			}
		});

		// Send message on button click
		const sendBtn = chatEl.querySelector('.chat-send-button');
		sendBtn.addEventListener('click', () => {
			const message = inputField.value.trim();
			if (message) {
				this.sendMessage(userId, message);
				inputField.value = '';
			}
		});

		// Header click to minimize/maximize
		const header = chatEl.querySelector('.chat-header');
		header.addEventListener('click', (event) => {
			// Don't trigger if clicking close or minimize buttons
			if (!event.target.closest('.chat-header-actions')) {
				chatEl.classList.toggle('minimized');
			}
		});
	}

	/**
	 * Load chat history for a user
	 * @param {string} userId - The ID of the user
	 * @returns {Promise} A promise that resolves when chat history is loaded
	 */
	async loadChatHistory(userId) {
		try {
			// Get messages from the API
			const chatData = await this.api.getChatHistory(userId);

			// Store messages
			this.chatMessages[userId] = chatData.messages || [];

			// Render messages
			this.renderChatMessages(userId);

			return true;
		} catch (error) {
			console.error('Failed to load chat history:', error);
			return false;
		}
	}

	/**
	 * Render chat messages for a user
	 * @param {string} userId - The ID of the user
	 */
	renderChatMessages(userId) {
		const chatWindow = this.activeChats[userId];
		if (!chatWindow) return;

		const messagesContainer = chatWindow.querySelector('.chat-messages');
		messagesContainer.innerHTML = '';

		const messages = this.chatMessages[userId] || [];

		if (messages.length === 0) {
			// Show empty state
			const emptyEl = document.createElement('div');
			emptyEl.className = 'empty-chat';
			emptyEl.textContent = 'No messages yet. Say hello!';
			messagesContainer.appendChild(emptyEl);
			return;
		}

		// Add each message
		messages.forEach(message => {
			const messageEl = this.createMessageElement(message);
			messagesContainer.appendChild(messageEl);
		});

		// Scroll to bottom
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
	}

	/**
	 * Create a message element
	 * @param {Object} message - The message object
	 * @returns {HTMLElement} The message element
	 */
	createMessageElement(message) {
		// Clone the message template
		const messageEl = this.templateManager.cloneTemplate('message-template');

		// Set the message content
		const msgDiv = messageEl.querySelector('.message');
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
	 * Send a message to a user
	 * @param {string} userId - The ID of the user
	 * @param {string} content - The message content
	 * @returns {Promise} A promise that resolves when the message is sent
	 */
	async sendMessage(userId, content) {
		try {
			// Send the message to the API
			const message = await this.api.sendMessage(userId, content);

			// Add the message to our local cache
			if (!this.chatMessages[userId]) {
				this.chatMessages[userId] = [];
			}

			this.chatMessages[userId].push({
				id: message.id,
				senderId: this.currentUser.id,
				receiverId: userId,
				content,
				timestamp: new Date().toISOString()
			});

			// Render the updated messages
			this.renderChatMessages(userId);

			return true;
		} catch (error) {
			console.error('Failed to send message:', error);
			return false;
		}
	}

	/**
	 * Handle a new message from WebSocket
	 * @param {Object} message - The message object
	 */
	handleNewMessage(message) {
		// Add the message to our local cache
		if (!this.chatMessages[message.senderId]) {
			this.chatMessages[message.senderId] = [];
		}

		this.chatMessages[message.senderId].push(message);

		// If chat window is open, update it
		if (this.activeChats[message.senderId]) {
			this.renderChatMessages(message.senderId);

			// Clear unread messages if chat is active
			if (this.activeChats[message.senderId].classList.contains('active')) {
				this.clearUnreadMessages(message.senderId);
			}
		}

		// Update profile chat if open
		document.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
	}

	/**
	 * Close a chat window
	 * @param {string} userId - The ID of the user
	 */
	closeChat(userId) {
		const chatWindow = this.activeChats[userId];
		if (chatWindow) {
			chatWindow.remove();
			delete this.activeChats[userId];
		}
	}

	/**
	 * Minimize a chat window
	 * @param {string} userId - The ID of the user
	 */
	minimizeChat(userId) {
		const chatWindow = this.activeChats[userId];
		if (chatWindow) {
			chatWindow.classList.add('minimized');
		}
	}

	/**
	 * Clear unread messages for a user
	 * @param {string} userId - The ID of the user
	 */
	clearUnreadMessages(userId) {
		// Dispatch event to update the friends list
		document.dispatchEvent(new CustomEvent('clearUnreadMessages', {
			detail: { userId }
		}));
	}
}
import api from '../../../api.js';
import user from '../../../User.js';
import Socket from '../../../socket.js';

export default class Chat {
	constructor(userId, containerId) {
		this.userId = userId;

		this.containerId = containerId;
		this.containerElement = null;

		this.chatId = null;
		this.socket = null;
	}

	async init() {
		try {
			// Get chat container element
			this.containerElement = document.getElementById(this.containerId);
			if (!this.containerElement) {
				console.error('Chat container not found');
				return;
			}

			// Get chat history which should include the chat ID
			const chat = await api.getChatHistory(this.userId);
			console.log('chat:', chat);
			this.chatId = chat.chat_id;
			
			// Render initial chat
			this.renderChat(chat.messages);
			
			// Setup event listeners
			this.setupEventListeners();
			
			// Connect to socket using the chat ID
			this.connectSocket();
		} catch (error) {
			console.error('Failed to initialize chat:', error);
		}
	}

	renderChat(messages) {
		if (!this.containerElement)
			return;

		this.containerElement.innerHTML = `
			<div class="chat-container">
				<div class="chat-messages" id="chat-messages">
					${this.renderChatHistory(messages)}
				</div>
				<div class="chat-input-container">
					<input type="text" id="chat-message-input" placeholder="Type a message...">
					<button id="send-message-btn"><i class="fas fa-paper-plane"></i></button>
				</div>
			</div>
		`;
	}

	renderChatHistory(chatHistory) {
		if (!chatHistory || chatHistory.length === 0) {
			return '<div class="empty-chat">No chat history available</div>';
		}

		return chatHistory.map(message => `
			<div class="chat-message ${message.sender === user.username ? 'sent' : 'received'}">
				<div class="message-content">
					<div class="message-text">${message.content}</div>
					<div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
				</div>
			</div>
		`).join('');
	}

	setupEventListeners() {
		// Send message button
		const sendMsgBtn = document.getElementById('send-message-btn');
		const msgInput = document.getElementById('chat-message-input');
		if (sendMsgBtn && msgInput) {
			sendMsgBtn.addEventListener('click', () => this.sendMessage(msgInput.value));
			msgInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') {
					this.sendMessage(msgInput.value);
				}
			});
		}
	}

	async sendMessage(message) {
		if (!message || message.trim() === '') return;

		const msgInput = document.getElementById('chat-message-input');
		try {
			const response = await api.sendMessage(this.userId, message);
			console.log('Message sent:', response);
			msgInput.value = '';
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	addMessageToChat(message) {
		const chatMessages = document.getElementById('chat-messages');
		if (!chatMessages) return;

		const isCurrentUser = message.sender === user.username;
		const messageEl = document.createElement('div');
		messageEl.className = `chat-message ${isCurrentUser ? 'sent' : 'received'}`;

		messageEl.innerHTML = `
			<div class="message-content">
				<div class="message-text">${message.content}</div>
				<div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
			</div>
		`;

		chatMessages.appendChild(messageEl);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	connectSocket() {
		if (!this.chatId) {
			console.error('Cannot connect to socket: Chat ID not available');
			return;
		}

		this.socket = new Socket(`chat/${this.chatId}`);
		this.socket.handleMessage = (data) => {
			console.log('Received chat message:', data);
			this.addMessageToChat(data.message);
		};
		this.socket.connect();
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
		}
	}
}

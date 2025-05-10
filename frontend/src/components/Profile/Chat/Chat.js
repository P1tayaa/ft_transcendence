import api from '../../../api.js';
import user from '../../../User.js';
import Socket from '../../../socket.js';
import router from '../../../router.js';

import './Chat.css';

export default class Chat {
	constructor(userId, containerId, profile) {
		this.profile = profile;

		this.userId = userId;

		this.containerId = containerId;
		this.containerElement = document.getElementById(this.containerId);
		if (!this.containerElement) {
			console.error('Chat container not found');
			return;
		}

		this.chatId = null;
		this.socket = null;
	}

	async init() {
		try {
			// Get chat history which should include the chat ID
			const chat = await api.getChatHistory(this.userId);
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

		const isEmpty = messages && messages.length === 0;
		const isInvitable = this.isInvitable();

		this.containerElement.innerHTML = `
			<div class="chat-container">
				<div class="chat-messages" id="chat-messages">
					${isEmpty ? '' : '<div class="empty-chat">No earlier chat history available...</div>'}
				</div>
				<div class="chat-input-container">
					<input type="text" id="chat-message-input" placeholder="Type a message...">
					<button id="send-message-btn">
						<i class="fas fa-paper-plane"></i>
					</button>
					<button id="send-invite-btn" ${isInvitable ? '' : 'disabled='} title="${isInvitable ? 'Invite to game' : 'Cannot invite to game'}">
							<i class="fas fa-gamepad"></i>
					</button>
				</div>
			</div>
		`;

		messages.forEach(message => {
			if (message.type === 'invite') {
				this.addInvite(message);
			} else {
				this.addMessage(message);
			}
		});
	}

	isInvitable() {
		const currentPath = window.location.pathname;
		const isGamePage = currentPath.startsWith('/game/') && !currentPath.includes('/local');
		const isTournamentPage = currentPath.startsWith('/tournament/');

		return (isGamePage || isTournamentPage);
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

		// Setup invite button
		const inviteBtn = document.getElementById('send-invite-btn');
		if (inviteBtn) {
			inviteBtn.addEventListener('click', () => this.sendInvite());
		}
	}

	async sendInvite() {
		try {
			const currentPath = window.location.pathname;
			await api.sendMessage(this.userId, currentPath, 'invite');
		} catch (error) {
			console.error('Failed to send invite:', error);
		}
	}

	async sendMessage(message) {
		if (!message || message.trim() === '') return;

		const msgInput = document.getElementById('chat-message-input');
		try {
			await api.sendMessage(this.userId, message);
			msgInput.value = '';
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	addMessage(message) {
		const chatMessages = document.getElementById('chat-messages');
		if (!chatMessages)
			return;

		const isCurrentUser = message.sender === user.username;
		const messageEl = document.createElement('div');

		messageEl.innerHTML = `
			<div class="chat-message ${isCurrentUser ? 'sent' : 'received'}">
				<div class="message-content">
					<div class="message-text">${message.content}</div>
					<div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
				</div>
			</div>
		`;

		chatMessages.appendChild(messageEl.firstElementChild);

		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	addInvite(message) {
		const chatMessages = document.getElementById('chat-messages');
		if (!chatMessages)
			return;

		const isCurrentUser = message.sender === user.username;
		const messageEl = document.createElement('div');

		messageEl.innerHTML = `
			<div class="chat-message invite ${isCurrentUser ? 'sent' : 'received'}">
				<div class="message-content">
					<i class="fas fa-gamepad invite-icon"></i>
					${isCurrentUser ? 'You sent a game invitation' : 'Invited you to a game'}
					<div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
				</div>
			</div>
		`;

		const element = messageEl.firstElementChild;

		chatMessages.appendChild(element);

		chatMessages.scrollTop = chatMessages.scrollHeight;

		// Add click event for invite button if it's not from the current user
		if (!isCurrentUser) {
			element.addEventListener('click', () => {
				this.disconnect();
				this.profile.close();
				router.navigate(message.content);
			});
		}
	}

	connectSocket() {
		if (!this.chatId) {
			console.error('Cannot connect to socket: Chat ID not available');
			return;
		}

		this.socket = new Socket(`chat/${this.chatId}`);
		this.socket.handleMessage = (data) => {
			if (data.message.type === 'invite') {
				this.addInvite(data.message);
			} else {
				this.addMessage(data.message);
			}
		};
		this.socket.connect();
	}

	block() {
		// If blocked, show blocked message and disconnect
		if (this.containerElement) {
			this.containerElement.innerHTML = `
				<div class="blocked-message">
					You have blocked this user. Unblock to start chatting.
				</div>
			`;
		}

		this.disconnect();
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}
	}
}

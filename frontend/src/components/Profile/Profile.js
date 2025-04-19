import './Profile.css';
import api from '../../api.js';
import user from '../../User.js';

export default class Profile {
	constructor(userId) {
		this.userId = userId;
		this.profileData = null;
		this.element = null;
		this.isCurrentUserProfile = false;
		this.isFriend = false;
	}

	async init() {
		try {
			// Fetch profile data
			const profile = await api.getUser(this.userId);
			if (!profile) {
				throw new Error('User not found');
			}
			this.profileData = profile.user;

			this.isCurrentUserProfile = this.userId === user.id;
			this.isFriend = this.profileData.is_following || false;

			// Create and render the profile page
			this.element = document.createElement('div');
			this.element.className = 'profile-page';
			document.body.appendChild(this.element);

			await this.render();
			this.setupEventListeners();
		} catch (error) {
			console.error('Failed to initialize profile:', error);
		}
	}

	async render() {
		if (!this.profileData) return;

		const wins = Math.floor(Math.random() * 50);
		const totalGames = Math.floor(Math.random() * 70);

		const matchHistory = await api.getMatchHistory(this.userId);
		const friendshipButton = this.isCurrentUserProfile ? '' :
			this.isFriend ?
				'<button id="remove-friend-btn" class="profile-btn danger">Remove Friend</button>' :
				'<button id="add-friend-btn" class="profile-btn primary">Add Friend</button>';

		console.log('render match history:', matchHistory);
		console.log('rendering profile:', this.profileData);

		this.element.innerHTML = `
			<div class="profile-header">
				<div class="back-button" id="profile-back-btn">
					<i class="fas fa-arrow-left"></i>
				</div>
				<div class="profile-user-info">
					<div class="profile-avatar-container">
						<img src="${this.profileData.avatar || 'default-avatar.png'}" alt="${this.profileData.username}'s Avatar" class="profile-avatar">
						<span class="status-indicator ${this.profileData.status === 'online' ? 'online' : ''}"></span>
					</div>
					<div class="profile-details">
						<h2>${this.profileData.username}</h2>
						<div class="profile-stats">
							<span><i class="fas fa-trophy"></i> ${wins || 0} wins</span>
							<span><i class="fas fa-gamepad"></i> ${totalGames || 0} games</span>
						</div>
					</div>
					<div class="profile-actions">
						${friendshipButton}
					</div>
				</div>
			</div>

			<div class="profile-content">
				<div class="profile-section match-history-section">
					<h3>Match History</h3>
					<div class="match-history-list">
						${this.renderMatchHistory(matchHistory)}
					</div>
				</div>

				${!this.isCurrentUserProfile ? `
				<div class="profile-section chat-section">
					<h3>Chat</h3>
					<div class="chat-container">
						<div class="chat-messages" id="chat-messages"></div>
						<div class="chat-input-container">
							<input type="text" id="chat-message-input" placeholder="Type a message...">
							<button id="send-message-btn"><i class="fas fa-paper-plane"></i></button>
						</div>
					</div>
				</div>
				` : ''}
			</div>
		`;
	}

	renderMatchHistory(matches) {
		if (!matches || matches.length === 0) {
			return '<div class="empty-matches">No match history available</div>';
		}

		return matches.map(match => `
			<div class="match-item ${match.winner === this.userId ? 'win' : 'loss'}">
				<div class="match-result">${match.winner === this.userId ? 'Win' : 'Loss'}</div>
				<div class="match-details">
					<div class="match-players">
						<span class="player">${match.player1.username}</span>
						<span class="vs">vs</span>
						<span class="player">${match.player2.username}</span>
					</div>
					<div class="match-score">${match.score1} - ${match.score2}</div>
				</div>
				<div class="match-time">${new Date(match.timestamp).toLocaleDateString()}</div>
			</div>
		`).join('');
	}

	setupEventListeners() {
		// Back button
		const backBtn = document.getElementById('profile-back-btn');
		if (backBtn) {
			backBtn.addEventListener('click', () => {
				this.close();
			});
		}

		// Add friend button
		const addFriendBtn = document.getElementById('add-friend-btn');
		if (addFriendBtn) {
			addFriendBtn.addEventListener('click', async () => {
				try {
					await api.addFriend(this.userId);
					this.isFriend = true;
					this.updateFriendshipButton();
				} catch (error) {
					console.error('Failed to add friend:', error);
				}
			});
		}

		// Remove friend button
		const removeFriendBtn = document.getElementById('remove-friend-btn');
		if (removeFriendBtn) {
			removeFriendBtn.addEventListener('click', async () => {
				try {
					await api.removeFriend(this.userId);
					this.isFriend = false;
					this.updateFriendshipButton();
				} catch (error) {
					console.error('Failed to remove friend:', error);
				}
			});
		}

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

	updateFriendshipButton() {
		const profileActions = this.element.querySelector('.profile-actions');
		if (!profileActions) return;
		
		if (this.isCurrentUserProfile) {
			profileActions.innerHTML = '';
			return;
		}

		if (this.isFriend) {
			profileActions.innerHTML = '<button id="remove-friend-btn" class="profile-btn danger">Remove Friend</button>';
			this.attachFriendButtonEvent('remove-friend-btn');
		} else {
			profileActions.innerHTML = '<button id="add-friend-btn" class="profile-btn primary">Add Friend</button>';
			this.attachFriendButtonEvent('add-friend-btn');
		}
	}

	attachFriendButtonEvent(buttonId) {
		const isAddButton = buttonId === 'add-friend-btn';
		const button = document.getElementById(buttonId);
		
		if (button) {
			button.addEventListener('click', async () => {
				try {
					if (isAddButton) {
						await api.addFriend(this.userId);
						this.isFriend = true;
					} else {
						await api.removeFriend(this.userId);
						this.isFriend = false;
					}
					this.updateFriendshipButton();
				} catch (error) {
					console.error(`Failed to ${isAddButton ? 'add' : 'remove'} friend:`, error);
				}
			});
		}
	}

	async sendMessage(message) {
		if (!message || message.trim() === '') return;

		const msgInput = document.getElementById('chat-message-input');
		try {
			await api.sendMessage(this.userId, message);
			msgInput.value = '';

			// Add message to chat
			this.addMessageToChat({
				sender: user.id,
				text: message,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Failed to send message:', error);
		}
	}

	addMessageToChat(message) {
		const chatMessages = document.getElementById('chat-messages');
		if (!chatMessages) return;

		const isCurrentUser = message.sender === user.id;
		const messageEl = document.createElement('div');
		messageEl.className = `chat-message ${isCurrentUser ? 'sent' : 'received'}`;

		messageEl.innerHTML = `
			<div class="message-content">
				<div class="message-text">${message.text}</div>
				<div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
			</div>
		`;

		chatMessages.appendChild(messageEl);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	close() {
		if (this.element) {
			this.element.remove();
		}
	}
}

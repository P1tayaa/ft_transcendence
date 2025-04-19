import './Profile.css';
import api from '../../api.js';
import user from '../../User.js';
import Chat from './Chat/Chat.js';

export default class Profile {
	constructor(userId) {
		this.userId = userId;
		this.profileData = null;
		this.element = null;
		this.isCurrentUserProfile = false;
		this.isFriend = false;
		this.chat = null;
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
			
			// Initialize chat if not viewing own profile
			if (!this.isCurrentUserProfile) {
				this.initChat();
			}
		} catch (error) {
			console.error('Failed to initialize profile:', error);
		}
	}

	async render() {
		if (!this.profileData)
			return;

		const wins = Math.floor(Math.random() * 50);
		const totalGames = Math.floor(Math.random() * 70);

		const matchHistory = await api.getMatchHistory(this.userId);
		
		console.log('match history:', matchHistory);

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
						<div id="chat-container"></div>
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

		// Add/remove friend buttons
		this.attachFriendButtonEvent('add-friend-btn');
		this.attachFriendButtonEvent('remove-friend-btn');
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

	initChat() {
		if (this.isCurrentUserProfile) return;
		
		this.chat = new Chat(this.userId, 'chat-container');
		this.chat.init();
	}

	close() {
		if (this.chat) {
			this.chat.disconnect();
		}
		
		if (this.element) {
			this.element.remove();
		}
	}
}

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
		this.isBlocked = false;
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
			this.isBlocked = this.profileData.is_blocking || false;

			// Create and render the profile page
			this.element = document.createElement('div');
			this.element.className = 'profile-page';
			document.body.appendChild(this.element);

			await this.render();
			this.setupEventListeners();
			
			// Initialize chat if not viewing own profile and not blocked
			if (!this.isCurrentUserProfile) {
				this.chat = new Chat(this.userId, 'chat-container');

				if (this.isBlocked) {
					this.chat.block();
				} else {
					await this.chat.init();
				}
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

		let actionButtons = '';
		
		if (!this.isCurrentUserProfile) {
			const friendButton = this.isFriend 
				? '<button id="remove-friend-btn" class="profile-btn remove-btn">Remove Friend</button>'
				: '<button id="add-friend-btn" class="profile-btn action-btn">Add Friend</button>';
				
			const blockButton = this.isBlocked
				? '<button id="unblock-user-btn" class="profile-btn unblock-btn">Unblock User</button>'
				: '<button id="block-user-btn" class="profile-btn block-btn">Block User</button>';
				
			actionButtons = `${friendButton}${blockButton}`;
		}

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
						${actionButtons}
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

		 // Attach action button events
		this.attachActionButtonEvent('add-friend-btn', this.handleAddFriend.bind(this));
		this.attachActionButtonEvent('remove-friend-btn', this.handleRemoveFriend.bind(this));
		this.attachActionButtonEvent('block-user-btn', this.handleBlockUser.bind(this));
		this.attachActionButtonEvent('unblock-user-btn', this.handleUnblockUser.bind(this));
	}

	updateActionButtons() {
		if (this.isCurrentUserProfile || !this.element)
			return;
		
		const profileActions = this.element.querySelector('.profile-actions');
		if (!profileActions) return;
		
		// Friend button
		const friendButton = this.isFriend 
			? '<button id="remove-friend-btn" class="profile-btn remove-btn">Remove Friend</button>'
			: '<button id="add-friend-btn" class="profile-btn action-btn">Add Friend</button>';
			
		// Block button
		const blockButton = this.isBlocked
			? '<button id="unblock-user-btn" class="profile-btn unblock-btn">Unblock User</button>'
			: '<button id="block-user-btn" class="profile-btn block-btn">Block User</button>';
		
		profileActions.innerHTML = `${friendButton}${blockButton}`;
		
		// Re-attach all button events
		this.attachActionButtonEvent('add-friend-btn', this.handleAddFriend.bind(this));
		this.attachActionButtonEvent('remove-friend-btn', this.handleRemoveFriend.bind(this));
		this.attachActionButtonEvent('block-user-btn', this.handleBlockUser.bind(this));
		this.attachActionButtonEvent('unblock-user-btn', this.handleUnblockUser.bind(this));
	}
	
	attachActionButtonEvent(buttonId, handler) {
		const button = document.getElementById(buttonId);
		if (button) {
			button.addEventListener('click', handler);
		}
	}
	
	async handleAddFriend() {
		try {
			await api.addFriend(this.userId);
			this.isFriend = true;
			this.updateActionButtons();
		} catch (error) {
			console.error('Failed to add friend:', error);
		}
	}
	
	async handleRemoveFriend() {
		try {
			await api.removeFriend(this.userId);
			this.isFriend = false;
			this.updateActionButtons();
		} catch (error) {
			console.error('Failed to remove friend:', error);
		}
	}
	
	async handleBlockUser() {
		try {
			await api.block(this.userId);
			this.isBlocked = true;
			this.updateActionButtons();

			this.chat.block();
		} catch (error) {
			console.error('Failed to block user:', error);
		}
	}
	
	async handleUnblockUser() {
		try {
			await api.unblock(this.userId);
			this.isBlocked = false;
			this.updateActionButtons();

			await this.chat.init();
		} catch (error) {
			console.error('Failed to unblock user:', error);
		}
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

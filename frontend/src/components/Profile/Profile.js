import './Profile.css';

import api from '../../api.js';
import user from '../../User.js';
import Chat from './Chat/Chat.js';
import router from '../../router.js';
import Edit from './Edit/Edit.js';

export default class Profile {
	constructor(userId) {
		this.userId = userId;
		this.profileData = null;
		this.element = null;
		this.isCurrentUserProfile = false;
		this.isFriend = false;
		this.isBlocked = false;
		this.chat = null;
		
		// Add specific event listeners for this user's status
		this.onlineListener = this.handleOnline.bind(this);
		this.offlineListener = this.handleOffline.bind(this);
		
		window.addEventListener(`user:${this.userId}:online`, this.onlineListener);
		window.addEventListener(`user:${this.userId}:offline`, this.offlineListener);
	}

	handleOnline() {
		if (this.profileData && this.element) {
			this.profileData.online = true;
			
			// Update only the status indicator
			const statusIndicator = this.element.querySelector('.status-indicator');
			if (statusIndicator) {
				statusIndicator.className = 'status-indicator online';
			}
		}
	}
	
	handleOffline() {
		if (this.profileData && this.element) {
			this.profileData.online = false;
			
			// Update only the status indicator
			const statusIndicator = this.element.querySelector('.status-indicator');
			if (statusIndicator) {
				statusIndicator.className = 'status-indicator offline';
			}
		}
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

			// Create overlay element
			this.element = document.createElement('div');
			this.element.className = 'profile-overlay';
			document.body.appendChild(this.element);

			// Setup the profile page
			await this.render();
			this.setupEventListeners();
			
			// Initialize chat if not viewing own profile and not blocked
			if (!this.isCurrentUserProfile) {
				this.chat = new Chat(this.userId, 'chat-container', this);

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

		const matchHistory = await api.getMatchHistory(this.userId);

		console.log('Match history:', matchHistory);

		const wins = matchHistory.wins || 0;
		const totalGames = matchHistory.total || 0;

		let actionButtons = '';
		
		if (this.isCurrentUserProfile) {
			// Add edit profile and logout buttons for own profile
			actionButtons = `
				<button id="edit-profile-btn" class="profile-btn action-btn">Edit Profile</button>
				<button id="logout-btn" class="profile-btn block-btn">Logout</button>
			`;
		} else {
			const friendButton = this.isFriend 
				? '<button id="remove-friend-btn" class="profile-btn remove-btn">Remove Friend</button>'
				: '<button id="add-friend-btn" class="profile-btn action-btn">Add Friend</button>';
				
			const blockButton = this.isBlocked
				? '<button id="unblock-user-btn" class="profile-btn unblock-btn">Unblock User</button>'
				: '<button id="block-user-btn" class="profile-btn block-btn">Block User</button>';
				
			actionButtons = `${friendButton}${blockButton}`;
		}

		console.log('Rendering profile:', this.profileData);

		this.element.innerHTML = `
		<div class="profile-page">
			<div class="profile-header">
				<div class="back-button" id="profile-back-btn">
					<i class="fas fa-arrow-left"></i>
				</div>
				<div class="profile-user-info">
					<div class="profile-avatar-container">
						<img src="${this.profileData.avatar || '/default-avatar.png'}" alt="${this.profileData.username}'s Avatar" class="profile-avatar">
						<span class="status-indicator ${this.profileData.online ? 'online' : 'offline'}"></span>
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
				${!this.isCurrentUserProfile ? `
				<div class="profile-section chat-section">
					<h3>Chat</h3>
					<div id="chat-container"></div>
				</div>
				` : ''}

				<div class="profile-section match-history-section">
					<h3>Match History</h3>
					<div class="match-history-list">
						${this.renderMatchHistory(matchHistory.results)}
					</div>
				</div>
			</div>
		</div>
		`;
	}

	renderMatchHistory(matches) {
		if (!matches || matches.length === 0) {
			return '<div class="empty-matches">No match history available</div>';
		}

		return matches.map(match => {
			// Find current user in the players array
			const currentUserPlayer = match.players.find(player => player.user_id === this.userId);
			const opponent = match.players.find(player => player.user_id !== this.userId);
			
			// Determine if current user won
			const isWin = currentUserPlayer && currentUserPlayer.is_winner;
			
			// Format the date
			const matchDate = new Date(match.date).toLocaleDateString();
			
			return `
				<div class="match-item ${isWin ? 'win' : 'loss'}">
					<div class="match-result">${isWin ? 'Win' : 'Loss'}</div>
					<div class="match-details">
						<div class="match-players">
							<span class="player">${currentUserPlayer ? currentUserPlayer.username : 'Unknown'}</span>
							<span class="vs">vs</span>
							<span class="player">${opponent ? opponent.username : 'Unknown'}</span>
						</div>
						<div class="match-time">${matchDate}</div>
						</div>
					<h3 class="match-score">${currentUserPlayer ? currentUserPlayer.score : 0} - ${opponent ? opponent.score : 0}</h3>
				</div>
			`;
		}).join('');
	}

	setupEventListeners() {
		// Back button
		const backBtn = document.getElementById('profile-back-btn');
		if (backBtn) {
			backBtn.addEventListener('click', () => {
				this.close();
			});
		 }

		// Close when clicking on overlay, but not on the profile page
		if (this.element) {
			this.element.addEventListener('click', (e) => {
				if (e.target === this.element) {
					this.close();
				}
			});
		}

		// Attach action button events
		this.attachActionButtonEvent('add-friend-btn', this.handleAddFriend.bind(this));
		this.attachActionButtonEvent('remove-friend-btn', this.handleRemoveFriend.bind(this));
		this.attachActionButtonEvent('block-user-btn', this.handleBlockUser.bind(this));
		this.attachActionButtonEvent('unblock-user-btn', this.handleUnblockUser.bind(this));
		
		// Attach own profile buttons events
		this.attachActionButtonEvent('edit-profile-btn', this.handleEditProfile.bind(this));
		this.attachActionButtonEvent('logout-btn', this.handleLogout.bind(this));
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
			// Dispatch custom event to update friend list
			window.dispatchEvent(new CustomEvent('friends:update'));
		} catch (error) {
			console.error('Failed to add friend:', error);
		}
	}
	
	async handleRemoveFriend() {
		try {
			await api.removeFriend(this.userId);
			this.isFriend = false;
			this.updateActionButtons();
			// Dispatch custom event to update friend list
			window.dispatchEvent(new CustomEvent('friends:update'));
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

	async handleEditProfile() {
		const modal = new Edit(this.profileData, async () => {
			// Callback function that runs after successful profile update

			// Refresh profile data
			const profile = await api.getUser(this.userId);
			this.profileData = profile.user;
			
			// Update UI
			await this.render();
			this.setupEventListeners();
		});
		
		modal.show();
	}
	
	async handleLogout() {
		try {
			this.close();
			user.logout();
			router.navigate('/login');
		} catch (error) {
			console.error('Failed to logout:', error);
		}
	}

	close() {
		if (this.chat) {
			this.chat.disconnect();
		}

		if (this.element) {
			this.element.remove();
		 }
		
		// Clean up event listener
		window.removeEventListener(`user:${this.userId}:online`, this.onlineListener);
		window.removeEventListener(`user:${this.userId}:offline`, this.offlineListener);
	}
}

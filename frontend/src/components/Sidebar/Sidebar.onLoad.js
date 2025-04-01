// SocialManager.js - Manages the social sidebar and user interactions
import { api } from '../ApiManager.js';

const onLoad = async () => {
	const currentUser = await api.getCurrentUser();

	if (!currentUser) {
		window.location.href = '/login';
		return;
	}

	const socialManager = new SocialManager(currentUser);
	await socialManager.init();
};

export default onLoad;

export class SocialManager {
    /**
     * Constructor for the SocialManager class
     * @param {Object} currentUser - The current user object
     */
    constructor(currentUser) {
        // Dependencies
        this.currentUser = currentUser;

        // State
        this.friends = [];
        this.searchResults = [];
        this.activeProfile = null;

        // DOM Elements - Social Panel
        this.socialPanel = document.getElementById('social-panel');
        this.currentUserAvatar = document.getElementById('current-user-avatar');
        this.currentUserName = document.getElementById('current-user-name');
        this.searchInput = document.getElementById('friend-search-input');
        this.friendsList = document.getElementById('friends-list');

        // DOM Elements - Profile Modal
        this.profileModal = document.getElementById('profile-modal');
        this.profileAvatar = document.getElementById('profile-avatar');
        this.profileUsername = document.getElementById('profile-username');
        this.profileStatus = document.getElementById('profile-status');
        this.profileActions = document.getElementById('profile-actions');
        this.closeProfileBtn = document.getElementById('close-profile');
        this.matchHistoryContainer = document.getElementById('match-history-container');
        this.profileChatMessages = document.getElementById('profile-chat-messages');
        this.profileChatInput = document.getElementById('profile-chat-input');
        this.profileChatSend = document.getElementById('profile-chat-send');

        // DOM Elements - Edit Profile Modal
        this.editProfileModal = document.getElementById('edit-profile-modal');
        this.editUsernameInput = document.getElementById('edit-username');
        this.editPasswordInput = document.getElementById('edit-password');
        this.editAvatarInput = document.getElementById('edit-avatar-input');
        this.editAvatarPreview = document.getElementById('edit-avatar-preview');
        this.saveProfileBtn = document.getElementById('save-profile');
        this.closeEditProfileBtn = document.getElementById('close-edit-profile');
        
        // Templates
        this.friendTemplate = document.getElementById('friend-template');
        this.messageTemplate = document.getElementById('message-template');
        this.matchItemTemplate = document.getElementById('match-item-template');
        this.actionButtonTemplate = document.getElementById('action-button-template');
        this.emptyStateTemplate = document.getElementById('empty-state-template');
    }

    /**
     * Initialize the SocialManager
     */
    async init() {
        // Set up current user info
        this.updateCurrentUserInfo();
        
        // Load friends list
        await this.loadFriends();
        
        // Set up event listeners
        this.setupEventListeners();
        
        return true;
    }

    /**
     * Update the current user information in the UI
     */
    updateCurrentUserInfo() {
        if (this.currentUser) {
            this.currentUserAvatar.src = this.currentUser.avatar;
            this.currentUserAvatar.alt = `${this.currentUser.username}'s avatar`;
            this.currentUserName.textContent = this.currentUser.username;
        }
    }

    /**
     * Load the friends list from the API
     */
    async loadFriends() {
        try {
            this.friends = await api.getFriends();
            this.renderFriendsList();
            return true;
        } catch (error) {
            console.error('Failed to load friends:', error);
            return false;
        }
    }

    /**
     * Render the friends list in the UI
     */
    renderFriendsList() {
        // Clear the current list
        this.friendsList.innerHTML = '';
        
        // If no friends, show empty state
        if (!this.friends || this.friends.length === 0) {
            const emptyEl = this.createEmptyState('user-friends', 'No friends yet');
            this.friendsList.appendChild(emptyEl);
            return;
        }
        
        // Add each friend
        this.friends.forEach(friend => {
            const friendEl = this.createFriendElement(friend);
            this.friendsList.appendChild(friendEl);
        });
    }

    /**
     * Create a friend element using the template
     * @param {Object} friend - The friend object
     * @returns {HTMLElement} The friend element
     */
    createFriendElement(friend) {
        const template = this.friendTemplate.content.cloneNode(true);
        const friendItem = template.querySelector('.friend-item');
        
        // Set data attribute
        friendItem.dataset.userId = friend.id;
        
        // Set avatar
        const avatar = template.querySelector('[data-field="avatar"]');
        avatar.src = friend.avatar;
        avatar.alt = `${friend.username}'s avatar`;
        
        // Set status
        const status = template.querySelector('[data-field="status"]');
        if (friend.online) {
            status.classList.add('online');
        }
        
        // Set username
        template.querySelector('[data-field="username"]').textContent = friend.username;
        
        // Add event listener to open profile
        friendItem.addEventListener('click', () => {
            this.openProfile(friend);
        });
        
        return friendItem;
    }

    /**
     * Create an empty state element
     * @param {string} icon - The FontAwesome icon class
     * @param {string} message - The message to display
     * @returns {HTMLElement} The empty state element
     */
    createEmptyState(icon, message) {
        const template = this.emptyStateTemplate.content.cloneNode(true);
        
        template.querySelector('[data-field="icon"]').classList.add(`fa-${icon}`);
        template.querySelector('[data-field="message"]').textContent = message;
        
        return template.querySelector('.empty-state');
    }

    /**
     * Open user profile modal
     * @param {Object} user - The user object
     */
    async openProfile(user) {
        try {
            this.activeProfile = user;

            // Update profile UI
            this.updateProfileUI(user);

            // Load match history
            await this.loadMatchHistory(user.id);

            // If we're viewing someone else's profile, load chat history
            if (user.id !== this.currentUser.id) {
                await this.loadProfileChat(user.id);
                
                // Show chat tab
                document.querySelector('.profile-tab[data-tab="chat"]').style.display = 'block';
            } else {
                // Hide chat tab for own profile
                document.querySelector('.profile-tab[data-tab="chat"]').style.display = 'none';
                
                // Ensure history tab is active
                document.querySelector('.profile-tab[data-tab="match-history"]').click();
            }

            // Show profile modal
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
            const editBtn = this.createActionButton('Edit Profile');
            
            editBtn.addEventListener('click', () => {
                this.openEditProfile();
            });

            this.profileActions.appendChild(editBtn);
            return;
        }

        // For other users, show friend/message buttons

        // Add/remove friend button
        const friendBtn = this.createActionButton(
            user.isFriend ? 'Unfollow' : 'Follow', 
            user.isFriend ? 'secondary' : ''
        );

        friendBtn.addEventListener('click', async () => {
            if (user.isFriend) {
                await api.removeFriend(user.id);
                friendBtn.textContent = 'Follow';
                friendBtn.classList.remove('secondary');
                user.isFriend = false;
                
                // Update friends list
                await this.loadFriends();
            } else {
                await api.addFriend(user.id);
                friendBtn.textContent = 'Unfollow';
                friendBtn.classList.add('secondary');
                user.isFriend = true;
                
                // Update friends list
                await this.loadFriends();
            }
        });

        // Message button
        const messageBtn = this.createActionButton('Message');
        
        messageBtn.addEventListener('click', () => {
            // Switch to chat tab
            document.querySelector('.profile-tab[data-tab="chat"]').click();
            
            // Focus the chat input
            this.profileChatInput.focus();
        });

        // Add buttons to actions container
        this.profileActions.appendChild(friendBtn);
        this.profileActions.appendChild(messageBtn);
    }

    /**
     * Create an action button using the template
     * @param {string} text - The button text
     * @param {string} type - Optional CSS class to add
     * @returns {HTMLElement} The button element
     */
    createActionButton(text, type = '') {
        const template = this.actionButtonTemplate.content.cloneNode(true);
        const button = template.querySelector('.profile-action-btn');
        
        button.textContent = text;
        
        if (type) {
            button.classList.add(type);
        }
        
        return button;
    }

    /**
     * Load match history for a user
     * @param {string} userId - The ID of the user
     */
    async loadMatchHistory(userId) {
        try {
            // Get match history from the API
            const matches = await api.getMatchHistory(userId);
            
            // Render match history
            this.renderMatchHistory(matches);
            
            return true;
        } catch (error) {
            console.error('Failed to load match history:', error);
            return false;
        }
    }

    /**
     * Render match history
     * @param {Array} matches - The match history array
     */
    renderMatchHistory(matches) {
        // Clear the container
        this.matchHistoryContainer.innerHTML = '';
        
        // If no matches, show empty state
        if (!matches || matches.length === 0) {
            const emptyMatches = this.createEmptyState('trophy', 'No matches found');
            emptyMatches.classList.add('empty-matches');
            this.matchHistoryContainer.appendChild(emptyMatches);
            return;
        }
        
        // Create match elements
        matches.forEach(match => {
            const matchEl = this.createMatchElement(match);
            this.matchHistoryContainer.appendChild(matchEl);
        });
    }

    /**
     * Create a match history element using the template
     * @param {Object} match - The match object
     * @returns {HTMLElement} The match element
     */
    createMatchElement(match) {
        const template = this.matchItemTemplate.content.cloneNode(true);
        
        // Match date
        template.querySelector('[data-field="date"]').textContent = new Date(match.date).toLocaleDateString();
        
        // Match result
        const resultEl = template.querySelector('[data-field="result"]');
        resultEl.textContent = match.is_win ? 'Win' : 'Loss';
        resultEl.classList.add(match.is_win ? 'match-win' : 'match-loss');
        
        // Match score
        template.querySelector('[data-field="score"]').textContent = match.score;
        
        return template.querySelector('.match-item');
    }

    /**
     * Load chat for a user in the profile modal
     * @param {string} userId - The ID of the user
     */
    async loadProfileChat(userId) {
        try {
			try {
				// Get chat history from the API
				const chatData = await api.getChatHistory(userId);
			} catch (error) {
				console.error('Failed to load profile chat:', error);
			}

            const chatData = await api.getChatHistory(userId);
            
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
        
        // If no messages, show empty state
        if (!messages || messages.length === 0) {
            const emptyChat = this.createEmptyState('comments', 'No messages yet');
            emptyChat.classList.add('empty-chat');
            this.profileChatMessages.appendChild(emptyChat);
            return;
        }
        
        // Add each message
        messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            this.profileChatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom
        this.profileChatMessages.scrollTop = this.profileChatMessages.scrollHeight;
    }

    /**
     * Create a chat message element using the template
     * @param {Object} message - The message object
     * @returns {HTMLElement} The message element
     */
    createMessageElement(message) {
        const template = this.messageTemplate.content.cloneNode(true);
        const messageDiv = template.querySelector('.message');
        
        messageDiv.textContent = message.content;
        
        // Set message style based on sender
        if (message.senderId === this.currentUser.id) {
            messageDiv.classList.add('sent');
        } else {
            messageDiv.classList.add('received');
        }
        
        return messageDiv;
    }

    /**
     * Send a message from the profile chat
     * @param {string} content - The message content
     */
    async sendProfileMessage(content) {
        if (!this.activeProfile || this.activeProfile.id === this.currentUser.id) {
            return false;
        }
        
        try {
            // Send the message via the API
            const message = await api.sendMessage(this.activeProfile.id, content);
            
            // Create a new message object
            const newMessage = {
                id: message.id,
                senderId: this.currentUser.id,
                receiverId: this.activeProfile.id,
                content,
                timestamp: new Date().toISOString()
            };
            
            // Create message element
            const messageEl = this.createMessageElement(newMessage);
            this.profileChatMessages.appendChild(messageEl);
            
            // Scroll to bottom
            this.profileChatMessages.scrollTop = this.profileChatMessages.scrollHeight;
            
            // Clear input
            this.profileChatInput.value = '';
            
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }

    /**
     * Open the edit profile modal
     */
    openEditProfile() {
        // Set current values
        this.editUsernameInput.value = this.currentUser.username;
        this.editPasswordInput.value = '';
        this.editAvatarPreview.src = this.currentUser.avatar;
        
        // Show modal
        this.editProfileModal.classList.add('active');
    }

    /**
     * Save profile changes
     */
    async saveProfile() {
        try {
            const updates = {
                username: this.editUsernameInput.value,
            };
            
            // Only include password if it's been changed
            if (this.editPasswordInput.value) {
                updates.password = this.editPasswordInput.value;
            }
            
            // Handle avatar update if there's a new file
            if (this.editAvatarInput.files && this.editAvatarInput.files[0]) {
                const formData = new FormData();
                formData.append('avatar', this.editAvatarInput.files[0]);
                
                // Upload avatar
                const avatarData = await api.uploadAvatar(formData);
                updates.avatar = avatarData.url;
            }
            
            // Update profile
            const updatedUser = await api.updateProfile(updates);
            
            // Update current user object
            Object.assign(this.currentUser, updatedUser);
            
            // Update UI
            this.updateCurrentUserInfo();
            
            // Close modal
            this.editProfileModal.classList.remove('active');
            
            return true;
        } catch (error) {
            console.error('Failed to save profile:', error);
            return false;
        }
    }

    /**
     * Search for users
     * @param {string} query - The search query
     */
    async searchUsers(query) {
        if (!query.trim()) {
            // If empty query, show friends list
            this.renderFriendsList();
            return;
        }
        
        try {
            // Search users via API
            this.searchResults = await api.searchUsers(query);
            
            // Display search results
            this.renderSearchResults();
            
            return true;
        } catch (error) {
            console.error('Failed to search users:', error);
            return false;
        }
    }

    /**
     * Render search results in the friends list area
     */
    renderSearchResults() {
        // Clear the current list
        this.friendsList.innerHTML = '';
        
        // If no results, show message
        if (!this.searchResults || this.searchResults.length === 0) {
            const emptyEl = this.createEmptyState('search', 'No users found');
            emptyEl.classList.add('empty-search');
            this.friendsList.appendChild(emptyEl);
            return;
        }
        
        // Add each result
        this.searchResults.forEach(user => {
            const userEl = this.createFriendElement(user);
            this.friendsList.appendChild(userEl);
        });
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
        
        // Profile tabs
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
        
        // Search input
        this.searchInput.addEventListener('input', debounce(() => {
            const query = this.searchInput.value.trim();
            this.searchUsers(query);
        }, 300));
        
        // Edit profile modal events
        this.closeEditProfileBtn.addEventListener('click', () => {
            this.editProfileModal.classList.remove('active');
        });
        
        // Close when clicking outside the edit profile content
        this.editProfileModal.addEventListener('click', (event) => {
            if (event.target === this.editProfileModal) {
                this.editProfileModal.classList.remove('active');
            }
        });
        
        // Save profile button
        this.saveProfileBtn.addEventListener('click', () => {
            this.saveProfile();
        });
        
        // Avatar preview
        this.editAvatarInput.addEventListener('change', () => {
            if (this.editAvatarInput.files && this.editAvatarInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.editAvatarPreview.src = e.target.result;
                };
                reader.readAsDataURL(this.editAvatarInput.files[0]);
            }
        });
    }
}

/**
 * Debounce helper function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait time in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
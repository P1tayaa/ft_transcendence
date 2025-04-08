import './Sidebar.css';
import api from '../../api.js';

import Friend from './Friend.js';
import user from '../../User.js';

class Sidebar {
	/**
	 * Constructor for the Sidebar class
	 */
	constructor() {
		this.visible = false;
		this.friends = [];
		this.searchResults = [];
		this.element = null;

		// Listen for user login and logout events
		window.addEventListener('user:login', () => {
			console.log('User logged in, initializing sidebar');
			this.init();
		});
		window.addEventListener('user:logout', () => {
			this.destroy();
		});
	}

	/**
	 * Initialize the sidebar
	 * @returns {Promise<void>}
	 * @throws {Error} - If the sidebar fails to initialize
	 */
	init() {
		try {
			this.visible = true;

			// Create the sidebar element if it doesn't exist
			if (!this.element) {
				this.element = document.createElement('div');
				this.element.classList.add('sidebar');
				this.element.id = 'sidebar';
				document.body.appendChild(this.element);
			}

			this.render();
		} catch (error) {
			console.error('Sidebar initialization failed:', error);
			throw error;
		}
	}

	/**
	 * Destroy the sidebar
	 * @returns {void}
	 */
	destroy() {
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
		this.visible = false;
		this.friends = [];
	}

	/**
	 * Render the sidebar
	 * @returns {string} - The HTML string for the sidebar
	 * @throws {Error} - If the sidebar fails to render
	 */
	render() {
		const sidebarHTML = `
			<!-- Social Side Panel -->
			<div class="sidebar" id="sidebar">
				<!-- Current User Profile -->
				<div class="user-profile" id="current-user-profile">
					<div class="avatar-container">
						<img src="${user.avatar}" alt="Your Avatar" class="avatar" id="current-user-avatar">
						<span class="status-indicator online"></span>
					</div>
					<span class="username" id="current-user-name">${user.username}</span>
				</div>
				
				<!-- Friend Search -->
				<div class="friend-search">
					<i class="fas fa-search"></i>
					<input type="text" placeholder="Search players..." id="friend-search-input">
				</div>
				
				<!-- Friends List -->
				<ul class="friends-list" id="friends-list">
					<!-- Friends will be added here dynamically -->
				</ul>
			</div>
		`;

		this.element.innerHTML = sidebarHTML;
		this.renderFriendsList();
	}

	/**
	 * Render the friends list
	 * @returns {void}
	 * @throws {Error} - If the friends list fails to render
	 */
	renderFriendsList() {
		if (!this.friends || this.friends.length === 0) {
			document.getElementById('friends-list').innerHTML = '<li>No friends yet</li>';
			return;
		}

		const friendsList = document.getElementById('friends-list');

		friendsList.innerHTML = '';

		this.friends.forEach(friend => {
			friendItem = new Friend(friend);
			friendsList.appendChild(friendItem.getElement());
		});
	}

	//Update friends list every minute
	/**
	 * Update the friends list
	 * @returns {Promise<void>}
	 */
	async updateFriendsList() {
		try {
			const response = await api.getFriends();
			console.log('Friends list updated:', response);

			this.friends = response;
			this.renderFriendsList();
		} catch (error) {
			console.error('Failed to update friends list:', error);
		}
	}
}

const sidebar = new Sidebar();

export default sidebar;
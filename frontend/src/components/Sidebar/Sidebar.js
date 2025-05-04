import './Sidebar.css';
import api from '../../api.js';

import user from '../../User.js';
import List from './List.js';
import Profile from '../Profile/Profile.js';
import Socket from '../../socket.js';

class Sidebar {
	/**
	 * Constructor for the Sidebar class
	 */
	constructor() {
		this.visible = false;
		this.element = null;
		this.list = null;
		this.presenceSocket = null;

		// Listen for user login and logout events
		window.addEventListener('user:login', () => {
			console.debug('User logged in, initializing sidebar');
			this.init();
			
			 // Initialize and connect to presence socket after login
			this.initPresenceSocket();
		});
		window.addEventListener('user:logout', () => {
			this.destroy();
			
			// Disconnect from presence socket on logout
			if (this.presenceSocket) {
				this.presenceSocket.disconnect();
			}
		});
		// Add event listener for friends update
		window.addEventListener('friends:update', () => {
			if (this.list) {
				this.list.showFriends();
			}
		});
	}

	initPresenceSocket() {
		this.presenceSocket = new Socket('presence');
		
		// Set the handleMessage function directly
		this.presenceSocket.handleMessage = (message) => {
			if (!message || !message.type || !message.data) {
				return;
			}


			switch (message.type) {
				case 'user_online':
					window.dispatchEvent(new CustomEvent(`user:${message.data.user_id}:online`));
					break;
				case 'user_offline':
					window.dispatchEvent(new CustomEvent(`user:${message.data.user_id}:offline`));
					break;
				default:
					console.warn('Unknown message type:', message.data.type);
			}
		};
		
		this.presenceSocket.connect();
	}

	/**
	 * Initialize the sidebar
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

			this.list = new List('friends-list');
			this.list.showFriends();

			this.setupEvents();
		} catch (error) {
			console.error('Sidebar initialization failed:', error);
			throw error;
		}
	}

	destroy() {
		this.visible = false;

		if (this.presenceSocket) {
			this.presenceSocket.disconnect();
			this.presenceSocket = null;
		}

		if (this.list) {
			this.list.destroy();
			this.list = null;
		}

		if (this.element) {
			this.element.remove();
			this.element = null;
		}
	}
	
	/**
	 * Render the sidebar
	 * @returns {string} - The HTML string for the sidebar
	 * @throws {Error} - If the sidebar fails to render
	*/
	render() {
		const sidebarHTML = `
		<!-- Current User Profile -->
		<div class="user-profile" id="current-user-profile">
		<div class="avatar-container">
		<img src="${user.avatar}" alt="Your Avatar" class="avatar" id="current-user-avatar">
		<span class="status-indicator online"></span>
		</div>
		<span class="username" id="current-user-name">${user.username}</span>
		</div>
		
		<!-- Friend Search -->
		<div class="user-search">
		<i class="fas fa-search"></i>
		<input type="text" placeholder="Search players..." id="user-search-input">
		</div>
		
		<!-- Friends List -->
		<ul class="friends-list" id="friends-list">
		<!-- Friends will be added here dynamically -->
		</ul>
		`;
		
		this.element.innerHTML = sidebarHTML;
	}
	
	setupEvents() {
		const searchInput = document.getElementById('user-search-input');
		searchInput.addEventListener('input', (event) => {
			this.list.search(event.target.value);
		});

		// Add click event to current user profile
		const userProfile = document.getElementById('current-user-profile');
		if (userProfile) {
			userProfile.addEventListener('click', async () => {
				const profile = new Profile(user.id);
				await profile.init();
			});
		}
	}
}

const sidebar = new Sidebar();

export default sidebar;
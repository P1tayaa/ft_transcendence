import Friend from './Friend.js';
import api from '../../api.js';

/**
 * Generic List component that can handle different types of lists
 */
export default class FriendList {
	/**
	 * @param {string} elementID - ID of the container element
	 */
	constructor(elementID) {
		this.elementId = elementID;
		this.element = this.getContainer();
		this.items = [];
		this.searchMode = false;
	}

	destroy() {
		this.items = [];
		this.element.innerHTML = '';
		this.element.remove();
	}

	/**
	 * Get or initialize the container element
	 * @returns {HTMLElement} The container element
	 */
	getContainer() {
		if (!this.element) {
			this.element = document.getElementById(this.elementId);
		}

		if (!this.element) {
			console.error(`Container not found: ${this.elementId}`);
		}

		return this.element;
	}

	handleEmptyState() {
		// Create a styled empty state message with icon
		const emptyMessage = document.createElement('li');
		emptyMessage.className = 'empty-state';
		
		// Empty state message
		if (this.searchMode) {
			emptyMessage.innerHTML = `
				<i class="fas fa-search"></i>
				<span>No matching players found</span>
			`;
		} else {
			emptyMessage.innerHTML = `
				<i class="fas fa-user-friends"></i>
				<span>No friends yet</span>
				<small>Search to add new friends</small>
			`;
		}
		
		this.element.appendChild(emptyMessage);
	}

	/**
	 * Render items to the container
	 */
	render() {
		// Clear the container first
		this.element.innerHTML = '';

		if (!this.items || this.items.length === 0) {
			this.handleEmptyState();
			return;
		}

		this.items.forEach(item => {
			const element = item.getElement();
			if (!element) {
				console.error('Failed to create element for item:', item);
				return;
			}

			this.element.appendChild(element);
		});
	}

	/**
	 * Load friends from the API
	 */
	async showFriends() {
		this.searchMode = false;
		try {
			const friends = await api.getFriends();
			this.items = friends.map(friend => new Friend(friend));
			this.render();
		} catch (error) {
			console.error('Failed to load friends:', error);
		}
	}

	/**
	 * Load users from the API
	 */
	async search(query) {
		if (!query || query.trim() === '') {
			this.showFriends();
			return;
		}

		this.searchMode = true;
		try {
			const users = await api.searchUsers(query);
			this.items = users.map(user => new Friend(user));
			this.render();
		} catch (error) {
			console.error('Failed to load users:', error);
		}
	}
}

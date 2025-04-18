import './Friend.css';

export default class Friend {
	constructor(data, onClick) {
		this.id = data.id;
		this.username = data.username;
		this.avatar = data.avatar || 'default-avatar.png';
		this.status = data.status;

		this.element = null; // Fixed from data.null
		this.onClick = onClick;
	}

	/**
	 * @returns {HTMLElement} - The HTML element representing the friend.
	 */
	getElement() {
		if (this.element) {
			return this.element;
		}

		this.element = document.createElement('li');
		this.element.classList.add('friend-item');
		this.element.setAttribute('data-id', this.id);

		this.element.innerHTML = `
			<div class="friend-avatar-container">
				<img data-field="avatar" src="${this.avatar}" alt="${this.username}'s avatar" class="avatar">
				<span data-field="status" class="status-indicator ${this.status}"></span>
			</div>
			<span data-field="username" class="username">${this.username}</span>
		`;

		this.element.addEventListener('click', (event) => {
			event.preventDefault();

			if (this.onClick) {
				this.onClick(this.id);
			}
		});

		return this.element;
	}

	/**
	 * Updates the information of the friend.
	 * @param {string} newAvatar - The new avatar URL.
	 * @param {string} newUsername - The new username.
	 * @param {string} newStatus - The new status.
	 */
	update(newAvatar, newUsername, newStatus) {
		this.avatar = newAvatar;
		this.username = newUsername;
		this.status = newStatus;

		if (this.element) {
			const avatarElement = this.element.querySelector('[data-field="avatar"]');
			if (avatarElement) {
				avatarElement.src = newAvatar;
				avatarElement.alt = `${newUsername}'s avatar`;
			}

			const usernameElement = this.element.querySelector('[data-field="username"]');
			if (usernameElement) {
				usernameElement.textContent = newUsername;
			}

			const statusElement = this.element.querySelector('[data-field="status"]');
			if (statusElement) {
				statusElement.className = 'status-indicator ' + newStatus;
			}
		}
	}

	/**
	 * Removes the friend item from the sidebar.
	 */
	remove () {
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
	}
}
import './Friend.css';
import Profile from '../Profile/Profile.js';

export default class Friend {
	constructor(userData) {
		this.id = userData.id;
		this.username = userData.username;
		this.avatar = userData.avatar || '/default-avatar.png';
		this.status = userData.online ? 'online' : 'offline';
		this.element = null;
	}

	getElement() {
		if (!this.element) {
			this.element = document.createElement('li');
			this.element.className = 'friend-item';
			this.render();
			this.setupEvents();
		}
		return this.element;
	}

	render() {
		if (!this.element)
			return;

		this.element.innerHTML = `
			<div class="friend-avatar-container">
				<img src="${this.avatar}" alt="${this.username}" class="friend-avatar">
				<span class="status-indicator ${this.status}"></span>
			</div>
			<span class="username">${this.username}</span>
		`;
	}

	setupEvents() {
		if (!this.element)
			return;

		this.element.addEventListener('click', async () => {
			const profile = new Profile(this.id);
			await profile.init();
		});

		// Event listeners for online/offline status
		this.setOnline = this.setStatus.bind(this, 'online');
		this.setOffline = this.setStatus.bind(this, 'offline');

		window.addEventListener(`user:${this.id}:online`, this.setOnline);
		window.addEventListener(`user:${this.id}:offline`, this.setOffline);
	}

	setStatus = (status) => {
		this.status = status;
		this.render();
	}
	
	destroy() {
		window.removeEventListener(`user:${this.id}:online`, this.setOnline);
		window.removeEventListener(`user:${this.id}:offline`, this.setOffline);
	}
}
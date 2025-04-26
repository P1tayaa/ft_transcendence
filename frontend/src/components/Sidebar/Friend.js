import './Friend.css';
import Profile from '../Profile/Profile.js';

export default class Friend {
    constructor(userData) {
        this.id = userData.id;
        this.username = userData.username;
        this.avatar = userData.avatar || '/default-avatar.png';
        this.status = userData.status || 'offline';
        this.newMessages = userData.newMessages || 0;
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
        if (!this.element) return;

        // Create new message indicator if there are unread messages
        const newMessagesIndicator = this.newMessages > 0 
            ? `<span class="new-messages">${this.newMessages}</span>` 
            : '';

        this.element.innerHTML = `
            <div class="friend-avatar-container">
                <img src="${this.avatar}" alt="${this.username}" class="friend-avatar">
                <span class="status-indicator ${this.status === 'online' ? 'online' : ''}"></span>
            </div>
            <span class="username">${this.username}</span>
            ${newMessagesIndicator}
        `;
    }

    setupEvents() {
        if (!this.element) return;

        this.element.addEventListener('click', async () => {
            const profile = new Profile(this.id);
            await profile.init();
        });
    }
}
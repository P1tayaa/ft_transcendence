import api from './api.js';

function setCookie(name, value, hours = undefined, path = '/') {
	let expires = "";

	if (hours) {
		const date = new Date();
		date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
		expires = `; expires=${date.toGMTString()}`;
	}

	document.cookie = `${name}=${value}${expires}; path=/`;
}

function getCookie(name) {
	const cookies = document.cookie.split(';');
	const cookie = cookies.find(cookie => cookie.trim().startsWith(name + '='));

	return cookie ? cookie.split('=')[1] : null;
}

function eraseCookie(name) {
	setCookie(name, "" );
}

class User {
	/**
	 * Constructor for the User class
	 */
	constructor() {
		this.id = null;
		this.username = '';
		this.avatar = '';
		this.status = 'offline';

		this.authenticated = false;

		this.friends = [];
	}

	async init () {
		const token = getCookie('auth-token');

		if (token) {
			try {
				const response = await api.getCurrentUser();
				this.login(response.user, token);
			} catch (error) {
				console.error('User initialization failed:', error);
				this.logout();
			}
		}
	}

	login(data, token) {
		this.authenticated = true;

		this.id = data.id;
		this.username = data.username;
		this.avatar = data.avatar || 'default-avatar.png';
		this.status = data.status;

		this.friends = data.following;

		setCookie('auth-token', token, 12);

		window.dispatchEvent(new Event('user:login'));
	}

	logout() {
		this.authenticated = false;

		this.id = null;
		this.username = '';
		this.avatar = '';
		this.status = 'offline';

		this.friends = [];

		eraseCookie('auth-token');

		window.dispatchEvent(new Event('user:logout'));
	}
}

const user = new User();
export default user;
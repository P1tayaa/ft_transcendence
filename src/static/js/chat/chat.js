import { getCSRFToken, getRequest, postRequest, getUserName } from '../utils.js';

const SEARCH_USERS_URL = '../api/fetch_matching_usernames/';

const FRIENDS_URL = '../api/get_friends/';
const ADD_FRIEND_URL = '../api/add_friend/';
const REMOVE_FRIEND_URL = '../api/remove_friend/';

const CHAT_URL = '../api/chats/';
const SEND_CHAT_URL = '../api/add_message/';

const GET_ME_URL = '../api/me';


class Social {
	constructor() {
		this.currentProfile = null;
		this.me = null;
		this.friends = [];
	}

	async init() {
		this.me = await getRequest(GET_ME_URL);

		await this.loadProfileSide();
		await this.loadFriendList();

		await this.loadProfile(this.me);
	}

	async loadProfile(user) {
		this.currentProfile = user;
		this.loadProfileTop();
		this.loadChat();
	}

	async loadProfileSide() {
		// Load user
		const user = await getRequest(GET_ME_URL);

		const img = document.createElement("img");
		img.src = user.avatar;
		img.alt = user.username + "'s avatar";
		img.width = 64;
		img.height = 64;

		const h3 = document.createElement("h3");
		h3.textContent = user.username;

		const div = document.getElementById("profile-sidebar");
		div.appendChild(img);
		div.appendChild(h3);

		div.addEventListener("click", () => {
			this.loadProfile(user);
		});
	}

	async loadProfileTop() {
		console.log("Loading profile top");
		console.log(this.currentProfile);

		const div = document.getElementById("profile");
		div.innerHTML = "";

		const img = document.createElement("img");
		img.src = this.currentProfile.avatar;
		img.alt = this.currentProfile.username + "'s avatar";
		img.width = 128;
		img.height = 128;

		const h2 = document.createElement("h2");
		h2.textContent = this.currentProfile.username;

		div.appendChild(img);
		div.appendChild(h2);
	}

	async getFriends() {
		try {
			const friendData = await getRequest(FRIENDS_URL);
			return friendData.friends;
		} catch (error) {
			console.error('Error getting friends:', error);
			return ;
		}
	}

	async addFriend(friend_id) {
		try {
			await postRequest(ADD_FRIEND_URL, { friend_id: friend_id });
		} catch (error) {
			console.error('Error adding friend:', error);
			return false;
		}
		return true;
	}

	async loadFriendList() {
		this.friends = await this.getFriends();
	
		console.log("Friends:");
		console.log(this.friends);
	
		// Loop through and create list items
		this.friends.forEach(friend => {
			const li = document.createElement("li");
			li.classList.add("friendBox");
	
			// Create avatar image
			const img = document.createElement("img");
			if (!friend.avatar) {
				console.log("No avatar found for", friend.username);
				img.src = "../static/icons/DefaultAvatar.png";
			} else {
				console.log("Avatar found for", friend.username);
				img.src = friend.avatar;
			}
			img.alt = `${friend.username}'s Avatar`;
			img.width = 64;
			img.height = 64;
	
			// Create name text
			const nameText = document.createTextNode(friend.username);
	
			// Append image and name
			li.appendChild(img);
			li.appendChild(nameText);
	
			// Add message button if applicable
			const msgButton = document.createElement("button");
			msgButton.textContent = "Message";
			msgButton.addEventListener("click", () => {
				this.loadProfile(friend);
			});
			li.appendChild(msgButton);
	
			// Append list item to friend list
			const friendListDiv = document.getElementById("friends");
			friendListDiv.appendChild(li);

			li.addEventListener("click", () => {
				this.loadProfile(friend);
			});
		});
	}

	async loadChat() {
		const chats = await getRequest(CHAT_URL, this.currentProfile);
		const chatDiv = document.getElementById("chat-messages");
		chatDiv.innerHTML = "";

		console.log(chats);
	
		chats.chats.forEach(message => {
			const content = message.latest_message.content;
			const messageDiv = document.createElement("li");
			if (message.latest_message.sender === this.me.username) {
				messageDiv.classList.add("message-self");
			} else {
				messageDiv.classList.add("message-other");
			}
	
			messageDiv.textContent = content;
	
			chatDiv.appendChild(messageDiv);
		});
	}

	async sendChat(message) {
		if (!this.currentProfile) {
			alert("Please select a friend to chat with.");
			return;
		}

		try {
			await postRequest(SEND_CHAT_URL, {
				recipient_id: this.currentProfile,
				content: message
			});
		} catch (error) {
			console.error('Error sending message:', error);
			alert('An error occurred while sending the message.');
		}
	}

	async getSearchResults(searchTerm) {
		try {
			const url = `${SEARCH_USERS_URL}?username=${encodeURIComponent(searchTerm)}`;
			const searchResults = await getRequest(url);
			return searchResults.results;
		} catch (error) {
			console.error('Error searching for users:', error);
			return [];
		}
	}

	async loadSearchResults(searchTerm) {
		const users = await this.getSearchResults(searchTerm);

		console.log("Search Results:");
		console.log(users);

		if (!users || users.length === 0) {
			console.log("No users found.");
			return;
		}

		// Clear existing search results
		const searchResultsDiv = document.getElementById("friends");
		searchResultsDiv.innerHTML = "";

		// Loop through and create list items
		users.forEach(user => {
			if (user.username === this.me.username) {
				return ;
			}

			const li = document.createElement("li");
			li.classList.add("friendBox");

			// Create avatar image
			const img = document.createElement("img");
			img.src = user.avatar;
			img.alt = `${user.username}'s Avatar`;
			img.width = 64;
			img.height = 64;
	
			// Create name text
			const nameText = document.createTextNode(user.username);
	
			// Append image and name
			li.appendChild(img);
			li.appendChild(nameText);

			// Append list item to friend list
			const friendListDiv = document.getElementById("friends");
			friendListDiv.appendChild(li);

			li.addEventListener("click", () => {
				this.loadProfile(user);
			});
		});
	}
}


document.addEventListener("DOMContentLoaded", async () => {
	const social = new Social();
	
	await social.init();
	
	const searchForm = document.getElementById("search");
	searchForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const searchTerm = document.getElementById("search-box").value.trim();

		if (searchTerm) {
			social.loadSearchResults(searchTerm);
		}

	});

	const chatForm = document.getElementById("chat-input");
	chatForm.addEventListener("submit", (event) => {
		event.preventDefault();

		const message = document.getElementById("chat-box").value.trim();

		if (message) {
			social.sendChat(message);
		}
	});

});
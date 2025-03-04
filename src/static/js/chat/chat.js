import { getCSRFToken, getRequest, postRequest, getUserName } from '../utils.js';

const SEARCH_URL = '../api/fetch_matching_usernames/';

const FRIENDS_URL = '../api/follow/following';
const FOLLOW_URL = '../api/follow/';
const UNFOLLOW_URL = '../api/follow/unfollow';

const CHAT_URL = '../api/chats/';
const SEND_CHAT_URL = '../api/chats/message/';

const GET_ME_URL = '../api/me';

const LOGOUT_URL = '../api/logout/';
const LOGOUT_REDIRECT_URL = '../login';

const CLEAR_CHAT_URL = '../api/chat/clear';

class Social {
	constructor() {
		this.currentProfile = null;
		this.me = null;
		this.currentScreen = null;
		this.MatchHistory = null;
		this.Stats = null;
		this.Chat = null;
	}

	async init() {
		this.me = await getRequest(GET_ME_URL);

		this.loadProfileSide();
		this.loadFriendList();

		this.loadProfile(this.me);
	}

	loadProfile(user) {
		if (this.currentProfile === user) {
			return;
		}

		this.currentProfile = user;
		this.loadProfileTop();

		if (!this.currentScreen) {
			this.Stats = new Stats(this.currentProfile);
			this.Chat = new Chat(this.me, this.currentProfile);
			this.MatchHistory = new MatchHistory(this.currentProfile);
		}

		this.currentScreen = this.MatchHistory;

		document.getElementById("chat-select").style.display = this.currentProfile === this.me ? "none" : "block";

		this.setupTabEvents();
	}

	setupTabEvents() {
		const tabs = [
			{ id: "history-select", screen: this.MatchHistory },
			{ id: "stats-select", screen: this.Stats },
			{ id: "chat-select", screen: this.Chat }
		];

		tabs.forEach(tab => {
			document.getElementById(tab.id).addEventListener("click", (event) => {
				event.preventDefault();

				if (this.currentScreen === tab.screen) {
					return;
				}

				tab.screen.load(this.currentProfile);
				this.currentScreen = tab.screen;
			});
		});
	}

	async loadProfileSide() {
		// Load user
		const img = document.createElement("img");
		img.classList.add("avatar");
		img.src = this.me.avatar;
		img.alt = this.me.username + "'s avatar";
		img.width = 64;
		img.height = 64;

		const h3 = document.createElement("h3");
		h3.textContent = this.me.username;

		const div = document.getElementById("profile-sidebar");
		div.appendChild(img);
		div.appendChild(h3);

		div.addEventListener("click", () => {
			this.loadProfile(this.me);
		});
	}

	async loadProfileTop() {
		const div = document.getElementById("profile-info");
		div.innerHTML = "";

		const img = document.createElement("img");
		img.classList.add("avatar");
		img.src = this.currentProfile.avatar;
		img.alt = this.currentProfile.username + "'s avatar";
		img.width = 128;
		img.height = 128;

		const h2 = document.createElement("h2");
		h2.textContent = this.currentProfile.username;

		div.appendChild(img);
		div.appendChild(h2);

		const buttons = document.getElementById("profile-buttons");
		buttons.innerHTML = "";

		// If the current profile is the user, show edit and logout buttons
		if (this.currentProfile === this.me) {
			const edit = document.createElement("button");
			edit.textContent = "Edit Profile";
			buttons.appendChild(edit);

			const logout = document.createElement("button");
			logout.textContent = "Logout";
			logout.addEventListener("click", async () => {
				await postRequest(LOGOUT_URL);
				window.location.href = LOGOUT_REDIRECT_URL;
			});
			buttons.appendChild(logout);

			return;
		}

		console.log("Profile: ", this.currentProfile)

		const friendButton = document.createElement("button");
		if (this.currentProfile.is_following) {
			friendButton.textContent = "Remove Friend";
			friendButton.addEventListener("click", () => {
				this.removeFriend(this.currentProfile.id);
			});
		} else {
			friendButton.textContent = "Add Friend";
			friendButton.addEventListener("click", () => {
				this.addFriend(this.currentProfile.id);
			});
		}
		buttons.appendChild(friendButton);

		const block = document.createElement("button");
		block.textContent = "Block";
		buttons.appendChild(block);


	}

	async getFriends() {
		try {
			const friendData = await getRequest(FRIENDS_URL);
			return friendData.following;
		}
		catch (error) {
			console.error('Error getting friends:', error);
			return ;
		}
	}

	async addFriend(user_id) {
		try {
			console.log("Adding friend...");
			console.log(user_id);
			await postRequest(FOLLOW_URL, { user_id: user_id });
		}
		catch (error) {
			console.error('Error adding friend:', error);
			return false;
		}
		return true;
	}

	async removeFriend(user_id) {
		try {
			await postRequest(UNFOLLOW_URL, { user_id: user_id });
		}
		catch (error) {
			console.error('Error removing friend:', error);
			return false;
		}
		return true;
	}

	async loadFriendList() {
		const friends = await this.getFriends();
		const friendListDiv = document.getElementById("friends");

		// Loop through and create list items
		friends.forEach(friend => {
			const li = document.createElement("li");
			li.classList.add("friend");
			li.setAttribute("user-id", friend.id);

			// Add online status
			const status = document.createElement("span");
			status.classList.add("status");

			// Create avatar image
			const img = document.createElement("img");
			img.classList.add("avatar");
			img.src = friend.avatar;
			img.alt = `${friend.username}'s Avatar`;
			img.width = 64;
			img.height = 64;
	
			
			// Create name text
			const nameText = document.createTextNode(friend.username);
			
			// Append image and name
			li.appendChild(img);
			li.appendChild(status);
			li.appendChild(nameText);
	
			// Add message button if applicable
			const msgButton = document.createElement("button");
			msgButton.textContent = "Message";
			msgButton.addEventListener("click", () => {
				this.loadProfile(friend);
			});
			li.appendChild(msgButton);
	
			// Append list item to friend list
			friendListDiv.appendChild(li);

			li.addEventListener("click", () => {
				this.loadProfile(friend);
			});
		});
	}

	setOnlineStatus(user_id, status) {
		const statusDiv = document.querySelector(`li[user-id="${user_id}"] .status`);

		if (statusDiv) {
			console.log("Setting status:", user_id, status);
			
			if (status === "online") {
				statusDiv.classList.add("online");
			} else {
				statusDiv.classList.remove("online");
			}
		} else {
			console.warn("Status div not found for user_id:", user_id);
		}
	}

	async getSearchResults(searchTerm) {
		try {
			const url = `${SEARCH_URL}?username=${encodeURIComponent(searchTerm)}`;
			const searchResults = await getRequest(url);
			return searchResults.results;
		} catch (error) {
			console.error('Error searching for users:', error);
			return [];
		}
	}

	async loadSearchResults(searchTerm) {
		const users = await this.getSearchResults(searchTerm);

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
			li.classList.add("friend");

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

	async clearChat() {
		try {
			console.log("Clearing chat...");
			await postRequest(CLEAR_CHAT_URL);
		} catch (error) {
			console.error('Error clearing chat:', error);
			return false;
		}
		return true;
	}
}

class MatchHistory {
	constructor (user) {
		this.load(user);
	}

	async getMatchHistory() {
		const url = `../api/score/?user_id=${this.user.id}`;
		const matchHistory = await getRequest(url);
		return matchHistory;
	}

	async loadMatchHistory() {
		const matchHistory = await this.getMatchHistory();
		const games = matchHistory.games;

		console.log("Matches:", games);

		const matchDiv = document.getElementById("history");
		matchDiv.innerHTML = "";

		// Create list of matches
		games.forEach(match => {
			const matchItem = document.createElement("li");
			matchItem.textContent = `Match: ${match.score}`;
			matchDiv.appendChild(matchItem);
		});

		const addMatchButton = document.createElement("button");
		addMatchButton.textContent = "Add Match";
		addMatchButton.addEventListener("click", () => {
			this.addMatch();
		});
		matchDiv.appendChild(addMatchButton);
	}

	async addMatch() {
		try {
			const data = await postRequest("../api/score/add", { score: 69 });
			console.log("Match added:", data);
		} catch (error) {
			console.error('Error adding match:', error);
			alert('An error occurred while adding the match.');
		}
	}

	load(user) {
		this.user = user;

		document.getElementById("chat").style.display = "none";
		document.getElementById("stats").style.display = "none";
		document.getElementById("history").style.display = "flex";

		this.loadMatchHistory();
	}
}

class Stats {
	constructor(user) {
		this.load(user);
	}

	async getStats() {
		const url = `../api/stats/?user_id=${this.user.id}`;
		const stats = await getRequest(url);
		return stats;
	}

	async loadStats() {
		const stats = await this.getStats();
	}

	load(user) {
		this.user = user;

		document.getElementById("history").style.display = "none";
		document.getElementById("stats").style.display = "flex";
		document.getElementById("chat").style.display = "none";

		// this.loadStats();
	}
}

class Chat {
	constructor(me, other) {
		this.me = me;
		this.other = other;
	}

	async getChats() {
		try {
			const chatData = await getRequest(`${CHAT_URL}?user_id=${this.other.id}`);
			const chats = chatData.messages;
			return chats;
		}
		catch (error) {
			console.error('Error getting chats:', error);
			return [];
		}
	}

	async loadChats() {
		const chats = await this.getChats();
		const chatDiv = document.getElementById("chat-list");
		chatDiv.innerHTML = "";

		console.log("Chats:", chats);

		chats.forEach(message => {
			const content = message.content;
			const messageDiv = document.createElement("li");
			if (message.sender === this.me.username) {
				messageDiv.classList.add("message-self");
			} else {
				messageDiv.classList.add("message-other");
			}

			messageDiv.textContent = content;
	
			chatDiv.appendChild(messageDiv);
		});
	}

	async sendChat(message) {
		if (!this.other) {
			alert("Please select a friend to chat with.");
			return;
		}

		try {
			const data = await postRequest(SEND_CHAT_URL, {
				recipient_id: this.other.id,
				content: message
			});

			console.log("Message sent:", data);

		} catch (error) {
			console.error('Error sending message:', error);
			alert('An error occurred while sending the message.');
		}
	}

	load(other) {
		this.other = other;

		//Hide stats and history
		document.getElementById("history").style.display = "none";
		document.getElementById("stats").style.display = "none";
		document.getElementById("chat").style.display = "flex";

		//Load chat
		this.loadChats();
	}
}

document.addEventListener("DOMContentLoaded", async () => {
	const social = new Social();
	
	await social.init();
	
	const searchForm = document.getElementById("search");
	searchForm.addEventListener("submit", (event) => {
		event.preventDefault();
		const form = document.getElementById("search-box");
		const searchTerm = form.value.trim();
		form.value = "";

		if (searchTerm) {
			// social.clearChat();
			social.loadSearchResults(searchTerm);
		}

	});

	const chatForm = document.getElementById("chat-input");
	chatForm.addEventListener("submit", (event) => {
		event.preventDefault();

		const form = document.getElementById("chat-box");

		const message = form.value.trim();
		form.value = "";

		if (message) {
			social.Chat.sendChat(message);
		}
	});

	const socket = new WebSocket("ws://localhost:8000/ws/presence/");

	socket.addEventListener("open", function(event) {
		console.log("Connected to the status socket.");
	});

	socket.addEventListener("close", function(event) {
		console.log("Disconnected from the status socket.");
	});

	socket.addEventListener("message", function(event) {
		const data = JSON.parse(event.data);
		console.log("Message from status socket:", data);

		if (data.type === "user_online") {
			social.setOnlineStatus(data.user_id, "online");
		} else if (data.type === "user_offline") {
			social.setOnlineStatus(data.user_id, "offline");
		} else if (data.type === "online_users") {
			data.users.forEach(user => {
				social.setOnlineStatus(user.user_id, "online");
			});
		}
	});
});
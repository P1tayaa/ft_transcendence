export default class WebSocketManager {
	constructor(endpoint) {
		this.url = `${this.getWebsocketHost()}/ws/${endpoint}/`;
		this.socket = null;

		// Callback function
		this.handleMessage = null;
	}

	/**
	 * Get the WebSocket host URL
	 * @returns {string} The WebSocket host URL
	 */
	getWebsocketHost() {
		// Use the same host as the current page with secure WebSocket if HTTPS
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const host = window.location.host;
		return `${protocol}//${host}`;
	}

	/**
	 * Connect to the WebSocket
	**/
	connect() {
		try {
			console.log('Connecting to socket ', this.url);
			this.socket = new WebSocket(this.url);

			this.socket.onopen = () => {
				console.log('Connected to socket ', this.url);
			};

			this.socket.onmessage = (event) => {
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			};

			this.socket.onclose = (event) => {
				console.log('Socket closed with code:', event.code, event.reason || ': No reason was given');
			};

			this.socket.onerror = (error) => {
				console.error('Socket error:', error);
			};
		} catch (error) {
			console.error('Failed to connect to socket:', error);
		}
	}

	/**
	 * Send a message to the WebSocket
	 * @param {Object} message - The message to send
	 */
	send(message) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(message);
		} else {
			console.error('Socket is not open. Cannot send message:', message);
		}
	}

	/**
	 * Disconnect from WebSocket
	 */
	disconnect() {
		if (this.socket) {
			this.socket.close();
		}
	}
}
class WebSocketManager {
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

			this.socket.addEventListener('open', () => {
				console.log('Connected to socket ', this.url);
			});

			this.socket.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			});

			this.socket.addEventListener('close', () => {
				console.log('Disconnected from socket');
			});

			this.socket.addEventListener('error', (error) => {
				console.error('Socket error:', error);
			});
		} catch (error) {
			console.error('Failed to connect to socket:', error);
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

export default WebSocketManager;
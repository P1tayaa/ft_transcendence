class Router {
	constructor() {
		this.rootElement = document.getElementById('app');

		this.routes = {
			// '/': new Home(),
			// '/about': new About(),
			// '/contact': new Contact()
		}

		window.addEventListener('DOMContentLoaded', () => {
			this.navigate(window.location.pathname);
		});
	}
}
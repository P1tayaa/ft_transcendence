import routes from './routes.js';

/**
 * Router class
 * @param {Array} routes - array of Route objects
 * @param {string} rootElement - id of the root element in which the components will be rendered
 */
class Router {
	constructor() {
		this.rootElement = document.getElementById('app');

		this.routes = routes;

		console.log('Router initialized, routes:', this.routes);

		window.addEventListener('DOMContentLoaded', () => {
			this.navigate(window.location.pathname);
		});

		window.addEventListener('popstate', () => {
			this.navigate(window.location.pathname);
		});

		window.addEventListener('click', (e) => {
			if (e.target.matches('[data-link]')) { // any navigation element should have data-link attribute
				e.preventDefault();
				this.navigate(e.target.href);
			}
		});
	}

	/**
	 * Navigate to the route
	 * @param {string} path - path of the route
	 */
	navigate(path, history = true) {
		console.log('Navigating to:', path);
		const route = this.routes.find(route => route.path === path);

		if (!route) {
			this.rootElement.innerHTML = `<h1>404 Not Found</h1>`;
			return;
		}

		if (route.auth && !localStorage.getItem('token')) {
			this.navigate('/login');
			return;
		}

		this.rootElement.innerHTML = route.component().render();

		if (history) {
			window.history.pushState({}, '', path);
		}

		if (route.after) {
			route.after();
		}
	}
}

export default Router;


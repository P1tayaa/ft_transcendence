import routes from './routes.js';
import user from './User.js';

/**
 * Router class
 * @param {Array} routes - array of Route objects
 * @param {string} rootElement - id of the root element in which the components will be rendered
 */
class Router {
	constructor() {
		this.rootElement = document.getElementById('app');
		this.routes = routes;
		this.currentRoute = null;

		window.addEventListener('popstate', () => {
			this.navigate(window.location.pathname, false);
		});
	}

	/**
	 * Match the route with the path
	 * @param {string} path - path of the route
	 * @return {object} - Route object
	 */
	matchRoute(path) {
		for (const route of this.routes) {
			const regex = new RegExp(`^${route.path.replace(/:[^\s/]+/g, '([\\w-]+)')}$`);
			if (regex.test(path)) {
				return route;
			}
		}
		return null;
	}

	/**
	 * Navigate to the route
	 * @param {string} path - path of the route
	 */
	navigate(path, history = true) {
		setTimeout(null, 0);

		const route = this.matchRoute(path);

		if (!route) {
			this.rootElement.innerHTML = `<h1>404 Not Found</h1>`;
			return;
		}

		if (!user.authenticated && path !== '/login') {
			this.navigate('/login');
			return
		}
		if (user.authenticated && path === '/login') {
			this.navigate('/');
			return
		}

		if (history && path !== window.location.pathname) {
			window.history.pushState({}, '', path);
		}

		// Clean up the previous component if it exists
		if (this.currentRoute && this.currentRoute.component.onUnload) {
			this.currentRoute.component.onUnload();
		}

		this.currentRoute = route;

		// Render the component
		this.rootElement.innerHTML = route.component.render();

		// Call the onLoad method if it exists
		if (route.component.onLoad) {
			route.component.onLoad();
		}
	}
}

const router = new Router();

export default router;

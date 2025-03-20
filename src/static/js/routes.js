
import Home from './components/Home.js';
import Authenticate from './components/auth/component.js';

/**
 * Route object
 * @param {string} path - path of the route
 * @param {object} component - component to be rendered
 * @param {boolean} auth - if the route is protected
 * @param {function} after - function to be executed after rendering the component
 */
class Route {
	constructor({
		path,
		component,
	}) {
		this.path = path;
		this.component = component;
	}
}

const routes = [
	new Route({
		path: '/',
		component: Home,
	}),

	new Route({
		path: '/login',
		component: Authenticate
	}),

];

export default routes;
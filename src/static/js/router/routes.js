
import Home from './components/Home.js';

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
		auth = false,
		after = null
	}) {
		this.path = path;
		this.component = component;
		this.auth = auth;
		this.after = after;
	}
}

const routes = [
	new Route({
		path: '/',
		component: Home
	}),

];

export default routes;
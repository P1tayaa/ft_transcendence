
import Home from './components/Home/Home.component.js';
import Authenticate from './components/Auth/Auth.component.js';
import Game from './components/Game/Game.component.js';

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

	new Route({
		path: '/game',
		component: Game
	})
];

export default routes;
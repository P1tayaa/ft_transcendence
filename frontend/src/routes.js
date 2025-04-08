
import Home from './views/Home/Home.component.js';
import Auth from './views/Auth/Auth.js';
import Game from './views/Game/Game.component.js';

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
		component: Auth
	}),

	new Route({
		path: '/game',
		component: Game
	})
];

export default routes;
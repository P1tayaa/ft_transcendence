import home from './views/Home/Home.js';
import auth from './views/Auth/Auth.js';
import game from './views/Game/Game.js';
import tournament from './views/Tournament/Tournament.js';

/**
 * Route object
 * @param {string} path - path of the route
 * @param {object} component - pre-instantiated component object
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
		component: home,
	}),

	new Route({
		path: '/login',
		component: auth
	}),

	new Route({
		path: '/game',
		component: game
	}),

	new Route({
		path: '/game/local',
		component: game
	}),

	new Route({
		path: '/game/:name',
		component: game
	}),

	new Route({
		path: '/tournament/:name',
		component: tournament
	}),
];

export default routes;
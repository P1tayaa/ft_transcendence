import gameOnLoad from './Game.onLoad.js';
import './Game.css';

const Game = () => {
	const render = () => { return `
		<div id="gameplay">
			<canvas id="pong-game" width="960" height="720">Your browser does not support the canvas element.</canvas>
		</div>
	`};

	const onLoad = gameOnLoad;

	return { render, onLoad };
};

export default Game;
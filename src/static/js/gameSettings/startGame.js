import { api } from "../ApiManager.js";

export class Config {
	constructor(selection) {
		this.mode = selection.mode;
		this.playerCount = selection.players;
		this.map_style = selection.map;
		this.powerup = (selection.powerups.length > 0);
		this.poweruplist = selection.powerups;
		this.bots = (selection.mode === "localsolo");
		this.playerside = [];
		this.botsSide = [];
		this.host = true;
		this.Spectator = false;

		const sides = this.playerCount === 2 ? ["left", "right"] : ["left", "right", "top", "bottom"];

		if (this.bots) {
			const playerIndex = Math.floor(Math.random() * sides.length);
			this.playerside = sides.splice(playerIndex, 1);
			this.botsSide = sides;
		} else {
			this.playerside = sides;
		}
	}

	get() {
		return {
			mode: this.mode,
			powerup: this.powerup,
			poweruplist: this.poweruplist,
			playerCount: this.playerCount,
			map_style: this.map_style,
			playerside: this.playerside,
			bots: this.bots,
			botsSide: this.botsSide,
			host: this.host,
			Spectator: this.Spectator
		}
	}
}

export async function startGame(config) {
	if (config.mode === "networked") {
		const room = await api.createGame(config);

		console.log("Reponse of make_room()", room);
		console.log('Initializing game with configuration:', config);

		setTimeout(() => {
			document.dispatchEvent(new CustomEvent("startGame", { detail: { gameConfig: config, room_name: room.room_name } }));
		}, 3000);
	} else {
		setTimeout(() => {
			document.dispatchEvent(new CustomEvent("startGame", { detail: { gameConfig: config } }));
		}, 3000);
	}
}

export async function startTournament(config) {
	console.log('Starting tournament with configuration:', config);

	const room = await api.createTournament(config);

	console.log("Reponse of create tournament", room);

	const list = await api.getTournamentList();

	console.log("List of tournaments", list);

	const info = await api.getTournamentInfo(room.tournament_id);

	console.log("Info of tournament", info);

	window.location.href = `/tournament/${room.tournament_id}`;

	// setTimeout(() => {
	// 	document.dispatchEvent(new CustomEvent("startGame", { detail: { gameConfig: config, room_name: room.room_name } }));
	// }, 3000);
}


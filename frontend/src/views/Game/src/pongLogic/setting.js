export const Mode = {
	NETWORKED: "networked",
	LOCAL: "local",
};

export const MapStyle = {
	CLASSIC: "classic",
	BATH: "bath",
	Lava: "lava",
	Beach: "beach",
};

export const PlayerSide = {
	LEFT: "left",
	RIGHT: "right",
	BOTTOM: "bottom",
	TOP: "top",
};

export function intToPlayerSide(last_winner) {
	const winnerSide =
		last_winner === 1 ? PlayerSide.LEFT :
			last_winner === 2 ? PlayerSide.RIGHT :
				last_winner === 3 ? PlayerSide.BOTTOM :
					last_winner === 4 ? PlayerSide.TOP :
						null;
	return winnerSide;

}

export class Setting {
	constructor(map, playercount, local) {
		this.mode = local ? Mode.LOCAL : Mode.NETWORKED;
		this.playercount = playercount;
		this.mapStyle = this.parseMapStyle(map);
		this.playerSide = playercount === 2 ? ["left", "right"] : ["left", "right", "bottom", "top"];
		this.paddleSize = {};
		this.paddleLoc = {};
		this.playerSide.forEach(side => {
			if (side === PlayerSide.RIGHT || side === PlayerSide.LEFT) {
				this.paddleSize[side] = { x: 1, y: 8 };
			} else {
				this.paddleSize[side] = { x: 8, y: 1 };
			}
			this.paddleLoc[side] = 0;
		});

		console.debug("Parsed settings:", this);
	}

	parseMapStyle(mapStyle) {
		if (!Object.values(MapStyle).includes(mapStyle)) {
			console.warn(`Unknown map style: ${mapStyle}. Defaulting to CLASSIC.`);
			return MapStyle.CLASSIC;
		}

		return mapStyle
	}
}
import { PlayerSide } from "./pongLogic/setting";

const BOTSPEED = { x: 0.2, y: 0.2 };

export function botControl(settings, ballPos) {
  settings.botsSide.forEach(side => {
    if (side === PlayerSide.RIGHT || side === PlayerSide.LEFT) {
      if (settings.paddleLoc[side] < ballPos.y) {
        settings.paddleLoc[side] += BOTSPEED.y;
      } else {
        settings.paddleLoc[side] -= BOTSPEED.y;
      }
    } else {
      if (settings.paddleLoc[side] < ballPos.x) {
        settings.paddleLoc[side] += BOTSPEED.x;
      } else {
        settings.paddleLoc[side] -= BOTSPEED.x;
      }
    }
  });
}


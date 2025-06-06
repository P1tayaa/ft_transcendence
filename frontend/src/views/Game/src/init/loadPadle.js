
import { PlayerSide, MapStyle } from "../pongLogic/setting.js";

export function posSpawn(map, position) {
  let distanceToCenter;
  let positionSpawn;
  let ration_map;
  switch (map) {
    case MapStyle.CLASSIC:
      distanceToCenter = 40;
      ration_map = 0.6;
      break;
    case MapStyle.BATH:
      distanceToCenter = 40;
      ration_map = 0.5;
      break;
    case MapStyle.Lava:
      distanceToCenter = 35;
      ration_map = 1;
      break;
    case MapStyle.Beach:
      distanceToCenter = 38;
      ration_map = 1;
      break;
    default:
      console.error(`Unknown map style: ${map}`);
      break;
  }

  switch (position) {
    case PlayerSide.LEFT:
      positionSpawn = { x: -distanceToCenter, y: 0, z: 0 };
      break;
    case PlayerSide.RIGHT:
      positionSpawn = { x: distanceToCenter, y: 0, z: 0 };
      break;
    case PlayerSide.TOP:
      positionSpawn = { x: 0, y: -distanceToCenter * ration_map, z: 0 };
      break;
    case PlayerSide.BOTTOM:
      positionSpawn = { x: 0, y: distanceToCenter * ration_map, z: 0 };
      break;
    default:
      console.error(`Unknown map style: ${PlayerSide}`)
      break;
  }



  return (positionSpawn)
}

export function getNewPosition(side, mapStyle, position) {
  const startPos = posSpawn(mapStyle, side);

  if (side === PlayerSide.RIGHT || side === PlayerSide.LEFT) {
    const newPos = { x: startPos.x, y: position, z: 0 };
    return newPos;
  } else {
    const newPos = { x: position, y: startPos.y, z: 0 };
    return newPos;
  }
}

export function checkBounderyPadle(settings, name, pongLogic, speed) {
  if (name === PlayerSide.LEFT || name == PlayerSide.RIGHT) {
    if ((Math.abs(settings.paddleLoc[name] + speed) - settings.paddleSize[name].y / 2) >= pongLogic.playArea.depth / 2) {
      return false;
    }
  } else {
    if ((Math.abs(settings.paddleLoc[name] + speed) - settings.paddleSize[name].x / 2) >= pongLogic.playArea.width / 2) {
      return false;
    }
  }
  return true;
}

export function checkBounderyPadlePos(position, settings, name, pongLogic, speed) {
  if (name === PlayerSide.LEFT || name == PlayerSide.RIGHT) {
    if ((Math.abs(position.y + speed) - settings.paddleSize[name].y / 2) >= pongLogic.playArea.depth / 2) {
      return false;
    }
  } else {
    if ((Math.abs(position.x + speed) - settings.paddleSize[name].x / 2) >= pongLogic.playArea.width / 2) {
      return false;
    }
  }
  return true;
}



export function getRightSpeed(position, speed, settings, pongLogic) {
  let vector_speed = { x: 0, y: 0, z: 0 };
  if (checkBounderyPadle(settings, position, pongLogic, speed) == false) {
    return vector_speed;
  }
  switch (position) {
    case PlayerSide.LEFT:
      vector_speed = { x: 0, y: speed, z: 0 };
      break;
    case PlayerSide.RIGHT:
      vector_speed = { x: 0, y: -speed, z: 0 };
      break;
    case PlayerSide.TOP:
      vector_speed = { x: -speed, y: 0, z: 0 };
      break;
    case PlayerSide.BOTTOM:
      vector_speed = { x: speed, y: 0, z: 0 };
      break;
    default:
      console.error(`Unknown plauer side: ${position}`)
      break;
  }
  settings.paddleLoc[position] += speed;
  return vector_speed;
}

export function getRightRotation(name, gameScene) {
  let vector_speed;
  switch (name) {
    case PlayerSide.LEFT:
      gameScene.rotateAsset(name, 'x', Math.PI / 2);
      gameScene.rotateAsset(name, 'y', Math.PI / 2);
      break;
    case PlayerSide.RIGHT:
      gameScene.rotateAsset(name, 'x', - Math.PI / 2);
      gameScene.rotateAsset(name, 'y', Math.PI / 2);
      break;
    case PlayerSide.TOP:
      gameScene.rotateAsset(name, 'y', Math.PI / 2);
      break;
    case PlayerSide.BOTTOM:
      gameScene.rotateAsset(name, 'y', Math.PI / 2);
      break;
    default:
      console.error(`Unknown plauer side: ${name}`)
      break;
  }
}


export function SpawnPadle(init, name, assetsPath, map) {
  init.gameScene.loadModel(name, `${assetsPath}padle.glb`, (model) => {
    console.debug(`Padle ${name} loaded.`);

    init.gameScene.moveAsset(name, posSpawn(map, name));

    switch (name) {
      case PlayerSide.LEFT:
        init.gameScene.rotateAsset(name, 'x', Math.PI / 2);
        init.gameScene.rotateAsset(name, 'y', Math.PI / 2);
        break;
      case PlayerSide.RIGHT:
        init.gameScene.rotateAsset(name, 'x', Math.PI / 2);
        init.gameScene.rotateAsset(name, 'y', Math.PI / 2);
        break;
      case PlayerSide.TOP:
        init.gameScene.rotateAsset(name, 'x', Math.PI / 2);
        break;
      case PlayerSide.BOTTOM:
        init.gameScene.rotateAsset(name, 'x', Math.PI / 2);
        break;
      default:
        console.error(`Unknown player side: ${name}`)
        break;
    }

    init.assetsLoaded++;
  });
}

export function spawnPadles(settings, init, assetsPath) {
  settings.playerSide.forEach(Padle => {
    SpawnPadle(init, Padle, assetsPath, settings.mapStyle);
  });
}

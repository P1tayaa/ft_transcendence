
import { PlayerSide, MapStyle, Setting } from "../pongLogic/setting.js";

function posSpawn(map, position) {
  let distanceToCenter;
  let positionSpawn;
  switch (map) {
    case MapStyle.CLASSIC:
      distanceToCenter = 40;
      break;
    case MapStyle.BATH:
      distanceToCenter = 40;
      break;
    case MapStyle.CIRCLE:
      distanceToCenter = 40;
      break;
    case MapStyle.RECTANGLE:
      distanceToCenter = 40;
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
      positionSpawn = { x: 0, y: -distanceToCenter, z: 0 };
      break;
    case PlayerSide.BOTTOM:
      positionSpawn = { x: 0, y: distanceToCenter, z: 0 };
      break;
    default:
      console.error(`Unknown map style: ${PlayerSide}`)
      break;
  }



  return (positionSpawn)
}

export function getRightSpeed(position, speed) {
  let vector_speed;
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
  return vector_speed;
}




export function Padle(init, name, assetsPath, map, callback) {

  init.gameScene.loadModel(name, `${assetsPath}padle.glb`, (model) => {
    console.log('Paddle1 model loaded.');
    init.gameScene.moveAsset(name, posSpawn(map, name));
    init.gameScene.rotateAsset(name, 'x', Math.PI / 2);
    init.gameScene.rotateAsset(name, 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.checkAllAssetsLoaded(callback);
  });
}




export function spawnPadles(settings, init, assetsPath, callback) {
  if (settings.bots) {
    for (let i = 0; i < settings.botsSide.length; i++) {
      Padle(init, settings.botsSide[i], assetsPath, settings.mapStyle, callback)
    }
  }
  for (let i = 0; i < settings.playerSide.length; i++) {
    Padle(init, settings.playerSide[i], assetsPath, settings.mapStyle, callback)
  }
}





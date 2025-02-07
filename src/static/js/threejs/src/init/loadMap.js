// InitMapFunctions.js

import Init from '../init.js';  // Import Init class

// Define the individual map loading functions
export function loadClassicMap(assetsPath, callback, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}Floor.glb`, (model) => {
    console.log('Classic Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.checkAllAssetsLoaded(callback);  // Assuming this function is defined elsewhere
    init.pongLogic.playArea = { width: 100, height: 60 };
  });
};



// TODO:  need to be set 
export function loadBathMap(assetsPath, callback, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}BathFloor.glb`, (model) => {
    console.log('Bath Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.checkAllAssetsLoaded(callback);
  });
};

export function loadCircleMap(assetsPath, callback, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}CircleFloor.glb`, (model) => {
    console.log('Circle Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.checkAllAssetsLoaded(callback);
  });
};

export function loadRectangleMap(assetsPath, callback, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}RectangleFloor.glb`, (model) => {
    console.log('Rectangle Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.checkAllAssetsLoaded(callback);
  });
};

// InitMapFunctions.js
import * as THREE from 'three';
import Init from '../init.js';  // Import Init class

// Define the individual map loading functions
export function loadClassicMap(assetsPath, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}Floor.glb`, (model) => {
    console.log('Classic Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.pongLogic.playArea = { width: 100, depth: 60 };
  });
  const ambiantLight = new THREE.PointLight(BATHLIGHT, 10000, 10000)
  ambiantLight.position.set(120, -90, -6);
  init.gameScene.scene.add(ambiantLight);
};

const BATHLIGHT = 0xffffff;

// TODO:  need to be set 
export function loadBathMap(assetsPath, init) {
  // init.gameScene.loadCharacter('Floor', `${assetsPath}Bath.glb`, (model) => {
  init.gameScene.loadModel('Floor', `${assetsPath}Bath.glb`, (model) => {
    console.log('Bath Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -13 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
    init.pongLogic.playArea = { width: 100, depth: 60 };
  });
  const ambiantLight = new THREE.PointLight(BATHLIGHT, 10000, 10000)
  ambiantLight.position.set(120, -90, -6);
  init.gameScene.scene.add(ambiantLight);
};

export function loadBeachMap(assetsPath, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}beachMap.glb`, (model) => {
    console.log('beach Map model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 100, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
  });
  const ambiantLight = new THREE.PointLight(BATHLIGHT, 10000, 10000)
  ambiantLight.position.set(120, -90, -6);
  init.gameScene.scene.add(ambiantLight);
};

export function loadLavaMap(assetsPath, init) {
  init.gameScene.loadModel('Floor', `${assetsPath}Lava map.glb`, (model) => {
    console.log('Rectangle Floor model loaded.');
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
  });
  const ambiantLight = new THREE.PointLight(BATHLIGHT, 10000, 10000)
  ambiantLight.position.set(120, -90, -6);
  init.gameScene.scene.add(ambiantLight);
};

function loadMap(model, init) {
  init.gameScene.loadModel('Floor', model, (model) => {
    console.log(`${model} model loaded.`);
    init.gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });
    init.gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
    init.gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
    init.assetsLoaded++;
  });
}

export default loadMap;
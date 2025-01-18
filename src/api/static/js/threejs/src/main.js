import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GameScene from './modelLoading/loadgltf.js'
import Pong from './pongLogic/pong.js'
const assets_path = "http://localhost:8000" + "/static/glfw/"
// const loader = new GLTFLoader();
/* loader.load(assets_path + 'Floor.glb',
  function (gltf) { scene.add(gltf.scene); },
  undefined, function (error) { console.error(error); });
*/
let assets_loaded = 0;

const gameScene = new GameScene();
gameScene.loadModel('Floor', assets_path + 'Floor.glb', (model) => {
  console.log('Floor model loaded.');

  gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });

  gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
  gameScene.rotateAsset('Floor', 'y', Math.PI / 2);
  assets_loaded++;
});

const scene = gameScene.getScene();
const light = new THREE.PointLight(0xffffff, 100, 10000);
light.position.set(0, 0, 0);
scene.add(light);


const light_padle1 = new THREE.PointLight(0xffffff, 100, 10000);
light_padle1.position.set(-40, 0, 5);
scene.add(light_padle1);


const light_padle2 = new THREE.PointLight(0xffffff, 100, 10000);
light_padle2.position.set(40, 0, 5);
scene.add(light_padle2);



gameScene.loadModel('Padle1', assets_path + '/padle.glb', (model) => {
  console.log('pable1 model loaded.');

  gameScene.moveAsset('Padle1', { x: -40, y: 0, z: 0 });

  gameScene.rotateAsset('Padle1', 'x', Math.PI / 2);
  gameScene.rotateAsset('Padle1', 'y', Math.PI / 2);
  assets_loaded++;
});

gameScene.loadModel('Padle2', assets_path + '/padle.glb', (model) => {
  console.log('Pable2 model loaded.');

  gameScene.moveAsset('Padle2', { x: 40, y: 0, z: 0 });

  gameScene.rotateAsset('Padle2', 'x', Math.PI / 2);
  gameScene.rotateAsset('Padle2', 'y', Math.PI / 2);
  assets_loaded++;
});


gameScene.loadModel('Ball', assets_path + '/Ball.glb', (model) => {
  console.log('Ball model loaded.');

  gameScene.moveAsset('Ball', { x: 0, y: 0, z: 0 });

  gameScene.rotateAsset('Ball', 'x', Math.PI / 2);
  gameScene.rotateAsset('Ball', 'y', Math.PI / 2);
  assets_loaded++;
});


document.addEventListener('DOMContentLoaded', () => {

  const canvas = document.getElementById('pong-game'); // Get the canvas by its ID
  if (!canvas) {
    console.error('Canvas element with id "pong-game" not found.');
    return;
  }
  const renderer = new THREE.WebGLRenderer({ canvas }); // Use the specified canvas
  renderer.setSize(canvas.clientWidth, canvas.clientHeight); // Use the size of the canvas element
  const camera = new THREE.PerspectiveCamera(120, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);


  let PongLogic = new Pong();




  camera.position.z = 30;

  let leftPaddleSpeed = 0;
  let rightPaddleSpeed = 0;

  function onKeyDown(event) {
    if (event.key === 'w') {
      leftPaddleSpeed = 0.1;
    } else if (event.key === 's') {
      leftPaddleSpeed = -0.1;
    }

    if (event.key === 'ArrowUp') {
      rightPaddleSpeed = 0.1;
    } else if (event.key === 'ArrowDown') {
      rightPaddleSpeed = -0.1;
    }
  }

  function onKeyUp(event) {
    if (event.key === 'w' || event.key === 's') {
      leftPaddleSpeed = 0;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      rightPaddleSpeed = 0;
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);




  function animate() {
    if (assets_loaded != 4) {
      console.log("not loaded");
      return;
    }
    gameScene.moveAssetBy('Padle1', { x: 0, y: leftPaddleSpeed, z: 0, })

    gameScene.moveAssetBy('Padle2', { x: 0, y: rightPaddleSpeed, z: 0, })
    PongLogic.checkCollisions(gameScene.getAssetPossition('Padle1'), gameScene.getAssetPossition('Padle2'), gameScene.getAssetPossition('Ball'));
    let ballCurBallSpeed = { x: PongLogic.ballSpeed.x, y: PongLogic.ballSpeed.y, z: 0 }
    gameScene.moveAssetBy('Ball', ballCurBallSpeed)
    // not that that is to ask the user to print the bage apparently  print(ballCurBallSpeed)

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});

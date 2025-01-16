import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GameScene from './modelLoading/loadgltf.js'
import Pong from './pongLogic/pong.js'

const loader = new GLTFLoader();
loader.load('../public/assets/Floor.glb',
  function (gltf) { scene.add(gltf.scene); },
  undefined, function (error) { console.error(error); });

let assets_loaded = 0;

const gameScene = new GameScene();
gameScene.loadModel('Floor', '../public/assets/Floor.glb', (model) => {
  console.log('Floor model loaded.');

  gameScene.moveAsset('Floor', { x: 0, y: 0, z: -3 });

  gameScene.rotateAsset('Floor', 'x', Math.PI / 2);
  gameScene.rotateAsset('floor', 'y', math.pi / 2);
  assets_loaded++;
});

const scene = gamescene.getscene();
const light = new three.pointlight(0xffffff, 100, 10000);
light.position.set(0, 0, 0);
scene.add(light);


const light_padle1 = new three.pointLight(0xffffff, 100, 10000);
light_padle1.position.set(-40, 0, 5);
scene.add(light_padle1);


const light_padle2 = new THREE.PointLight(0xffffff, 100, 10000);
light_padle2.position.set(40, 0, 5);
scene.add(light_padle2);



gameScene.loadModel('Padle1', '../public/assets/padle.glb', (model) => {
  console.log('pable1 model loaded.');

  gameScene.moveAsset('Padle1', { x: -40, y: 0, z: 0 });

  gameScene.rotateAsset('Padle1', 'x', Math.PI / 2);
  gameScene.rotateAsset('Padle1', 'y', Math.PI / 2);
  assets_loaded++;
});

gameScene.loadModel('Padle2', '../public/assets/padle.glb', (model) => {
  console.log('Pable2 model loaded.');

  gameScene.moveAsset('Padle2', { x: 40, y: 0, z: 0 });

  gameScene.rotateAsset('Padle2', 'x', Math.PI / 2);
  gameScene.rotateAsset('Padle2', 'y', Math.PI / 2);
  assets_loaded++;
});


gameScene.loadModel('Ball', '../public/assets/Ball.glb', (model) => {
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


  //const renderer = new THREE.WebGLRenderer();
  //renderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild(renderer.domElement);

  const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, metalness: 0.5, roughness: 0.5 });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  scene.add(ball);

  const paddleGeometry = new THREE.BoxGeometry(1, 0.1, 3); // Paddle size
  const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.5 });
  const leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
  const rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
  scene.add(leftPaddle);
  scene.add(rightPaddle);

  leftPaddle.position.x = -8;
  rightPaddle.position.x = 8;

  rightPaddle.rotation.x = 1.5;
  leftPaddle.rotation.x = 1.5;
  leftPaddle.position.y = 0;
  rightPaddle.position.y = 0;



  const wallGeometry = new THREE.BoxGeometry(30, 0.2, 10);
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  scene.add(rightWall);
  scene.add(leftWall);


  rightWall.rotation.z = Math.PI / 2;
  leftWall.rotation.z = Math.PI / 2;

  rightWall.position.x = 15;
  leftWall.position.x = -15;

  const topWall = new THREE.Mesh(wallGeometry, wallMaterial);
  const bottomWall = new THREE.Mesh(wallGeometry, wallMaterial);
  scene.add(topWall);
  scene.add(bottomWall);


  topWall.rotation.y = - Math.PI;
  bottomWall.rotation.y = - Math.PI;


  topWall.position.y = 15;
  bottomWall.position.y = -15;


  let PongLogic = new Pong();




  camera.position.z = 30;

  const multi_side_push = 0.1;
  const y_speed_cap = 0.7;

  let ballSpeed = new THREE.Vector3(0.1, 0.05, 0); // Ball speed in x, y, z directions

  function checkCollisions() {
    const ballBox = new THREE.Box3().setFromObject(ball);
    const leftPaddleBox = new THREE.Box3().setFromObject(leftPaddle);
    const rightPaddleBox = new THREE.Box3().setFromObject(rightPaddle);
    const rightWallbox = new THREE.Box3().setFromObject(rightWall);
    const leftWallbox = new THREE.Box3().setFromObject(leftWall);
    const topWallbox = new THREE.Box3().setFromObject(topWall);
    const bottomWallbox = new THREE.Box3().setFromObject(bottomWall);

    if (ballBox.intersectsBox(leftPaddleBox)) {
      ballSpeed.x = Math.abs(ballSpeed.x);
      ballSpeed.y += (ball.position.y - leftPaddle.position.y) * multi_side_push;
    }
    if (ballBox.intersectsBox(leftWallbox)) {
      ballSpeed.x = Math.abs(ballSpeed.x);
    }

    if (ballBox.intersectsBox(rightWallbox)) {
      ballSpeed.x = -Math.abs(ballSpeed.x);
    }

    if (ballBox.intersectsBox(rightPaddleBox)) {
      ballSpeed.x = -Math.abs(ballSpeed.x);
      ballSpeed.y += (ball.position.y - rightPaddle.position.y) * multi_side_push;
    }

    if (ballBox.intersectsBox(topWallbox)) {
      ballSpeed.y = - Math.abs(ballSpeed.y);
    }

    if (ballBox.intersectsBox(bottomWallbox)) {
      ballSpeed.y = Math.abs(ballSpeed.y);
    }

    if (Math.abs(ballSpeed.y) > y_speed_cap) {
      if (ballSpeed.y < 0) {
        ballSpeed.y = -y_speed_cap;
      } else {
        ballSpeed.y = -y_speed_cap;
      }
    }

    if (ball.position.x >= 150 || ball.position.x <= -150) {
      ball.position.set(0, 0, 0); // Reset ball to center
      ballSpeed.set(0.1, 0.05, 0); // Reset ball speed
    }
  }


  function dumpAi() {
    if (ball.position.y < leftPaddle.position.y) {
      leftPaddleSpeed = -0.1;
    } else if (ball.position.y > leftPaddle.position.y) {
      leftPaddleSpeed = 0.1;
    }
  }


  // Paddle movement (using keyboard input)
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
    if (assets_loaded != 4) return;
    dumpAi();
    gameScene.moveAssetBy('Padle1', { x: 0, y: leftPaddleSpeed, z: 0, })

    gameScene.moveAssetBy('Padle2', { x: 0, y: rightPaddleSpeed, z: 0, })
    leftPaddle.position.y += leftPaddleSpeed;
    rightPaddle.position.y += rightPaddleSpeed;

    PongLogic.checkCollisions(gameScene.getAssetPossition('Padle1'), gameScene.getAssetPossition('Padle2'), gameScene.getAssetPossition('Ball'));
    let ballCurBallSpeed = { x: PongLogic.ballSpeed.x, y: PongLogic.ballSpeed.y, z: 0 }
    ball.position.add(ballCurBallSpeed);
    gameScene.moveAssetBy('Ball', ballCurBallSpeed)
    console.log(ballCurBallSpeed)
    // not that that is to ask the user to print the bage apparently  print(ballCurBallSpeed)

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
});

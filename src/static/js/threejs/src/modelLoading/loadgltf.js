// Import necessary modules from Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class GameScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.loader = new GLTFLoader();
    this.assets = {}; // Store loaded assets for easy access
  }

  // Method to load a GLTF model using fetch
  async loadModel(name, url, onLoadCallback = null, onErrorCallback = null) {
    try {
      // Fetch the GLB file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch the model: ${response.statusText}`);
      }

      // Read the response as an ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();

      this.loader.parse(
        arrayBuffer,
        '',
        (gltf) => {
          const model = gltf.scene;
          model.name = name;
          this.scene.add(model);
          this.assets[name] = model;

          if (onLoadCallback) {
            onLoadCallback(model);
          }
        },
        (error) => {
          console.error(`An error occurred while parsing the model: ${url}`, error);
          if (onErrorCallback) {
            onErrorCallback(error);
          }
        }
      );
    } catch (error) {
      console.error(`An error occurred while fetching the model: ${url}`, error);
      if (onErrorCallback) {
        onErrorCallback(error);
      }
    }
  }

  setScale(name, scale) {
    const asset = this.assets[name];
    if (asset) {
      asset.scale.set(scale, scale, scale);
    } else {
      console.warn(`Asset with name "${name}" not found.`);
    }
  }


  // Method to move a specific asset
  moveAsset(name, position) {
    const asset = this.assets[name];
    if (asset) {
      asset.position.set(position.x, position.y, position.z);
    } else {
      console.warn(`Asset with name "${name}" not found.`);
    }
  }
  moveAssetBy(name, position) {
    const asset = this.assets[name];
    if (asset) {
      asset.position.set(asset.position.x + position.x, asset.position.y + position.y, asset.position.z + position.z);
    } else {
      console.warn(`Asset with name "${name}" not found.`);
    }
  }
  // Method to rotate a specific asset
  rotateAsset(name, axis, angle) {
    const asset = this.assets[name];
    if (asset) {
      const rotationAxis = new THREE.Vector3();
      switch (axis.toLowerCase()) {
        case 'x':
          rotationAxis.set(1, 0, 0);
          break;
        case 'y':
          rotationAxis.set(0, 1, 0);
          break;
        case 'z':
          rotationAxis.set(0, 0, 1);
          break;
        default:
          console.warn('Invalid axis. Use "x", "y", or "z".');
          return;
      }
      asset.rotateOnAxis(rotationAxis, angle);
    } else {
      console.warn(`Asset with name "${name}" not found.`);
    }
  }

  doRender(name, render) {
    this.assets[name].visible = render;
  }

  getAssetPossition(name) {
    const asset = this.assets[name];
    if (asset) {
      return asset.position;
    } else {
      console.warn(`Asset with name "${name}" not found.`);
    }
  }

  // Method to get the Three.js scene
  getScene() {
    return this.scene;
  }
}



export default GameScene;

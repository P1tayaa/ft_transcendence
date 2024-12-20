// Import necessary modules from Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class GameScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.loader = new GLTFLoader();
        this.assets = {}; // Store loaded assets for easy access
    }

    // Method to load a GLTF model
    loadModel(name, modelPath, onLoadCallback = null, onErrorCallback = null) {
        this.loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;
                model.name = name;
                this.scene.add(model);
                this.assets[name] = model;
                if (onLoadCallback) onLoadCallback(model);
            },
            undefined,
            (error) => {
                console.error(`An error occurred while loading the model: ${modelPath}`, error);
                if (onErrorCallback) onErrorCallback(error);
            }
        );
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

    // Method to get the Three.js scene
    getScene() {
        return this.scene;
    }
}



export default GameScene;

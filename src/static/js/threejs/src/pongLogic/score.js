

import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { PlayerSide } from '../pongLogic/setting.js'

class Score {
  constructor(scene, playerSides) {
    this.scene = scene;
    this.playerSides = playerSides;
    this.scores = {}; // Stores scores dynamically
    this.scoreMeshes = {}; // Stores score meshes dynamically
    this.fontLoader = new FontLoader();
    this.textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Load font and initialize score display
    this.fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      this.font = font;
      this.initializeScores();
    });
  }

  // Initialize scores for active players
  initializeScores() {
    this.playerSides.forEach(side => {
      this.scores[side] = 0; // Initialize score
      this.scoreMeshes[side] = this.createScoreMesh(side);
      this.scene.add(this.scoreMeshes[side]);
    });
  }

  // Create a score mesh
  createScoreMesh(side) {
    const geometry = new TextGeometry(this.scores[side].toString(), {
      font: this.font,
      size: 2,
      height: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, this.textMaterial);
    mesh.position.copy(this.getScorePosition(side)); // Set position dynamically
    return mesh;
  }

  // Get score position based on the player's side
  getScorePosition(side) {
    const positions = {
      [PlayerSide.LEFT]: new THREE.Vector3(-15, 25, 0),
      [PlayerSide.RIGHT]: new THREE.Vector3(15, 25, 0),
      [PlayerSide.TOP]: new THREE.Vector3(0, -30, 0),
      [PlayerSide.BOTTOM]: new THREE.Vector3(0, 30, 0),
    };
    return positions[side] || new THREE.Vector3(0, 0, 0);
  }

  // Update a player's score display
  updateScoreDisplay(side) {
    this.scene.remove(this.scoreMeshes[side]); // Remove old mesh

    this.scoreMeshes[side] = this.createScoreMesh(side);
    this.scene.add(this.scoreMeshes[side]);
  }

  // Increment a player's score
  incrementScore(side) {
    if (this.scores[side] !== undefined) {
      this.scores[side] += 1;
      this.updateScoreDisplay(side);
    }
  }

  // Reset all scores
  resetScores() {
    Object.keys(this.scores).forEach(side => {
      this.scores[side] = 0;
      this.updateScoreDisplay(side);
    });
  }
}

export default Score;


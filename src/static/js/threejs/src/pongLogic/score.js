
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

class Score {
  constructor(scene) {
    this.scene = scene;
    this.player1Score = 0;
    this.player2Score = 0;

    this.fontLoader = new FontLoader();

    // Text materials
    this.textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Placeholder for score meshes
    this.player1ScoreMesh = null;
    this.player2ScoreMesh = null;

    // Load font and initialize score display
    this.fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      this.font = font;
      this.createScoreDisplay();
    });
  }

  // Create initial score display
  createScoreDisplay() {
    const player1ScoreGeometry = new TextGeometry(this.player1Score.toString(), {
      font: this.font,
      size: 2,
      height: 0.1,
    });

    const player2ScoreGeometry = new TextGeometry(this.player2Score.toString(), {
      font: this.font,
      size: 2,
      height: 0.1,
    });

    this.player1ScoreMesh = new THREE.Mesh(player1ScoreGeometry, this.textMaterial);
    this.player2ScoreMesh = new THREE.Mesh(player2ScoreGeometry, this.textMaterial);

    // Position the scores
    this.player1ScoreMesh.position.set(-15, 25, 0); // Top-left
    this.player2ScoreMesh.position.set(15, 25, 0);  // Top-right

    this.scene.add(this.player1ScoreMesh);
    this.scene.add(this.player2ScoreMesh);
  }

  // Update score display
  updateScoreDisplay() {
    // Remove old meshes
    this.scene.remove(this.player1ScoreMesh);
    this.scene.remove(this.player2ScoreMesh);

    // Create new score geometries
    const player1ScoreGeometry = new TextGeometry(this.player1Score.toString(), {
      font: this.font,
      size: 2,
      height: 0.1,
    });

    const player2ScoreGeometry = new TextGeometry(this.player2Score.toString(), {
      font: this.font,
      size: 2,
      height: 0.1,
    });

    // Update score meshes
    this.player1ScoreMesh = new THREE.Mesh(player1ScoreGeometry, this.textMaterial);
    this.player2ScoreMesh = new THREE.Mesh(player2ScoreGeometry, this.textMaterial);

    // Reposition the updated scores
    this.player1ScoreMesh.position.set(-15, 25, 0);
    this.player2ScoreMesh.position.set(15, 25, 0);

    this.scene.add(this.player1ScoreMesh);
    this.scene.add(this.player2ScoreMesh);
  }

  // Increment player scores
  incrementPlayer1Score() {
    this.player1Score += 1;
    this.updateScoreDisplay();
  }

  incrementPlayer2Score() {
    this.player2Score += 1;
    this.updateScoreDisplay();
  }

  // Reset scores
  resetScores() {
    this.player1Score = 0;
    this.player2Score = 0;
    this.updateScoreDisplay();
  }
}

export default Score;


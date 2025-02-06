import * as THREE from 'three';
import Init from "../init.js";

const PowerUpType = {
    Star: "star.glf",
    Snail: "snail.glf",
    SpeedUp: "speedup.glf",
    Grow: "grow.glf",
    Magnette: "magnette.glf",
};

const offScreen = {x : 200, y: 200, z:200};

function initPowerUp(assetsPath, gameScene) {
    for (const type in PowerUpType) {
        const modelFile = PowerUpType[type];  
        const modelName = type;

        gameScene.loadModel(modelName, `${assetsPath}${modelFile}`, (model) => {
            console.log(`${modelName} model loaded.`);
            gameScene.moveAsset(modelName, offScreen);
            // gameScene.rotateAsset(modelName, 'y', Math.PI / 2);
        });
    }
}


const PowerUpEffect = (paddle) => {}; 


class PowerUp {

    constructor(type, effect) {
        this.size = { x: 1, y: 1 };
        this.speed = { x: 0.2, y: 0 };
        this.type = type;
        this.effect = effect;
    }

    update() {
        this.x += this.speed.x;
        this.y += this.speed.y;
    }

    activateEffect(paddle) {
        this.effect(paddle);  // Call the effect function
    }
}

const starEffect = (paddle) => {
    console.log("Star power-up activated!");
    paddle.size += 10;
};

const snailEffect = (paddle) => {
    console.log("Snail power-up activated!");
    paddle.speed = Math.max(paddle.speed - 0.1, 0.1);
};

const speedUpEffect = (paddle) => {
    console.log("Speed-up power-up activated!");
    paddle.speed += 0.1;
};

const growEffect = (paddle) => {
    console.log("Grow power-up activated!");
    paddle.size += 20;
};

// Now create instances of PowerUps with their respective effects
const starPowerUp = new PowerUp(PowerUpType.Star, starEffect);
const snailPowerUp = new PowerUp(PowerUpType.Snail, snailEffect);
const speedUpPowerUp = new PowerUp(PowerUpType.SpeedUp, speedUpEffect);
const growPowerUp = new PowerUp(PowerUpType.Grow, growEffect);
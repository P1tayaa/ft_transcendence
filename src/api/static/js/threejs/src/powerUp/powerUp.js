import * as THREE from 'three';
import Init from "../init.js";

// const PowerUpType = {
//     Star: "star.glf",
//     Snail: "snail.glf",
//     SpeedUp: "speedup.glf",
//     Grow: "grow.glf",
//     Magnette: "magnette.glf",
// };


const PowerUpType = {
    Star: "Ball.glf",
    Snail: "Ball.glf",
    SpeedUp:"Ball.glf",
    Grow:"Ball.glf" ,
    Magnette:"Ball.glf",
};

// PowerUpRegistry stores all power-ups
export const PowerUpRegistry = {
    Star: new PowerUp(PowerUpType.Star, starEffect, simple_slide),
    Snail: new PowerUp(PowerUpType.Snail, snailEffect, simple_slide),
    SpeedUp: new PowerUp(PowerUpType.SpeedUp, speedUpEffect, simple_slide),
    Grow: new PowerUp(PowerUpType.Grow, growEffect, simple_slide)
};

const offScreen = {x : 200, y: 200, z:200};
const simple_slide_speed = {x: 0.2, y: 0.1};
const PowerUpStartPos = {x:0, y:0, z:0};

export function initPowerUp(assetsPath, gameScene) {
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
const PowerUpDisplacement = (speed, location) => {}; 

class PowerUp {

    constructor(type, effect, displacement) {
        this.size = { x: 1, y: 1 };
        this.speed = { x: 0.2, y: 0 };
        this.type = type;
        this.effect = effect;
        this.active = false;
        this.displacement = displacement;
        this.position = {x :0, y:0};
    }

    update(scene) {
        if (!this.active)
            return;
        this.displacement(this.speed, this.position);
        scene.doRender(this.type, true);
        scene.moveAsset(this.type, this.position)
    }

    init(scene) {
        this.active = true;
        this.position.x = PowerUpStartPos.x; 
        this.position.y = PowerUpStartPos.y;
        scene.moveAsset(this.type, PowerUpStartPos)
    }


    activateEffect(paddle, scene) {
        this.active = false;
        scene.doRender(this.type, false);
        this.effect(paddle);
        scene.moveAsset(this.type, offScreen)
    }
}

const simple_slide = (speed, location) => {
    if (speed.x == 0 && speed.y == 0)
        speed = simple_slide_speed (Math.random() < 0.5 ? -1 : 1); 
    location += speed;
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

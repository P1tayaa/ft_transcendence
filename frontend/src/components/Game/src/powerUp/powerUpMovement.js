

const SIMPLESLIDESPEED = { x: 0.2, y: 0.1 };

export const bouncing_slide = (speed, location, scene) => {
  if (speed.x === 0 && speed.y === 0) {
    let rand = Math.random() < 0.5 ? -1 : 1;
    speed.x = SIMPLESLIDESPEED.x * rand;
    speed.y = SIMPLESLIDESPEED.y * rand;
  }

  location.x += speed.x;
  location.y += speed.y;

  if (location.x <= (- scene.width / 2) || location.x >= scene.width / 2) {
    speed.x *= -1;
  }
  if (location.y <= (- scene.depth / 2) || location.y >= scene.depth / 2) {
    speed.y *= -1;
  }
};

let angle = 0;
export const circular_path = (speed, location, scene) => {
  const radius = Math.min(scene.width, scene.depth) / 4;
  angle += 0.007;
  location.x = Math.cos(angle) * radius;
  location.y = Math.sin(angle) * radius;
};


let step = 0;
let target = { x: 0, y: -5 };

export const star_path = (speed, location, scene) => {
  const scale = Math.min(scene.width, scene.depth) / 12;
  const points = [
    { x: 0, y: -5 * scale },
    { x: 4 * scale, y: 3 * scale },
    { x: -4 * scale, y: 3 * scale },
    { x: 4 * scale, y: -3 * scale },
    { x: -4 * scale, y: -3 * scale },
  ];

  // Calculate direction to target
  let dx = target.x - location.x;
  let dy = target.y - location.y;
  let distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 0.5) {
    step = (step + 1) % points.length;
    target = points[step];
  } else {
    let moveSpeed = 0.1;
    location.x += (dx / distance) * moveSpeed;
    location.y += (dy / distance) * moveSpeed;
  }
};

export const random_movement = (speed, location) => {
  location.x += (Math.random() - 0.5) * 10;
  location.y += (Math.random() - 0.5) * 10;
};



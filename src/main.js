import {
  checkAndResolveCollision,
  checkCollision,
  createPhysicsEntity,
  velocityVerlet,
} from "./features/rigidBodyDynamics.js";
import { pathInterpolate, createArcLengthTable, samplePath } from "./features/PathInterpol.js";
import { randomAngularVelocity, randomPosition, randomVelocity, randomAsteroidSize } from "./random.js";
import * as renderer from "./renderer/2d.js";

// in kg
const BULLET_MASS = 100;
const SPACESHIP_MASS = 100;
const ASTEROID_MASS = 1000;
const ROCKET_PIERCING = 3;
const ROCKET_VELOCITY = 300;

const calculateAsteroidMass = (radius) => {
  const density = 3.5;
  return (4 / 3) * Math.PI * radius ** 3 * density;
};

// game state
let paused = false;

// DOM elements
let canvas = document.getElementsByTagName("canvas")[0];
let entityCountView = document.getElementById("entity-count");
let fpsView = document.getElementById("fps");
let upsView = document.getElementById("ups");
let targetFpsView = document.getElementById("target-fps");
let targetUpsView = document.getElementById("target-ups");
let menuView = document.getElementById("menu");
let pauseResumeButton = document.getElementById("pause-resume");
let debugVelocityCheckbox = document.getElementById("debug-velocity");
let debugDrawHitboxes = document.getElementById("debug-hitbox");
let debugDrawTrajectory = document.getElementById("debug-trajectory");
let fireRateView = document.getElementById("fire-rate");
let hpView = document.getElementById("hp");

let desired_delta_time = 1000 / 120;
let desired_frame_time = 1000 / 60;

let lastFrameTime = 0;
let lastUpdateTime = 0;
let lastSummaryTime = 0;

// statistics
let updatesLastSecond = 0;
let framesLastSecond = 0;

// entities
let asteroids = [];
let bullets = [];
let rockets = [];
let spaceship = null;

// shooting
let shootingBullets = false;
let lastBulletTime = 0;
let bulletCooldown = 20; // in ms

// rockets
let shootingRockets = false;
let rocketCooldown = 1000; // in ms
let lastRocketTime = 0;

let movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const main = () => {
  renderer.init();
  lastFrameTime = performance.now();
  lastSummaryTime = lastFrameTime;

  setupInput();

  addSpaceship({ x: canvas.width / 2, y: canvas.height / 2 }, 0, { x: 0, y: 0 }, 0);

  // TDOD: do this in a more game-like way. This is a placeholder
  setInterval(() => {
    if (asteroids.length < 10) {
      addAsteroid(
        randomPosition(),
        0,
        { x: 0, y: 0 },
        randomVelocity(0.1 * Math.random() + 0.01),
        randomAngularVelocity(0.001),
        randomAsteroidSize()
      );
    }
  }, 100);

  initUI();

  // renderer.setVelocityDrawing(true);
  requestAnimationFrame(doFrame);
};

let bulletIndex = 0;
let now = performance.now();

const setupInput = () => {
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Escape":
        togglePause();
        break;
      case " ":
        shootingBullets = true;
        break;
      case "q":
        shootingRockets = true;
        break;
      case "ArrowUp":
      case "w":
        movement.forward = true;
        break;
      case "ArrowDown":
      case "s":
        movement.backward = true;
        break;
      case "ArrowLeft":
      case "a":
        movement.left = true;
        break;
      case "ArrowRight":
      case "d":
        movement.right = true;
        break;
    }
  });

  document.addEventListener("keyup", (event) => {
    switch (event.key) {
      case " ":
        shootingBullets = false;
        break;
      case "q":
        shootingRockets = false;
        break;
      case "ArrowUp":
      case "w":
        movement.forward = false;
        break;
      case "ArrowDown":
      case "s":
        movement.backward = false;
        break;
      case "ArrowLeft":
      case "a":
        movement.left = false;
        break;
      case "ArrowRight":
      case "d":
        movement.right = false;
        break;
    }
  });

  document.addEventListener("mousemove", (event) => {
    const x_canvas = event.clientX - canvas.getBoundingClientRect().left;
    const y_canvas = event.clientY - canvas.getBoundingClientRect().top;

    // set rotation of spaceship to face cursor
    if (spaceship) {
      const dx = x_canvas - spaceship.position.x;
      const dy = y_canvas - spaceship.position.y;
      spaceship.rotation = Math.atan2(dy, dx);
    }
  });

  targetFpsView.addEventListener("change", (event) => {
    desired_frame_time = 1000 / Number(event.target.value);
  });

  targetUpsView.addEventListener("change", (event) => {
    desired_delta_time = 1000 / Number(event.target.value);
  });

  debugVelocityCheckbox.addEventListener("change", (event) => {
    renderer.setVelocityDrawing(event.target.checked);
  });

  debugDrawHitboxes.addEventListener("change", (event) => {
    renderer.setDrawHitboxes(event.target.checked);
  });

  debugDrawTrajectory.addEventListener("change", (event) => {
    renderer.setDrawTrajectory(event.target.checked);
  });

  pauseResumeButton.addEventListener("click", togglePause);
};

const initUI = () => {
  fireRateView.innerText = `${Math.round(1000 / bulletCooldown)}`;
};

const doFrame = () => {
  now = performance.now();

  // updates
  while (lastUpdateTime + desired_delta_time / 2 <= now) {
    if (!paused) {
      update(desired_delta_time);
      ++updatesLastSecond;
    }
    lastUpdateTime += desired_delta_time;
  }

  // render
  if (lastFrameTime + desired_frame_time / 2 <= now) {
    if (!paused) {
      renderer.render();
      ++framesLastSecond;
    }
    lastFrameTime = now;
  }

  if (now - lastSummaryTime >= 1000) {
    entityCountView.innerText = `${asteroids.length + bullets.length + rockets.length + (spaceship ? 1 : 0)}`;
    fpsView.innerText = `${framesLastSecond}`;
    upsView.innerText = `${updatesLastSecond}`;

    framesLastSecond = 0;
    updatesLastSecond = 0;

    lastSummaryTime = now;
  }

  // framerate is controlled by the browser
  requestAnimationFrame(doFrame);
};

const processEvents = (deltaTime) => {
  // bullets
  if (shootingBullets && now - lastBulletTime >= bulletCooldown && spaceship) {
    const rotation = spaceship.rotation + (Math.random() - 0.5) * 0.1;
    const leftOffset = {
      x: 10 * Math.cos(rotation + Math.PI / 2),
      y: 10 * Math.sin(rotation + Math.PI / 2),
    };
    const rightOffset = {
      x: 10 * Math.cos(rotation - Math.PI / 2),
      y: 10 * Math.sin(rotation - Math.PI / 2),
    };
    if (bulletIndex % 2 === 0) {
      addBullet(
        {
          x: spaceship.position.x + leftOffset.x,
          y: spaceship.position.y + leftOffset.y,
        },
        rotation,
        { x: Math.cos(rotation), y: Math.sin(rotation) },
        0
      );
    } else {
      addBullet(
        {
          x: spaceship.position.x + rightOffset.x,
          y: spaceship.position.y + rightOffset.y,
        },
        rotation,
        { x: Math.cos(rotation), y: Math.sin(rotation) },
        0
      );
    }
    const audioHit = new Audio("/hit.mp3");
    audioHit.volume = 0.05;
    audioHit.play();
    bulletIndex++;
    lastBulletTime = now;
  }

  // bullets
  if (shootingRockets && now - lastRocketTime >= rocketCooldown && spaceship) {
    const targets = [
      {
        position: {
          x: spaceship.position.x - Math.cos(spaceship.rotation) * 100,
          y: spaceship.position.y - Math.sin(spaceship.rotation) * 100,
        },
      },
      {
        position: {
          x: spaceship.position.x,
          y: spaceship.position.y,
        },
      },
    ];
    for (let i = 0; i < ROCKET_PIERCING; i++) {
      const asteroid = asteroids[Math.floor(Math.random() * asteroids.length)];
      asteroid.frozen = true;
      asteroid.velocity.x = 0;
      asteroid.velocity.y = 0;
      targets.push(asteroid);
    }
    targets.push(spaceship);
    // last point as ship. Doesn't really matter.
    // only affects the curvature towards the last actual target

    addRocket(
      {
        x: spaceship.position.x,
        y: spaceship.position.y,
      },
      spaceship.rotation,
      {
        x: Math.cos(spaceship.rotation) * 0.2,
        y: Math.sin(spaceship.rotation) * 0.2,
      },
      0,
      targets
    );

    lastRocketTime = now;
  }

  // movement
  if (spaceship) {
    if (movement.forward) {
      spaceship.force.y -= 0.0005 * deltaTime;
    }
    if (movement.backward) {
      spaceship.force.y += 0.0005 * deltaTime;
    }
    if (movement.left) {
      spaceship.force.x -= 0.0005 * deltaTime;
    }
    if (movement.right) {
      spaceship.force.x += 0.0005 * deltaTime;
    }
  }
};

const outOfBounds = (position) => {
  const padding = 50;
  return (
    position.x < 0 - padding ||
    position.x > canvas.width + padding ||
    position.y < 0 - padding ||
    position.y > canvas.height + padding
  );
};

const update = (deltaTime) => {
  processEvents(deltaTime);

  for (const asteroid of asteroids) {
    velocityVerlet(asteroid, deltaTime);
    if (outOfBounds(asteroid.position)) {
      asteroid.remove = true;
    }

    for (const asteroid2 of asteroids) {
      if (asteroid !== asteroid2) {
        checkAndResolveCollision(asteroid, asteroid2, 1, true);
      }
    }

    // wrap around
    // asteroid.position.x = (asteroid.position.x + canvas.width) % canvas.width;
    // asteroid.position.y = (asteroid.position.y + canvas.height) % canvas.height;
  }

  for (const bullet of bullets) {
    velocityVerlet(bullet, deltaTime);
    if (outOfBounds(bullet.position)) {
      bullet.remove = true;
    }
    for (const asteroid of asteroids) {
      if (checkAndResolveCollision(bullet, asteroid, 1, false)) {
        bullet.remove = true;
        asteroid.hp -= 1;
        if (asteroid.hp <= 0) {
          asteroid.remove = true;
        }
      }
    }
  }

  for (const rocket of rockets) {
    rocket.progress += (deltaTime / 1000) * ROCKET_VELOCITY;
    pathInterpolate(rocket, rocket.progress);
  }

  velocityVerlet(spaceship, deltaTime);
  for (const asteroid of asteroids) {
    if (checkAndResolveCollision(spaceship, asteroid, 1, true)) {
      spaceship.hp -= 1;
      if (spaceship.hp >= 0) {
        hpView.children.item(spaceship.hp).style.color = "grey";
      }
      if (spaceship.hp <= 0) {
        // TODO: game over
      }
    }
  }

  // automatic brake
  if (!movement.forward && !movement.backward && !movement.left && !movement.right) {
    spaceship.velocity.x *= 0.99;
    spaceship.velocity.y *= 0.99;
  }

  if (spaceship.position.x < 0 || spaceship.position.x > canvas.width) {
    spaceship.position.x = Math.max(0, Math.min(spaceship.position.x, canvas.width));
    spaceship.velocity.x *= -1;
  }

  if (spaceship.position.y < 0 || spaceship.position.y > canvas.height) {
    spaceship.position.y = Math.max(0, Math.min(spaceship.position.y, canvas.height));
    spaceship.velocity.y *= -1;
  }

  cleanUpEntities(asteroids);
};

const cleanUpEntities = () => {
  // TODO: clean up entity removal. very clumsy atm.
  // remove entities that are out of bounds
  asteroids.forEach((asteroid) => {
    if (asteroid.remove) {
      renderer.removeEntity(renderer.ASTEROID, asteroid.id);
    }
  });

  bullets.forEach((bullet) => {
    if (bullet.remove) {
      renderer.removeEntity(renderer.BULLET, bullet.id);
    }
  });

  rockets.forEach((rocket) => {
    if (rocket.remove) {
      renderer.removeEntity(renderer.ROCKET, rocket.id);
      rocket.children.forEach((child) => {
        renderer.removeEntity(renderer.FLAMES, child.id);
      });
    }
  });

  asteroids = asteroids.filter((asteroid) => !asteroid.remove);
  bullets = bullets.filter((bullet) => !bullet.remove);
  rockets = rockets.filter((rocket) => !rocket.remove);
};

// TODO: combine all these functions? They don't add much
const addAsteroid = (position, rotation, acceleration, velocity, angularVelocity, radius) => {
  const asteroid = createPhysicsEntity();
  asteroid.position = position;
  asteroid.rotation = rotation;
  asteroid.acceleration = acceleration;
  asteroid.velocity = velocity;
  asteroid.angularVelocity = angularVelocity;
  asteroid.mass = calculateAsteroidMass(radius);
  asteroid.radius = radius;
  asteroid.inertia = (2 / 5) * asteroid.mass * radius ** 2;
  asteroid.hp = 10;

  const img = new Image();
  img.src = "../assets/Asteroid1.png";
  asteroid.texture = img;

  // do not spawn asteroids inside each other
  // do not spawn asteroids on top of other entities
  if (checkCollision(asteroid, spaceship)) {
    return;
  }
  for (const other of asteroids) {
    if (checkCollision(asteroid, other)) {
      return;
    }
  }

  renderer.addEntity(renderer.ASTEROID, asteroid);
  asteroids.push(asteroid);
};

const addBullet = (position, rotation, velocity, angularVelocity) => {
  const bullet = createPhysicsEntity();
  bullet.position = position;
  bullet.rotation = rotation;
  bullet.velocity = velocity;
  bullet.angularVelocity = angularVelocity;
  bullet.mass = BULLET_MASS;
  bullet.radius = 5;
  bullet.inertia = (2 / 5) * bullet.mass * bullet.radius ** 2;
  renderer.addEntity(renderer.BULLET, bullet);
  bullets.push(bullet);
};

const addRocket = (position, rotation, velocity, angularVelocity, targets) => {
  const rocket = createPhysicsEntity();
  rocket.position = position;
  rocket.rotation = rotation;
  rocket.velocity = velocity;
  rocket.angularVelocity = angularVelocity;
  rocket.mass = BULLET_MASS;
  rocket.radius = 5;
  rocket.targets = targets;
  rocket.progress = 0;
  createArcLengthTable(rocket);
  samplePath(rocket);
  renderer.addEntity(renderer.ROCKET, rocket);
  rockets.push(rocket);
  addFlames({ x: -5, y: 0 }, Math.PI / 2, rocket);
};

const addSpaceship = (position, rotation, velocity, angularVelocity) => {
  spaceship = createPhysicsEntity();
  spaceship.position = position;
  spaceship.rotation = rotation;
  spaceship.velocity = velocity;
  spaceship.angularVelocity = angularVelocity;
  spaceship.mass = 10;
  spaceship.drag = 1;
  spaceship.maxVelocity = 0.5;
  spaceship.height = 40;
  spaceship.width = 40;
  spaceship.radius = spaceship.width / 2;
  spaceship.hp = 5;

  const image = new Image();
  image.src = "../assets/Spaceship.png";
  spaceship.texture = image;
  renderer.addEntity(renderer.SPACESHIP, spaceship);

  addSpaceshipPart({ x: -5, y: 18 }, 0, renderer.SPACESHIPPART, "../assets/WingRight.png", spaceship);
  addSpaceshipPart({ x: -5, y: -18 }, 0, renderer.SPACESHIPPART, "../assets/WingLeft.png", spaceship);
};

const addSpaceshipPart = (position, rotation, type, image, parent) => {
  const part = createPhysicsEntity();
  part.position = position;
  part.rotation = rotation;
  part.parent = parent;
  part.height = 20;
  part.width = 20;
  renderer.addEntity(type, part);

  const partImage = new Image();
  partImage.src = image;
  part.texture = partImage;

  addFlames({ x: -5, y: 0 }, 1.5707964, part);
};

const addFlames = (position, rotation, parent) => {
  const flame = createPhysicsEntity();
  flame.position = position;
  flame.rotation = rotation;
  flame.parent = parent;
  flame.height = 10;
  flame.width = 5;

  parent.children ??= parent.children || [];
  parent.children.push(flame);

  renderer.addEntity(renderer.FLAMES, flame);
};

const togglePause = () => {
  paused = !paused;
  pauseResumeButton.innerText = paused ? "Resume" : "Pause";
  menuView.style.display = paused ? "flex" : "none";
};

main();

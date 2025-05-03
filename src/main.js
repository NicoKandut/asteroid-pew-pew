import { checkAndResolveCollision, checkCollision, createPhysicsEntity, velocityVerlet } from "./features/RigidBody.js";
import { pathInterpolate, createArcLengthTable, samplePath } from "./features/PathInterpol.js";
import { randomAngularVelocity, randomPositionOnEdge, randomAsteroidSize, randomPosition } from "./util/random.js";
import * as renderer from "./renderer/2d.js";
import { angleToUnitVector, scale } from "./util/linalg.js";
import { gameState, getBest, resetGameState, trackScore } from "./util/gamestatistics.js";
import {
  playAsteroidCollisionSound,
  playBackgroundMusic,
  playBulletHitSound,
  playBulletShootSound,
  playExplosionSound,
  playSpaceshipCollisionSound,
  setPropulsionVolume,
  setVolumeModifier,
} from "./util/sound.js";
import asteroid1Url from "/img/Asteroid1.png?url";
import spaceshipUrl from "/img/Spaceship.png?url";
import wingLeftUrl from "/img/WingLeft.png?url";
import wingRightUrl from "/img/WingRight.png?url";
import * as ui from "./util/ui.js";

// DOM elements
let canvas = document.getElementsByTagName("canvas")[0];

const BULLET_MASS = 2000;
const ROCKET_PIERCING = 3;

const calculateAsteroidMass = (radius) => {
  const density = 3.5;
  return (4 / 3) * Math.PI * radius ** 3 * density;
};

// game state
let paused = true;
const resume = () => (paused = false);
let frameHandle;

// fps / ups settings
let desired_delta_time = 1000 / 120;
const setDesiredDeltaTime = (value) => (desired_delta_time = value);
let desired_frame_time = 1000 / 60;
const setDesiredFrameTime = (value) => (desired_frame_time = value);

let lastFrameTime = 0;
let lastUpdateTime = 0;
let lastSummaryTime = 0;

let weaponsEnabled = true;
const setWeaponsEnabled = (enabled) => (weaponsEnabled = enabled);

let movementEnabled = true;
const setMovementEnabled = (enabled) => (movementEnabled = enabled);

// statistics
let updatesLastSecond = 0;
let framesLastSecond = 0;

// entities
let asteroids = [];
let bullets = [];
let rockets = [];
let spaceship = null;

// shooting
let bulletIndex = 0;
let shootingBullets = false;
let lastBulletTime = 0;
let bulletCooldown = 40; // in ms

// rockets
let shootingRockets = false;
let rocketCooldown = 3000; // in ms
let lastRocketTime = 0;
let rocketVelocity = 300;
const setRocketSpeed = (value) => (rocketVelocity = value);

// asteroids
let asteroidCooldown = 1000;
let lastAsteroidTime = 0;
const computeAsteroidCooldown = (elapsed) => Math.pow(0.99, elapsed / 1000) * 1000;

let movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const main = () => {
  lastFrameTime = performance.now();
  lastSummaryTime = lastFrameTime;

  initInput();
  ui.init(
    startGame,
    setWeaponsEnabled,
    setMovementEnabled,
    setVolumeModifier,
    setDesiredFrameTime,
    setDesiredDeltaTime,
    setRocketSpeed,
    resume,
    resetGame
  );

  // playBackgroundMusic();
};

const initInput = () => {
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Escape":
        togglePause();
        break;
      case " ":
        shootingBullets = !paused && weaponsEnabled;
        break;
      case "Shift":
        shootingRockets = !paused && weaponsEnabled;
        break;
      case "ArrowUp":
      case "w":
        movement.forward = !paused && movementEnabled;
        break;
      case "ArrowDown":
      case "s":
        movement.backward = !paused && movementEnabled;
        break;
      case "ArrowLeft":
      case "a":
        movement.left = !paused && movementEnabled;
        break;
      case "ArrowRight":
      case "d":
        movement.right = !paused && movementEnabled;
        break;
    }
  });

  document.addEventListener("keyup", (event) => {
    switch (event.key) {
      case " ":
        shootingBullets = false;
        break;
      case "Shift":
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
    if (paused || spaceship == null) {
      return;
    }
    const x = event.clientX - canvas.getBoundingClientRect().left;
    const y = event.clientY - canvas.getBoundingClientRect().top;
    const dx = x - spaceship.position.x;
    const dy = y - spaceship.position.y;
    spaceship.rotation = Math.atan2(dy, dx);
  });
};

let now = performance.now();

const doFrame = () => {
  now = performance.now();

  // updates
  // update at fixed rate to avoid physics issues
  // process next update if we are more than half a frame behind
  while (lastUpdateTime + desired_delta_time / 2 <= now) {
    if (!paused) {
      update(desired_delta_time);
      ++updatesLastSecond;
    }
    lastUpdateTime += desired_delta_time;
  }

  // render
  // render at desired rate
  // limited by the browser through requestAnimationFrame
  // process next render if we are more than half a frame behind
  if (lastFrameTime + desired_frame_time / 2 <= now) {
    if (!paused) {
      renderer.render();
      ++framesLastSecond;
    }
    lastFrameTime = now;
  }

  // every second, update the UI
  if (now - lastSummaryTime >= 1000) {
    const entityCount = asteroids.length + bullets.length + rockets.length + (spaceship ? 1 : 0);
    ui.updateDebugHeader(entityCount, framesLastSecond, updatesLastSecond);

    framesLastSecond = 0;
    updatesLastSecond = 0;

    lastSummaryTime = now;
  }

  // framerate is controlled by the browser
  frameHandle = requestAnimationFrame(doFrame);
};

const processEvents = (deltaTime) => {
  // bullets
  if (shootingBullets && now - lastBulletTime >= bulletCooldown && spaceship) {
    const rotation = spaceship.rotation + (Math.random() - 0.5) * 0.1;
    const offsetMultiplier = bulletIndex % 2 === 0 ? -1 : 1;
    const bulletPosition = angleToUnitVector(spaceship.rotation + (Math.PI / 2) * offsetMultiplier);
    bulletPosition.x *= 10;
    bulletPosition.y *= 10;
    bulletPosition.x += spaceship.position.x;
    bulletPosition.y += spaceship.position.y;
    addBullet(bulletPosition, rotation, angleToUnitVector(rotation), 0);
    playBulletShootSound();
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
    for (let i = 0; i < Math.min(ROCKET_PIERCING, asteroids.length); i++) {
      let asteroid;
      do {
        asteroid = asteroids[Math.floor(Math.random() * asteroids.length)];
      } while (targets.includes(asteroid));
      asteroid.frozen = true;
      asteroid.velocity.x = 0;
      asteroid.velocity.y = 0;
      targets.push(asteroid);
    }
    targets.push(spaceship);
    // last point as ship. Doesn't really matter.
    // only affects the curvature towards the last actual target

    addRocket(
      { ...spaceship.position },
      spaceship.rotation,
      scale(angleToUnitVector(spaceship.rotation), 0.2),
      0,
      targets
    );

    lastRocketTime = now;
  }

  if (now - lastAsteroidTime >= asteroidCooldown) {
    const position = randomPositionOnEdge();
    const target = randomPosition();
    const rotation = Math.random() * Math.PI * 2;
    const velocity = {
      x: target.x - position.x,
      y: target.y - position.y,
    };
    const length = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    if (length > 0) {
      velocity.x /= length;
      velocity.y /= length;
    }
    velocity.x *= Math.random() * 0.1 + 0.1;
    velocity.y *= Math.random() * 0.1 + 0.1;
    const angularVelocity = randomAngularVelocity(0.01);
    const radius = randomAsteroidSize();
    addAsteroid(position, rotation, { x: 0, y: 0 }, velocity, angularVelocity, radius);
    lastAsteroidTime = now;
    asteroidCooldown = computeAsteroidCooldown(gameState.timePlayed);
  }

  // movement
  if (spaceship) {
    if (movement.forward) {
      spaceship.force.y -= 0.004;
    }
    if (movement.backward) {
      spaceship.force.y += 0.004;
    }
    if (movement.left) {
      spaceship.force.x -= 0.004;
    }
    if (movement.right) {
      spaceship.force.x += 0.004;
    }
  }
};

const outOfBounds = (position) => {
  const padding = 100;
  return (
    position.x < 0 - padding ||
    position.x > canvas.width + padding ||
    position.y < 0 - padding ||
    position.y > canvas.height + padding
  );
};

const update = (deltaTime) => {
  processEvents(deltaTime);

  gameState.timePlayed += deltaTime;

  for (const asteroid of asteroids) {
    velocityVerlet(asteroid, deltaTime);
    if (outOfBounds(asteroid.position)) {
      asteroid.remove = true;
    }

    for (const asteroid2 of asteroids) {
      if (asteroid !== asteroid2) {
        if (checkAndResolveCollision(asteroid, asteroid2, 1, true)) {
          playAsteroidCollisionSound();
        }
      }
    }
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
        gameState.bulletsHit++;
        gameState.damageDealt++;
        playBulletHitSound();
        if (asteroid.hp <= 0) {
          ++gameState.asteroidsDestroyed;
          asteroid.remove = true;
          playExplosionSound();
        }
      }
    }
  }

  for (const rocket of rockets) {
    rocket.progress += (deltaTime / 1000) * rocketVelocity;
    pathInterpolate(rocket, rocket.progress, (target) => {
      // console.log("target reached", target);
      target.remove = true;
      ++gameState.asteroidsDestroyed;
      gameState.damageDealt += target?.hp ?? 0;
      playExplosionSound();
    });
  }

  const previousPosition = { ...spaceship.position };
  velocityVerlet(spaceship, deltaTime);
  const difference = {
    x: spaceship.position.x - previousPosition.x,
    y: spaceship.position.y - previousPosition.y,
  };
  const distance = Math.sqrt(difference.x ** 2 + difference.y ** 2);
  gameState.distanceTraveled += distance;
  setPropulsionVolume(Math.min(distance / 100, 0.05));
  for (const asteroid of asteroids) {
    if (checkAndResolveCollision(spaceship, asteroid, 1, true)) {
      spaceship.hp -= 1;
      playSpaceshipCollisionSound();
      if (spaceship.hp >= 0) {
        ui.updateHp(spaceship.hp);
      }
      if (spaceship.hp <= 0) {
        playExplosionSound();
        removeSpaceshipFromRenderer();
        setPropulsionVolume(0);
        renderer.addEntity(renderer.EXPLOSION, { position: { ...spaceship.position }, frame: 0 });
        setTimeout(() => {
          endGame();
        }, 1000);
        break;
      }
    }
  }

  // automatic brake
  if (!movement.forward && !movement.backward && !movement.left && !movement.right) {
    spaceship.velocity.x *= Math.pow(0.25, deltaTime / 1000);
    spaceship.velocity.y *= Math.pow(0.25, deltaTime / 1000);
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
      asteroid.frame = 0;
      renderer.addEntity(renderer.EXPLOSION, asteroid);
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
  asteroid.hp = radius / 2;

  const img = new Image();
  img.src = asteroid1Url;
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
  ++gameState.bulletsFired;
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
  rocket.currentTarget = 0;
  createArcLengthTable(rocket);
  samplePath(rocket);
  renderer.addEntity(renderer.ROCKET, rocket);
  rockets.push(rocket);
  addFlames({ x: -5, y: 0 }, Math.PI / 2, rocket);
  ++gameState.rocketsFired;
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
  image.src = spaceshipUrl;
  spaceship.texture = image;
  renderer.addEntity(renderer.SPACESHIP, spaceship);

  addSpaceshipPart({ x: -5, y: 18 }, 0, renderer.SPACESHIPPART, wingRightUrl, spaceship);
  addSpaceshipPart({ x: -5, y: -18 }, 0, renderer.SPACESHIPPART, wingLeftUrl, spaceship);
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

  parent.children ??= parent.children || [];
  parent.children.push(part);

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
  if (paused) {
    ui.showPauseMenu();
    setPropulsionVolume(0);
  } else {
    ui.hidePauseMenu();
  }
};

const removeSpaceshipFromRenderer = () => {
  if (spaceship) {
    renderer.removeEntity(renderer.SPACESHIP, spaceship.id);
    for (let wing of spaceship.children) {
      renderer.removeEntity(renderer.SPACESHIPPART, wing.id);
      for (let flame of wing.children) {
        renderer.removeEntity(renderer.FLAMES, flame.id);
      }
    }
  }
};

const initGame = () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  addSpaceship({ x: canvas.width / 2, y: canvas.height / 2 }, 0, { x: 0, y: 0 }, 0);
};

const startGame = () => {
  initGame();
  resume();
  frameHandle = requestAnimationFrame(doFrame);
};

const endGame = () => {
  cancelAnimationFrame(frameHandle);
  paused = true;
  setPropulsionVolume(0);
  spaceship = null;

  const best = getBest(!weaponsEnabled, !movementEnabled);

  ui.updateGameOverMenu(weaponsEnabled, movementEnabled, gameState, best);
  ui.showGameOverMenu();

  trackScore(!weaponsEnabled, !movementEnabled);
};

const resetGame = () => {
  resetGameState();
  renderer.removeAllEntities();
  asteroids = [];
  bullets = [];
  rockets = [];
  asteroidCooldown = 1000;

  ui.updateHp(5);
  ui.hidePauseMenu();
  ui.hideGameOverMenu();
};

main();

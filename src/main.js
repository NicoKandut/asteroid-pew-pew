import {
  applyForce,
  checkAndResolveCollision,
  checkCollision,
  createPhysicsEntity,
  velocityVerlet,
} from "./features/RigidBody.js";
import { pathInterpolate, createArcLengthTable, samplePath } from "./features/PathInterpol.js";
import {
  randomAngularVelocity,
  randomPositionOnEdge,
  randomAsteroidSize,
  randomPosition,
  randomPowerupType,
  randomAsteroidType,
  randomAsteroidTypeExtreme,
} from "./util/random.js";
import * as renderer from "./renderer/2d.js";
import { angleOfVector, angleToUnitVector, lerp, normalize, scale, sub } from "./util/linalg.js";
import { gameState, getBest, resetGameState, trackScore } from "./util/gamestatistics.js";
import {
  playArmorHitSound,
  playAsteroidCollisionSound,
  playBackgroundMusic,
  playBulletHitSound,
  playBulletShootSound,
  playExplosionSound,
  playPowerupSound,
  playSpaceshipCollisionSound,
  setPropulsionVolume,
  setVolumeModifier,
} from "./util/sound.js";
import asteroid1Url from "/img/Asteroid1.png?url";
import asteroidRedUrl from "/img/asteroid_red.png?url";
import asteroidArmoredUrl from "/img/asteroid_armored.png?url";
import asteroidGreenUrl from "/img/asteroid_green.png?url";
import spaceshipUrl from "/img/Spaceship.png?url";
import wingLeftUrl from "/img/WingLeft.png?url";
import wingRightUrl from "/img/WingRight.png?url";
import * as ui from "./util/ui.js";

import { generateVoronoiSeeds, calculateImpactPoint, computeVoronoiField, generateNoise, createFragementTexture } from './features/voronoiFracture.js'

// DOM elements
let canvas = document.getElementsByTagName("canvas")[0];

let controllerIndex = null;

const BULLET_MASS = 2000;

const calculateAsteroidMass = (radius, type) => {
  const density = type === "armored" ? 10 : 3.5;
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
let lastMenueToggle = 0;

// entities
let asteroids = [];
let bullets = [];
let rockets = [];
let spaceship = null;
let powerups = [];

// shooting
let bulletDamage = 1;
let bulletIndex = 0;
let shootingBullets = false;
let lastBulletTime = 0;
let bulletCooldown = 40; // in ms
let enemyBulletCooldown = 80; // in ms

// rockets
let rocketPiercing = 3;
let shootingRockets = false;
let rocketCooldown = 3000; // in ms
let lastRocketTime = 0;
let rocketVelocity = 300;
const setRocketSpeed = (value) => (rocketVelocity = value);

// asteroids
let asteroidCooldown = 1000;
let lastAsteroidTime = 0;
const computeAsteroidCooldown = (elapsed) => Math.pow(0.99, elapsed / 1000) * 1000;

let extremeModeEnabled = false;
const setExtremeModeEnabled = (enabled) => (extremeModeEnabled = enabled);

// powerups
let powerupCooldown = 10000;
let lastPowerupTime = 0;

let movement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  forwardController: false,
  backwardController: false,
  leftController: false,
  rightController: false,
};

const main = () => {
  document.getElementById("version").innerText = `${__APP_VERSION__}`;
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
    resetGame,
    setExtremeModeEnabled
  );

  // playBackgroundMusic();
};

const controllerInput = (now) => {
  if (controllerIndex == null) {
    return;
  }
  const gamepad = navigator.getGamepads()[controllerIndex];

  /* gamepad.buttons
    0... A
    1... B
    2... X
    3... Y
    4... LB
    5... RB
    6... LT
    7... RT
    8... Menue
    9... Pause
    10... Left Stick Press
    11... Right Stick Press
    12... Cross Up
    13... Cross Down
    14... Cross Left
    15... Cross Right
  */

  if (gamepad.buttons[9].value >= 0.5 && now - 300 >= lastMenueToggle) {
    togglePause();
    lastMenueToggle = now;
  }
  if (gamepad.buttons[7].pressed && gamepad.buttons[7].value >= 0.5) {
    shootingBullets = !paused && weaponsEnabled;
  } else {
    shootingBullets = false;
  }
  if (gamepad.buttons[6].pressed && gamepad.buttons[6].value >= 0.5) {
    shootingRockets = !paused && weaponsEnabled;
  } else {
    shootingRockets = false;
  }
  if (gamepad.buttons[12].pressed) {
    movement.forwardController = !paused && movementEnabled;
  } else {
    movement.forwardController = false;
  }
  if (gamepad.buttons[13].pressed) {
    movement.backwardController = !paused && movementEnabled;
  } else {
    movement.backwardController = false;
  }
  if (gamepad.buttons[14].pressed) {
    movement.leftController = !paused && movementEnabled;
  } else {
    movement.leftController = false;
  }
  if (gamepad.buttons[15].pressed) {
    movement.rightController = !paused && movementEnabled;
  } else {
    movement.rightController = false;
  }

  /* gamepad.axes
    0... Left Horizontal
    1... Left Vertical
    2... Right Horizontal
    3... Right Vertical
  */

  if (Math.abs(gamepad.axes[2]) >= 0.5 || Math.abs(gamepad.axes[3]) >= 0.5) {
    spaceship.rotation = Math.atan2(gamepad.axes[3], gamepad.axes[2]);
  }
};

const initInput = () => {
  window.addEventListener("gamepadconnected", (event) => {
    controllerIndex = event.gamepad.index;
  });

  window.addEventListener("gamepaddisconnected", () => {
    controllerIndex = null;
  });

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
      case "W":
        movement.forward = !paused && movementEnabled;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        movement.backward = !paused && movementEnabled;
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        movement.left = !paused && movementEnabled;
        break;
      case "ArrowRight":
      case "d":
      case "D":
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
      case "W":
        movement.forward = false;
        break;
      case "ArrowDown":
      case "s":
      case "S":
        movement.backward = false;
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        movement.left = false;
        break;
      case "ArrowRight":
      case "d":
      case "D":
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

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      paused = true;
      ui.showPauseMenu();
    }
  });
};

let now = performance.now();

const doFrame = () => {
  now = performance.now();

  controllerInput(now);

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

const processEvents = () => {
  // bullets
  if (shootingBullets && now - lastBulletTime >= bulletCooldown && spaceship) {
    const rotation = spaceship.rotation + (Math.random() - 0.5) * 0.1;
    const offsetMultiplier = bulletIndex % 2 === 0 ? -1 : 1;
    const bulletPosition = angleToUnitVector(spaceship.rotation + (Math.PI / 2) * offsetMultiplier);
    bulletPosition.x *= 10;
    bulletPosition.y *= 10;
    bulletPosition.x += spaceship.position.x;
    bulletPosition.y += spaceship.position.y;
    addBullet(bulletPosition, rotation, angleToUnitVector(rotation), 0, true);
    // const force = angleToUnitVector(rotation + Math.PI);
    // force.x *= 0.01;
    // force.y *= 0.01;
    // applyForce(spaceship, force, 0.0);
    playBulletShootSound();
    bulletIndex++;
    lastBulletTime = now;
  }

  // rockets
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
    for (let i = 0; i < Math.min(rocketPiercing, asteroids.length); i++) {
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

  // spawn new asteroids
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
    if (extremeModeEnabled) {
      velocity.x *= 2;
      velocity.y *= 2;
    }
    const angularVelocity = randomAngularVelocity(0.005);
    const radius = randomAsteroidSize(gameState.timePlayed);
    const asteroidType = extremeModeEnabled ? randomAsteroidTypeExtreme() : randomAsteroidType();
    addAsteroid(position, rotation, { x: 0, y: 0 }, velocity, angularVelocity, radius, asteroidType);
    lastAsteroidTime = now;
    asteroidCooldown = computeAsteroidCooldown(gameState.timePlayed);
  }

  // powerups
  if (now - lastPowerupTime >= powerupCooldown) {
    const position = randomPositionOnEdge();
    const target = {
      x: canvas.width / 2 + (Math.random() - 0.5) * 400,
      y: canvas.height / 2 + (Math.random() - 0.5) * 400,
    };
    const velocity = {
      x: target.x - position.x,
      y: target.y - position.y,
    };
    const length = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    if (length > 0) {
      velocity.x /= length;
      velocity.y /= length;
    }
    velocity.x *= 0.1;
    velocity.y *= 0.1;
    const angularVelocity = randomAngularVelocity(0.005);
    const powerupType = randomPowerupType();
    addPowerup(powerupType, position, 0, velocity, angularVelocity);
    lastPowerupTime = now;
  }

  // movement
  if (spaceship) {
    if (controllerIndex != null) {
      const gamepad = navigator.getGamepads()[controllerIndex];

      let yMulti = gamepad.axes[1];
      if (Math.abs(gamepad.axes[1]) <= 0.01) {
        yMulti = 0;
      } else if (gamepad.axes[1] >= 0.7) {
        yMulti = 1;
      } else if (gamepad.axes[1] <= -0.7) {
        yMulti = -1;
      }

      let xMulti = gamepad.axes[0];
      if (Math.abs(gamepad.axes[0]) <= 0.01) {
        xMulti = 0;
      } else if (gamepad.axes[0] >= 0.7) {
        xMulti = 1;
      } else if (gamepad.axes[0] <= -0.7) {
        xMulti = -1;
      }

      spaceship.force.y += 0.004 * yMulti;
      spaceship.force.x += 0.004 * xMulti;
    }

    if (spaceship.force.x == 0 && spaceship.force.y == 0) {
      if (movement.forward || movement.forwardController) {
        spaceship.force.y -= 0.004;
      }
      if (movement.backward || movement.backwardController) {
        spaceship.force.y += 0.004;
      }
      if (movement.left || movement.leftController) {
        spaceship.force.x -= 0.004;
      }
      if (movement.right || movement.rightController) {
        spaceship.force.x += 0.004;
      }
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

const handleDamageTaken = () => {
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
  }
};

const update = (deltaTime) => {
  processEvents();

  gameState.timePlayed += deltaTime;

  for (const asteroid of asteroids) {
    if (asteroid.type === "homing") {
      const current = normalize(asteroid.velocity);
      const target = normalize(sub(spaceship.position, asteroid.position));
      const direction = normalize(lerp(current, target, 0.002 * deltaTime));
      const velocityMagnitude = Math.sqrt(asteroid.velocity.x ** 2 + asteroid.velocity.y ** 2);
      let dx = direction.x;
      let dy = direction.y;
      const length = Math.sqrt(dx ** 2 + dy ** 2);
      if (length > 0) {
        dx /= length;
        dy /= length;
      }
      dx *= velocityMagnitude;
      dy *= velocityMagnitude;
      asteroid.velocity.x = dx;
      asteroid.velocity.y = dy;
    }

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

    if (asteroid.type === "turret" && !asteroid.frozen) {
      const nextCooldown = asteroid.bulletIndex % 5 === 0 ? enemyBulletCooldown * 50 : enemyBulletCooldown;
      if (now - asteroid.lastBulletTime >= nextCooldown) {
        const direction = {
          x: spaceship.position.x - asteroid.position.x,
          y: spaceship.position.y - asteroid.position.y,
        };
        const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
        if (length > 0) {
          direction.x /= length * 2;
          direction.y /= length * 2;
        }
        const bulletPosition = {
          x: asteroid.position.x,
          y: asteroid.position.y,
        };
        addBullet(bulletPosition, angleOfVector(direction), direction, 0, false);
        playBulletShootSound();
        asteroid.lastBulletTime = now;
        asteroid.bulletIndex++;
      }
    }
  }

  for (const bullet of bullets) {
    void 0;
    velocityVerlet(bullet, deltaTime);
    if (outOfBounds(bullet.position)) {
      bullet.remove = true;
    }
    if (bullet.disabled) {
      continue;
    }
    if (bullet.friendly) {
      for (const asteroid of asteroids) {
        if (asteroid.type === "armored") {
          if (checkAndResolveCollision(bullet, asteroid, 1, false)) {
            gameState.bulletsHit++;
            bullet.velocity.x *= 0.1;
            bullet.velocity.y *= 0.1;
            bullet.angularVelocity = randomAngularVelocity(0.02);
            bullet.disabled = true;
            playArmorHitSound();
            setTimeout(() => {
              bullet.remove = true;
            }, 300);
          }
        }
        else if (asteroid.type === "split") {
          if (checkAndResolveCollision(bullet, asteroid, 1, false)) {
            console.log("Test")
            gameState.bulletsHit++;
            gameState.damageDealt += Math.min(asteroid.hp, bulletDamage);
            asteroid.hp -= bulletDamage;

            asteroid.fractureSeeds = generateVoronoiSeeds(calculateImpactPoint(asteroid, bullet), asteroid.radius);
            const noiseFn = generateNoise(asteroid);

            let cellMap = null;

            const voronoiData = computeVoronoiField(asteroid, noiseFn);

            //asteroid.texture = voronoiData.heatMap;

            if (asteroid.hp <= 0) {
              ++gameState.asteroidsDestroyed;
              asteroid.remove = true;
              playExplosionSound();

              const fragments = createFragementTexture(asteroid.texture, voronoiData.cellMap, asteroid);

              for (let i = 0; i < fragments.length; i++) {
                const texture = fragments[i];

                const asteroid = createPhysicsEntity();
                const position = asteroid.position
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
                if (extremeModeEnabled) {
                  velocity.x *= 2;
                  velocity.y *= 2;
                }
                const angularVelocity = randomAngularVelocity(0.005);
                const radius = 40;
                const asteroidType = "default"
                addAsteroid(position, rotation, { x: 0, y: 0 }, velocity, angularVelocity, radius, asteroidType, texture);
              }
            }
            bullet.remove = true;
            playBulletHitSound();

            console.log(asteroid.fractureSeeds);
          }
        }
        else {
          if (checkAndResolveCollision(bullet, asteroid, 1, false)) {
            gameState.bulletsHit++;
            gameState.damageDealt += Math.min(asteroid.hp, bulletDamage);
            asteroid.hp -= bulletDamage;
            if (asteroid.hp <= 0) {
              ++gameState.asteroidsDestroyed;
              asteroid.remove = true;
              playExplosionSound();
            }
            bullet.remove = true;
            playBulletHitSound();
          }
        }
      }
    } else {
      if (checkAndResolveCollision(bullet, spaceship, 1, false)) {
        handleDamageTaken();
        bullet.remove = true;
        if (spaceship.hp <= 0) {
          break;
        }
      }
    }
  }

  for (const rocket of rockets) {
    rocket.progress += (deltaTime / 1000) * rocketVelocity;
    pathInterpolate(rocket, rocket.progress, (target) => {
      target.remove = true;
      ++gameState.asteroidsDestroyed;
      gameState.damageDealt += target.hp;
      playExplosionSound();
    });
  }

  for (const powerup of powerups) {
    velocityVerlet(powerup, deltaTime);
    if (outOfBounds(powerup.position)) {
      powerup.remove = true;
    }
    if (checkCollision(powerup, spaceship)) {
      powerup.remove = true;
      playPowerupSound();
      switch (powerup.type) {
        case "health":
          spaceship.hp += 1;
          spaceship.hp = Math.min(spaceship.hp, 5);
          ui.updateHp(spaceship.hp);
          break;
        case "damage":
          bulletDamage += 1;
          ui.updateBulletDamage(bulletDamage);
          break;
        case "rocket-piercing":
          rocketPiercing += 1;
          ui.updateRocketPiercing(rocketPiercing);
          break;
      }
    }
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
      handleDamageTaken();
      if (spaceship.hp <= 0) {
        break;
      }
    }
  }

  // automatic brake
  if (controllerIndex == null) {
    if (!movement.forward && !movement.backward && !movement.left && !movement.right) {
      spaceship.velocity.x *= Math.pow(0.25, deltaTime / 1000);
      spaceship.velocity.y *= Math.pow(0.25, deltaTime / 1000);
    }
  } else {
    const gamepad = navigator.getGamepads()[controllerIndex];
    if (
      Math.abs(gamepad.axes[0]) < 0.01 &&
      Math.abs(gamepad.axes[1]) < 0.01 &&
      !movement.forward &&
      !movement.backward &&
      !movement.left &&
      !movement.right &&
      !movement.forwardController &&
      !movement.backwardController &&
      !movement.leftController &&
      !movement.rightController
    ) {
      spaceship.velocity.x *= Math.pow(0.25, deltaTime / 1000);
      spaceship.velocity.y *= Math.pow(0.25, deltaTime / 1000);
    }
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

  powerups.forEach((powerup) => {
    if (powerup.remove) {
      renderer.removeEntity(renderer.POWERUP, powerup.id);
    }
  });

  asteroids = asteroids.filter((asteroid) => !asteroid.remove);
  bullets = bullets.filter((bullet) => !bullet.remove);
  rockets = rockets.filter((rocket) => !rocket.remove);
  powerups = powerups.filter((powerup) => !powerup.remove);
};


const asteroidTextures = {
  default: asteroid1Url,
  homing: asteroidRedUrl,
  armored: asteroidArmoredUrl,
  turret: asteroidGreenUrl,
  split: asteroid1Url
};

const addAsteroid = (position, rotation, acceleration, velocity, angularVelocity, radius, type, texture = null) => {
  const asteroid = createPhysicsEntity();
  asteroid.position = position;
  asteroid.rotation = rotation;
  asteroid.acceleration = acceleration;
  asteroid.velocity = velocity;
  asteroid.angularVelocity = angularVelocity;
  asteroid.mass = calculateAsteroidMass(radius, type);
  asteroid.radius = type === "armored" ? radius * 2 : radius;
  asteroid.inertia = (2 / 5) * asteroid.mass * radius ** 2;
  asteroid.hp = radius / 2;
  asteroid.texture = texture ? texture : loadImageIntoTexture(asteroid, asteroidTextures[type]);
  asteroid.type = type;

  if (type === "turret") {
    asteroid.lastBulletTime = now;
    asteroid.bulletIndex = 0;
  }

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

const addBullet = (position, rotation, velocity, angularVelocity, friendly) => {
  const bullet = createPhysicsEntity();
  bullet.position = position;
  bullet.rotation = rotation;
  bullet.velocity = velocity;
  bullet.angularVelocity = angularVelocity;
  bullet.mass = BULLET_MASS;
  bullet.radius = 5;
  bullet.inertia = (2 / 5) * bullet.mass * bullet.radius ** 2;
  bullet.friendly = friendly;
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

  loadImageIntoTexture(spaceship, spaceshipUrl);

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

  loadImageIntoTexture(part, image);

  parent.children ??= parent.children || [];
  parent.children.push(part);

  addFlames({ x: -5, y: 0 }, Math.PI / 2, part);
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

const addPowerup = (type, position, rotation, velocity, angularVelocity) => {
  const powerup = createPhysicsEntity();
  powerup.type = type;
  powerup.position = position;
  powerup.rotation = rotation;
  powerup.velocity = velocity;
  powerup.angularVelocity = angularVelocity;
  powerup.radius = 25;

  renderer.addEntity(renderer.POWERUP, powerup);
  powerups.push(powerup);
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
  if (paused) {
    return;
  }
  paused = true;
  cancelAnimationFrame(frameHandle);
  setPropulsionVolume(0);
  spaceship = null;

  const best = getBest(!weaponsEnabled, !movementEnabled, extremeModeEnabled);

  ui.updateGameOverMenu(weaponsEnabled, movementEnabled, extremeModeEnabled, gameState, best);
  ui.showGameOverMenu();

  trackScore(!weaponsEnabled, !movementEnabled, extremeModeEnabled);
};

const resetGame = () => {
  resetGameState();
  renderer.removeAllEntities();
  asteroids = [];
  bullets = [];
  rockets = [];
  asteroidCooldown = 1000;

  rocketPiercing = 3;
  bulletDamage = 1;
  ui.updateHp(5);
  ui.hidePauseMenu();
  ui.hideGameOverMenu();
};

const loadImageIntoTexture = (entity, imageUrl) => {
  const image = new Image();
  image.src = imageUrl;

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    entity.texture = canvas;
    entity.textureReady = true;
  };
}

main();

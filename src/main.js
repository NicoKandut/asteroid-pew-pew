import {
  randomAngularVelocity,
  randomPosition,
  randomVelocity,
} from "./random.js";
import * as renderer from "./renderer/2d.js";

// DONE: spawn spaceship
// TODO: add spaceship controls
// TODO: spawn asteroids, spawn-rate (every x seconds)
// TODO: collision detection
// TODO: add orbiting shield things
// TODO: add big asteroid that fracture
// TODO: add rockets + spline paths

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

let desired_delta_time = 1000 / 120;
let desired_frame_time = 1000 / 60;

let lastFrameTime = 0;
let lastUpdateTime = 0;
let lastSummaryTime = 0;

let updatesLastSecond = 0;
let framesLastSecond = 0;

let asteroids = [];
let bullets = [];
let rockets = [];
let spaceship = null;

const main = () => {
  renderer.init();
  lastFrameTime = performance.now();
  lastSummaryTime = lastFrameTime;

  setupInput();

  addSpaceship(
    { x: canvas.width / 2, y: canvas.height / 2 },
    0,
    { x: 0, y: 0 },
    0
  );

  // TDOD: do this in a more game-like way. This is a placeholder
  setInterval(() => {
    addAsteroid(
      randomPosition(),
      0,
      randomVelocity(0.1 * Math.random() + 0.01),
      randomAngularVelocity(0.001)
    );
  }, 100);

  requestAnimationFrame(doFrame);
};

const setupInput = () => {
  document.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Escape":
        togglePause();
        break;
      case " ":
        // TODO: decouple bullet spawn-rate from keypress input-rate
        if (spaceship) {
          const rotation = spaceship.rotation + (Math.random() - 0.5) * 0.1;
          addBullet(
            { x: spaceship.position.x, y: spaceship.position.y },
            rotation,
            { x: Math.cos(rotation), y: Math.sin(rotation) },
            0
          );
        }
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

  pauseResumeButton.addEventListener("click", togglePause);
};

const doFrame = () => {
  const now = performance.now();

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
    entityCountView.innerText = `${
      asteroids.length + bullets.length + rockets.length + (spaceship ? 1 : 0)
    }`;
    fpsView.innerText = `${framesLastSecond}`;
    upsView.innerText = `${updatesLastSecond}`;

    framesLastSecond = 0;
    updatesLastSecond = 0;

    lastSummaryTime = now;
  }

  // framerate is controlled by the browser
  requestAnimationFrame(doFrame);
};

const outOfBounds = (position) => {
  // TODO: add padding to only remove entities that are completely off-screen
  return (
    position.x < 0 ||
    position.x > canvas.width ||
    position.y < 0 ||
    position.y > canvas.height
  );
};

const update = (deltaTime) => {
  for (const asteroid of asteroids) {
    asteroid.position.x += deltaTime * asteroid.velocity.x;
    asteroid.position.y += deltaTime * asteroid.velocity.y;
    asteroid.rotation += deltaTime * asteroid.angularVelocity;
    if (outOfBounds(asteroid.position)) {
      asteroid.remove = true;
    }

    // wrap around
    // asteroid.position.x = (asteroid.position.x + canvas.width) % canvas.width;
    // asteroid.position.y = (asteroid.position.y + canvas.height) % canvas.height;
  }

  for (const bullet of bullets) {
    bullet.position.x += deltaTime * bullet.velocity.x;
    bullet.position.y += deltaTime * bullet.velocity.y;
    bullet.rotation += deltaTime * bullet.angularVelocity;
    if (outOfBounds(bullet.position)) {
      bullet.remove = true;
    }
  }

  for (const rocket of rockets) {
    rocket.position.x += deltaTime * rocket.velocity.x;
    rocket.position.y += deltaTime * rocket.velocity.y;
    rocket.rotation += deltaTime * rocket.angularVelocity;
    if (outOfBounds(rocket.position)) {
      rocket.remove = true;
    }
  }

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
    }
  });

  asteroids = asteroids.filter((asteroid) => !asteroid.remove);
  bullets = bullets.filter((bullet) => !bullet.remove);
  rockets = rockets.filter((rocket) => !rocket.remove);

  if (spaceship) {
    // renderer.updateEntity(renderer.SPACESHIP, spaceship.id, spaceship);
  }
};

// TODO: combine all these functions? They don't add much
const addAsteroid = (position, rotation, velocity, angularVelocity) => {
  const asteroid = { position, rotation, velocity, angularVelocity };
  renderer.addEntity(renderer.ASTEROID, asteroid);
  asteroids.push(asteroid);
};

const removeAsteroid = (asteroid) => {
  renderer.removeEntity(renderer.ASTEROID, asteroid.id);
  asteroids.splice(asteroids.indexOf(asteroid), 1);
};

const addBullet = (position, rotation, velocity, angularVelocity) => {
  const bullet = { position, rotation, velocity, angularVelocity };
  renderer.addEntity(renderer.BULLET, bullet);
  bullets.push(bullet);
};

const removeBullet = (bullet) => {
  renderer.removeEntity(renderer.BULLET, bullet.id);
  bullets.splice(bullets.indexOf(bullet), 1);
};

const addRocket = (position, rotation, velocity, angularVelocity) => {
  const rocket = { position, rotation, velocity, angularVelocity };
  renderer.addEntity(renderer.ROCKET, rocket);
  rockets.push(rocket);
};

const removeRocket = (rocket) => {
  renderer.removeEntity(renderer.ROCKET, rocket.id);
  rockets.splice(rockets.indexOf(rocket), 1);
};

const addSpaceship = (position, rotation, velocity, angularVelocity) => {
  spaceship = { position, rotation, velocity, angularVelocity };
  renderer.addEntity(renderer.SPACESHIP, spaceship);
};

const removeSpaceship = (id) => {
  renderer.removeEntity(renderer.SPACESHIP, id);
  spaceship = null;
};

const togglePause = () => {
  paused = !paused;
  pauseResumeButton.innerText = paused ? "Resume" : "Pause";
  menuView.style.display = paused ? "flex" : "none";
};

main();

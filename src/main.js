import * as renderer from "./renderer/2d.js";

// TODO: spawn spaceship
// TODO: add spaceship controls
// TODO: spawn asteroids, spawn-rate (every x seconds)
// TODO: collision detection
// TODO: add orbiting shield things
// TODO: add big asteroid that fracture
// TODO: add rockets + spline paths

let paused = false;

let fpsView = document.getElementById("fps");
let upsView = document.getElementById("ups");

let lastFrameTime = 0;
let lastSummaryTime = 0;

let updatesLastSecond = 0;
let framesLastSecond = 0;

const asteroids = [];

const main = () => {
  renderer.init();
  lastFrameTime = performance.now();
  lastSummaryTime = lastFrameTime;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      paused = !paused;
    }
  });

  setInterval(addAsteroid, 1000);

  requestAnimationFrame(doFrame);
};

const doFrame = () => {
  const now = performance.now();
  const deltaTime = now - lastFrameTime;

  // TODO: decouple and make controllable
  if (!paused) {
    update(deltaTime);
    ++updatesLastSecond;

    renderer.render();
    ++framesLastSecond;
  }

  lastFrameTime = now;

  if (now - lastSummaryTime >= 1000) {
    fpsView.innerText = `${framesLastSecond}`;
    upsView.innerText = `${updatesLastSecond}`;

    framesLastSecond = 0;
    updatesLastSecond = 0;

    lastSummaryTime = now;
  }

  requestAnimationFrame(doFrame);
};

const update = (deltaTime) => {
  for (const asteroid of asteroids) {
    asteroid.transform.position.x += deltaTime / 10;
    asteroid.transform.position.y += deltaTime / 10;
  }
};

const addAsteroid = () => {
  const transform = { position: { x: 100, y: 100 }, rotation: 0 };
  const id = renderer.addEntity(
    renderer.ASTEROID,
    transform.position,
    transform.rotation
  );
  asteroids.push({ id, transform });
};

const removeAsteroid = (id) => {
  renderer.removeEntity(renderer.ASTEROID, id);
  asteroids.splice(id, 1);
};

main();

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
let targetFpsView = document.getElementById("target-fps");
let targetUpsView = document.getElementById("target-ups");

let desired_delta_time = 1000 / 120;
let desired_frame_time = 1000 / 60;

let lastFrameTime = 0;
let lastUpdateTime = 0;
let lastSummaryTime = 0;

let updatesLastSecond = 0;
let framesLastSecond = 0;

const asteroids = [];
const bullets = [];
const rockets = [];
let spaceship = null;

const main = () => {
  renderer.init();
  lastFrameTime = performance.now();
  lastSummaryTime = lastFrameTime;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      paused = !paused;
    }
  });

  targetFpsView.addEventListener("change", (event) => {
    desired_frame_time = 1000 / Number(event.target.value);
  });

  targetUpsView.addEventListener("change", (event) => {
    desired_delta_time = 1000 / Number(event.target.value);
  });

  setInterval(() => {
    addAsteroid(100, 100, 0);
    addBullet(200, 100, 0);
    addRocket(300, 100, 0);
    addSpaceship(400, 100, 0);
  }, 1000);

  requestAnimationFrame(doFrame);
};

const doFrame = () => {
  const now = performance.now();

  if (!paused) {
    while (lastUpdateTime + desired_delta_time / 2 <= now) {
      update(desired_delta_time);
      ++updatesLastSecond;
      lastUpdateTime += desired_delta_time;
    }

    if (lastFrameTime + desired_frame_time / 2 <= now) {
      renderer.render();
      ++framesLastSecond;
      lastFrameTime = now;
    }
  }

  if (now - lastSummaryTime >= 1000) {
    fpsView.innerText = `${framesLastSecond}`;
    upsView.innerText = `${updatesLastSecond}`;

    framesLastSecond = 0;
    updatesLastSecond = 0;

    lastSummaryTime = now;
  }

  // framerate is controlled by the browser
  requestAnimationFrame(doFrame);
};

const update = (deltaTime) => {
  for (const asteroid of asteroids) {
    asteroid.transform.position.x += deltaTime / 100;
    asteroid.transform.position.y += deltaTime / 10;
    asteroid.transform.rotation += deltaTime / 300;
    renderer.updateEntity(
      renderer.ASTEROID,
      asteroid.id,
      asteroid.transform.position,
      asteroid.transform.rotation
    );
  }

  for (const bullet of bullets) {
    bullet.transform.position.x -= deltaTime / 100;
    bullet.transform.position.y += deltaTime / 10;
    bullet.transform.rotation += deltaTime / 300;
    renderer.updateEntity(
      renderer.BULLET,
      bullet.id,
      bullet.transform.position,
      bullet.transform.rotation
    );
  }

  for (const rocket of rockets) {
    rocket.transform.position.x += deltaTime / 100;
    rocket.transform.position.y += deltaTime / 10;
    rocket.transform.rotation += deltaTime / 300;
    renderer.updateEntity(
      renderer.ROCKET,
      rocket.id,
      rocket.transform.position,
      rocket.transform.rotation
    );
  }

  if (spaceship) {
    spaceship.transform.position.x -= deltaTime / 100;
    spaceship.transform.position.y += deltaTime / 10;
    spaceship.transform.rotation += deltaTime / 300;
    renderer.updateEntity(
      renderer.SPACESHIP,
      spaceship.id,
      spaceship.transform.position,
      spaceship.transform.rotation
    );
  }
};

const addAsteroid = (x, y, rotation) => {
  const transform = { position: { x, y }, rotation };
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

const addBullet = (x, y, rotation) => {
  const transform = { position: { x, y }, rotation };
  const id = renderer.addEntity(
    renderer.BULLET,
    transform.position,
    transform.rotation
  );
  bullets.push({ id, transform });
};

const removeBullet = (id) => {
  renderer.removeEntity(renderer.BULLET, id);
  bullets.splice(id, 1);
};

const addRocket = (x, y, rotation) => {
  const transform = { position: { x, y }, rotation };
  const id = renderer.addEntity(
    renderer.ROCKET,
    transform.position,
    transform.rotation
  );
  rockets.push({ id, transform });
};

const removeRocket = (id) => {
  renderer.removeEntity(renderer.ROCKET, id);
  rockets.splice(id, 1);
};

const addSpaceship = (x, y, rotation) => {
  const transform = { position: { x, y }, rotation };
  const id = renderer.addEntity(
    renderer.SPACESHIP,
    transform.position,
    transform.rotation
  );
  spaceship = { id, transform };
};

const removeSpaceship = (id) => {
  renderer.removeEntity(renderer.SPACESHIP, id);
  spaceship = null;
};

main();

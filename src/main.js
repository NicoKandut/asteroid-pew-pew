import { addGeometry, render } from "./renderer.js";

let paused = false;

let fpsView = document.getElementById("fps");
let upsView = document.getElementById("ups");

let lastFrameTime = 0;
let lastSummaryTime = 0;

let updatesLastSecond = 0;
let framesLastSecond = 0;

const main = () => {
  lastFrameTime = performance.now();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      paused = !paused;
    }
  });

  requestAnimationFrame(doFrame);
};

const doFrame = () => {
  const now = performance.now();
  const deltaTime = now - lastFrameTime;

  if (!paused) {
    update(deltaTime);
    ++updatesLastSecond;

    render();
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
  // console.log(`update dt=${deltaTime}`);
};

main();

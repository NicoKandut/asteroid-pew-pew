import * as renderer from "../renderer/2d.js";
import { setVolumeModifier, playClickSound, playSubmitSound } from "./sound.js";

let canvas = document.getElementsByTagName("canvas")[0];
let entityCountView = document.getElementById("entity-count");
let fpsView = document.getElementById("fps");
let upsView = document.getElementById("ups");
let targetFpsView = document.getElementById("target-fps");
let targetUpsView = document.getElementById("target-ups");
let pauseMenuView = document.getElementById("pause-menu");
const mainMenuView = document.getElementById("main-menu");
const pauseResumeButton = document.getElementById("pause-resume");
const debugVelocityCheckbox = document.getElementById("debug-velocity");
const debugDrawHitboxes = document.getElementById("debug-hitbox");
const debugDrawTrajectory = document.getElementById("debug-trajectory");
const debugSplinePaths = document.getElementById("debug-spline-paths");
const debugRocketSpeed = document.getElementById("debug-rocket-speed");
const fireRateView = document.getElementById("fire-rate");
const hpView = document.getElementById("hp");
const gameOverView = document.getElementById("game-over");
const timePlayedView = document.getElementById("time-played");
const asteroidsDestroyedView = document.getElementById("asteroids-destroyed");
const distanceTraveledView = document.getElementById("distance-traveled");
const damageDealtView = document.getElementById("damage-dealt");
const startButton = document.getElementById("start");
const restartButton = document.getElementById("restart");
const volumeSlider = document.getElementById("volume");
const modePacifistView = document.getElementById("mode-pacifist");
const modeStationaryView = document.getElementById("mode-stationary");
const markPacifistView = document.getElementById("mark-pacifist");
const markStationaryView = document.getElementById("mark-stationary");
const backToMainMenuButton = document.getElementById("back-to-main-menu");

export const init = (
  start,
  setWeaponsEnabled,
  setMovementEnabled,
  setVolumeModifier,
  setDesiredFrameTime,
  setDesiredDeltaTime,
  setRocketSpeed,
  resume,
  reset
) => {
  initMainMenu(start, reset, setWeaponsEnabled, setMovementEnabled);
  initPauseMenu(setVolumeModifier, setDesiredFrameTime, setDesiredDeltaTime, setRocketSpeed, resume);
  initGameOverMenu(start, reset);
};

export const initMainMenu = (start, reset, setWeaponsEnabled, setMovementEnabled) => {
  startButton.addEventListener("click", () => {
    playSubmitSound();
    hideMainMenu();
    reset();
    start();
  });
  modePacifistView.addEventListener("change", (event) => {
    playClickSound();
    setWeaponsEnabled(!event.target.checked);
  });
  modeStationaryView.addEventListener("change", (event) => {
    playClickSound();
    setMovementEnabled(!event.target.checked);
  });
};

export const showMainMenu = () => {
  mainMenuView.style.display = "grid";
};

export const hideMainMenu = () => {
  mainMenuView.style.display = "none";
};

export const initPauseMenu = (setVolumeModifier, setDesiredFrameTime, setDesiredDeltaTime, setRocketSpeed, resume) => {
  volumeSlider.addEventListener("input", (event) => {
    setVolumeModifier(event.target.value / 100);
  });
  targetFpsView.addEventListener("change", (event) => {
    playClickSound();
    event.target.value = Math.max(0, Math.min(1000, Number(event.target.value)));
    setDesiredFrameTime(1000 / event.target.value);
  });
  targetUpsView.addEventListener("change", (event) => {
    playClickSound();
    event.target.value = Math.max(0, Math.min(1000, Number(event.target.value)));
    setDesiredDeltaTime(1000 / event.target.value);
  });
  debugVelocityCheckbox.addEventListener("change", (event) => {
    playClickSound();
    renderer.setVelocityDrawing(event.target.checked);
  });
  debugDrawHitboxes.addEventListener("change", (event) => {
    playClickSound();
    renderer.setDrawHitboxes(event.target.checked);
  });
  debugDrawTrajectory.addEventListener("change", (event) => {
    playClickSound();
    renderer.setDrawTrajectory(event.target.checked);
  });
  debugSplinePaths.addEventListener("change", (event) => {
    playClickSound();
    renderer.setDrawSplinePaths(event.target.checked);
  });
  debugRocketSpeed.addEventListener("change", (event) => {
    playClickSound();
    event.target.value = Math.max(0, Math.min(1000, Number(event.target.value)));
    setRocketSpeed(event.target.value);
  });
  pauseResumeButton.addEventListener("click", () => {
    playSubmitSound();
    hidePauseMenu();
    resume();
  });
};

export const showPauseMenu = () => {
  pauseMenuView.style.display = "flex";
};

export const hidePauseMenu = () => {
  pauseMenuView.style.display = "none";
};

export const initGameOverMenu = (start, reset) => {
  restartButton.addEventListener("click", () => {
    playSubmitSound();
    hideGameOverMenu();
    reset();
    start();
  });
  backToMainMenuButton.addEventListener("click", () => {
    playSubmitSound();
    hideGameOverMenu();
    showMainMenu();
  });
};

export const showGameOverMenu = () => {
  gameOverView.style.display = "grid";
};

export const hideGameOverMenu = () => {
  gameOverView.style.display = "none";
};

export const updateGameOverMenu = (weaponsEnabled, movementEnabled, current, best) => {
  markPacifistView.style.display = weaponsEnabled ? "none" : "block";
  markStationaryView.style.display = movementEnabled ? "none" : "block";

  setGameOverStat(timePlayedView, (current.timePlayed / 1000).toFixed(1), (best.timePlayed / 1000).toFixed(1), "s");
  setGameOverStat(asteroidsDestroyedView, current.asteroidsDestroyed, best.asteroidsDestroyed);
  setGameOverStat(distanceTraveledView, current.distanceTraveled.toFixed(1), best.distanceTraveled.toFixed(1), "m");
  setGameOverStat(damageDealtView, current.damageDealt, best.damageDealt, "hp");
};

const setGameOverStat = (view, value, best, unit) => {
  view.children.item(1).innerText = unit ? `${value} ${unit}` : `${value}`;
  view.children.item(2).classList.remove("new-best");
  view.children.item(2).classList.remove("previous-best");
  if (value > best) {
    view.children.item(2).classList.add("new-best");
    view.children.item(2).innerText = "New best!";
  } else {
    view.children.item(2).classList.add("previous-best");
    view.children.item(2).innerText = `( Best: ${unit ? `${best} ${unit}` : best} )`;
  }
};

export const updateFireRate = (bulletCooldown) => {
  fireRateView.innerText = `${Math.round(1000 / bulletCooldown)} shots/s`;
};

export const updateHp = (hp) => {
  if (hp == 5) {
    for (let heart of hpView.children) {
      heart.style.color = "red";
    }
  } else {
    hpView.children.item(hp).style.color = "grey";
  }
};

export const updateDebugHeader = (entityCount, fps, ups) => {
  entityCountView.innerText = `${entityCount}`;
  fpsView.innerText = `${fps}`;
  upsView.innerText = `${ups}`;
};

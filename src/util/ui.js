import * as renderer from "../renderer/2d.js";
import { playClickSound, playSubmitSound } from "./sound.js";

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
const rocketPiercingView = document.getElementById("rocket-piercing");
const bulletDamageView = document.getElementById("bullet-damage");
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
const modeExtremeView = document.getElementById("mode-extreme");
const markPacifistView = document.getElementById("mark-pacifist");
const markStationaryView = document.getElementById("mark-stationary");
const markExtremeView = document.getElementById("mark-extreme");
const backToMainMenuButton = document.getElementById("back-to-main-menu");
const pauseBackToMainMenuButton = document.getElementById("pause-back-to-main-menu");
const controlsMoveView = document.getElementById("controls-move");
const controlsBulletView = document.getElementById("controls-bullet");
const controlsRocketView = document.getElementById("controls-rocket");

export const init = (
  start,
  setWeaponsEnabled,
  setMovementEnabled,
  setVolumeModifier,
  setDesiredFrameTime,
  setDesiredDeltaTime,
  setRocketSpeed,
  resume,
  reset,
  setExtremeModeEnabled
) => {
  initMainMenu(start, reset, setWeaponsEnabled, setMovementEnabled, setExtremeModeEnabled);
  initPauseMenu(setVolumeModifier, setDesiredFrameTime, setDesiredDeltaTime, setRocketSpeed, resume);
  initGameOverMenu(start, reset);
};

export const initMainMenu = (start, reset, setWeaponsEnabled, setMovementEnabled, setExtremeModeEnabled) => {
  startButton.addEventListener("click", () => {
    playSubmitSound();
    hideMainMenu();
    reset();
    start();
  });
  modePacifistView.addEventListener("change", (event) => {
    playClickSound();
    setWeaponsEnabled(!event.target.checked);
    if (event.target.checked) {
      controlsBulletView.setAttribute("disabled", "true");
      controlsRocketView.setAttribute("disabled", "true");
    } else {
      controlsBulletView.removeAttribute("disabled");
      controlsRocketView.removeAttribute("disabled");
    }
  });
  modeStationaryView.addEventListener("change", (event) => {
    playClickSound();
    setMovementEnabled(!event.target.checked);
    if (event.target.checked) {
      controlsMoveView.setAttribute("disabled", "true");
    } else {
      controlsMoveView.removeAttribute("disabled");
    }
  });
  modeExtremeView.addEventListener("change", (event) => {
    playClickSound();
    setExtremeModeEnabled(event.target.checked);
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
  pauseBackToMainMenuButton.addEventListener("click", () => {
    playSubmitSound();
    hidePauseMenu();
    showMainMenu();
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

export const updateGameOverMenu = (weaponsEnabled, movementEnabled, isExtreme, current, best) => {
  markPacifistView.style.display = weaponsEnabled ? "none" : "block";
  markStationaryView.style.display = movementEnabled ? "none" : "block";
  markExtremeView.style.display = isExtreme ? "block" : "none";

  setGameOverStat(timePlayedView, current.timePlayed / 1000, best.timePlayed / 1000, "s", 1);
  setGameOverStat(asteroidsDestroyedView, current.asteroidsDestroyed, best.asteroidsDestroyed);
  setGameOverStat(distanceTraveledView, current.distanceTraveled, best.distanceTraveled, "m", 1);
  setGameOverStat(damageDealtView, current.damageDealt, best.damageDealt, "hp", 0);
};

const setGameOverStat = (view, value, best, unit, decimals) => {
  view.children.item(1).innerText = unit ? `${value.toFixed(decimals)} ${unit}` : `${value.toFixed(decimals)}`;
  view.children.item(2).classList.remove("new-best");
  view.children.item(2).classList.remove("previous-best");
  if (value > best) {
    view.children.item(2).classList.add("new-best");
    view.children.item(2).innerText = "New best!";
  } else {
    view.children.item(2).classList.add("previous-best");
    view.children.item(2).innerText = `( Best: ${
      unit ? `${best.toFixed(decimals)} ${unit}` : best.toFixed(decimals)
    } )`;
  }
};

export const updateFireRate = (bulletCooldown) => {
  fireRateView.innerText = `${Math.round(1000 / bulletCooldown)}`;
};

export const updateRocketPiercing = (piercing) => {
  rocketPiercingView.innerText = `${piercing}`;
};

export const updateBulletDamage = (damage) => {
  bulletDamageView.innerText = damage.toFixed(1); 
};

export const updateHp = (hp) => {
  for (let i = 0; i < hpView.children.length; i++) {
    hpView.children.item(i).style.color = i < hp ? "red" : "grey";
  }
};

export const updateDebugHeader = (entityCount, fps, ups) => {
  entityCountView.innerText = `${entityCount}`;
  fpsView.innerText = `${fps}`;
  upsView.innerText = `${ups}`;
};

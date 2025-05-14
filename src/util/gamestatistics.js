const DEFAULT = {
  timePlayed: 0,
  asteroidsDestroyed: 0,
  damageDealt: 0,
  bulletsFired: 0,
  bulletsHit: 0,
  rocketsFired: 0,
  distanceTraveled: 0,
};

const BEST_STRING = JSON.stringify(DEFAULT);

const getScoreName = (isPacifist, isStationary, isExtreme, isHitless) =>
  "best" +
  (isPacifist ? "-pacifist" : "-default") +
  (isStationary ? "-stationary" : "-default") +
  (isExtreme ? "-extreme" : "-default") +
  (isHitless ? "-hitless" : "-default");

export const getBest = (isPacifist, isStationary, isExtreme, isHitless) => {
  const bestName = getScoreName(isPacifist, isStationary, isExtreme, isHitless);
  return JSON.parse(localStorage.getItem(bestName) || BEST_STRING);
};

export const gameState = { ...DEFAULT };

export const trackScore = (isPacifist, isStationary, isExtreme) => {
  const best = getBest(isPacifist, isStationary, isExtreme);
  best.timePlayed = Math.max(best.timePlayed, gameState.timePlayed);
  best.asteroidsDestroyed = Math.max(best.asteroidsDestroyed, gameState.asteroidsDestroyed);
  best.damageDealt = Math.max(best.damageDealt, gameState.damageDealt);
  best.bulletsFired = Math.max(best.bulletsFired, gameState.bulletsFired);
  best.bulletsHit = Math.max(best.bulletsHit, gameState.bulletsHit);
  best.rocketsFired = Math.max(best.rocketsFired, gameState.rocketsFired);
  best.distanceTraveled = Math.max(best.distanceTraveled, gameState.distanceTraveled);
  localStorage.setItem(getScoreName(isPacifist, isStationary, isExtreme), JSON.stringify(best));
};

export const resetGameState = () => {
  gameState.timePlayed = DEFAULT.timePlayed;
  gameState.asteroidsDestroyed = DEFAULT.asteroidsDestroyed;
  gameState.damageDealt = DEFAULT.damageDealt;
  gameState.bulletsFired = DEFAULT.bulletsFired;
  gameState.bulletsHit = DEFAULT.bulletsHit;
  gameState.rocketsFired = DEFAULT.rocketsFired;
  gameState.distanceTraveled = DEFAULT.distanceTraveled;
};

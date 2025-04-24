const DEFAULT = {
  timePlayed: 0,
  asteroidsDestroyed: 0,
  damageDealt: 0,
  bulletsFired: 0,
  bulletsHit: 0,
  rocketsFired: 0,
  distanceTraveled: 0,
};

export const BEST = { ...DEFAULT };

export const gameState = { ...DEFAULT };

export const resetGameState = () => {
  // highscores
  BEST.timePlayed = Math.max(BEST.timePlayed, gameState.timePlayed);
  BEST.asteroidsDestroyed = Math.max(BEST.asteroidsDestroyed, gameState.asteroidsDestroyed);
  BEST.damageDealt = Math.max(BEST.damageDealt, gameState.damageDealt);
  BEST.bulletsFired = Math.max(BEST.bulletsFired, gameState.bulletsFired);
  BEST.bulletsHit = Math.max(BEST.bulletsHit, gameState.bulletsHit);
  BEST.rocketsFired = Math.max(BEST.rocketsFired, gameState.rocketsFired);
  BEST.distanceTraveled = Math.max(BEST.distanceTraveled, gameState.distanceTraveled);

  // reset game state
  gameState.timePlayed = DEFAULT.timePlayed;
  gameState.asteroidsDestroyed = DEFAULT.asteroidsDestroyed;
  gameState.damageDealt = DEFAULT.damageDealt;
  gameState.bulletsFired = DEFAULT.bulletsFired;
  gameState.bulletsHit = DEFAULT.bulletsHit;
  gameState.rocketsFired = DEFAULT.rocketsFired;
  gameState.distanceTraveled = DEFAULT.distanceTraveled;
};

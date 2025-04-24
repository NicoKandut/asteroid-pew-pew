const DEFAULT = {
  asteroidsDestroyed: 0,
  bulletsFired: 0,
  rocketsFired: 0,
  distanceTraveled: 0,
  timePlayed: 0,
};

export const BEST = { ...DEFAULT };

export const gameState = { ...DEFAULT };

export const resetGameState = () => {
  // highscores
  BEST.asteroidsDestroyed = Math.max(BEST.asteroidsDestroyed, gameState.asteroidsDestroyed);
  BEST.bulletsFired = Math.max(BEST.bulletsFired, gameState.bulletsFired);
  BEST.rocketsFired = Math.max(BEST.rocketsFired, gameState.rocketsFired);
  BEST.distanceTraveled = Math.max(BEST.distanceTraveled, gameState.distanceTraveled);
  BEST.timePlayed = Math.max(BEST.timePlayed, gameState.timePlayed);

  // reset game state
  gameState.asteroidsDestroyed = DEFAULT.asteroidsDestroyed;
  gameState.bulletsFired = DEFAULT.bulletsFired;
  gameState.rocketsFired = DEFAULT.rocketsFired;
  gameState.distanceTraveled = DEFAULT.distanceTraveled;
  gameState.timePlayed = DEFAULT.timePlayed;
};

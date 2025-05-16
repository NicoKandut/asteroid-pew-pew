const canvas = document.getElementsByTagName("canvas")[0];

let onlySplitable = false;

export const setOnlySplitable = (draw) => {
  onlySplitable = draw;
}

export const randomPosition = () => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
  };
};

export const randomPositionOnEdge = () => {
  const edge = Math.floor(Math.random() * 4);
  const padding = 90;

  switch (edge) {
    case 0: // Top edge
      return { x: Math.random() * canvas.width, y: -padding };
    case 1: // Right edge
      return { x: canvas.width + padding, y: Math.random() * canvas.height };
    case 2: // Bottom edge
      return { x: Math.random() * canvas.width, y: canvas.height + padding };
    case 3: // Left edge
      return { x: -padding, y: Math.random() * canvas.height };
  }
};

export const randomVelocity = (scale) => {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: Math.cos(angle) * scale,
    y: Math.sin(angle) * scale,
  };
};

export const randomAngularVelocity = (scale) => {
  return (Math.random() * 2 - 1) * scale;
};

export const randomAsteroidSize = (timePlayed) => {
  const sizes = [20, 30, 40];
  if (timePlayed > 30000) {
    sizes.shift();
    sizes.push(50);
  }
  if (timePlayed > 60000) {
    sizes.shift();
    sizes.push(60);
  }
  if (timePlayed > 90000) {
    sizes.shift();
    sizes.push(80);
  }
  if (timePlayed > 120000) {
    sizes.shift();
    sizes.push(100);
  }
  return sizes[Math.floor(Math.random() * sizes.length)];
};

export const randomPowerupType = () => {
  const types = ["health", "damage", "rocket-piercing"];
  const probabilities = [0.6, 0.9, 1.0];
  const randomValue = Math.random();
  for (let i = 0; i < types.length; i++) {
    if (randomValue < probabilities[i]) {
      return types[i];
    }
  }
  return types[types.length - 1];
};

export const randomRangeWithProbability = (values, probabilities) => {
  const randomValue = Math.random();
  let cumulativeProbability = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (randomValue < cumulativeProbability) {
      return values[i];
    }
  }
  return values[probabilities.length - 1];
};

export const randomAsteroidType = () => {
  const types = ["default", "split", "homing", "armored", "turret"];
  const probabilities = [0.65, 0.2, 0.05, 0.05, 0.05];
  return onlySplitable ? "split" : randomRangeWithProbability(types, probabilities);
};

export const randomAsteroidTypeExtreme = () => {
  const types = ["homing", "armored", "turret"];
  const probabilities = [0.34, 0.33, 0.33];
  return randomRangeWithProbability(types, probabilities);
};
const canvas = document.getElementsByTagName("canvas")[0];

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
      return { x: Math.random() * canvas.width, y: - padding };
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

export const randomAsteroidSize = () => {
  const sizes = [20, 30, 40];
  return sizes[Math.floor(Math.random() * sizes.length)];
};

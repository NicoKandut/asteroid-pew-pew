const canvas = document.getElementsByTagName("canvas")[0];

export const randomPosition = () => {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
  };
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

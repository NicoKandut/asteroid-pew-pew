export const dot = (a, b) => {
  return a.x * b.x + a.y * b.y;
};

export const normalize = (vector) => {
  const length = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
};

export const reflect = (vector, normal) => {
  const dotProduct = dot(vector, normal);
  return {
    x: vector.x - 2 * dotProduct * normal.x,
    y: vector.y - 2 * dotProduct * normal.y,
  };
};

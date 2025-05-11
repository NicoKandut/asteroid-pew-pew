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

export const add = (a, b) => {
  return { x: a.x + b.x, y: a.y + b.y };
}

export const sub = (a, b) => {
  return { x: a.x - b.x, y: a.y - b.y };
};

export const scale = (vector, scalar) => {
  vector.x *= scalar;
  vector.y *= scalar;
}

export const angleToUnitVector = (angle) => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
})

export const angleOfVector = (vector) => {
  const angle = Math.atan2(vector.y, vector.x);
  return angle < 0 ? angle + Math.PI * 2 : angle;
}

export const length = (vector) => {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2);
}
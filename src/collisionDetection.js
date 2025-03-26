export const checkIntersectionAsteroidAsteroid = (a, b) => {
  const distance = Math.sqrt(
    (a.position.x - b.position.x) ** 2 + (a.position.y - b.position.y) ** 2
  );

  if (distance < a.radius + b.radius) {
    return true;
  }

  return false;
};

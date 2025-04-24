import { normalize } from "../util/linalg.js";

export const createPhysicsEntity = () => {
  return {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    force: { x: 0, y: 0 },
    rotation: 0,
    angularVelocity: 0,
    angularAcceleration: 0,
    torque: 0,
    mass: 1,
    inertia: 1,
    radius: 0,
    drag: 1,
    height: 0,
    width: 0,
    maxVelocity: 1,
    parent: null,
    texture: null
  };
};

export const velocityVerlet = (entity, dt) => {
  if (entity.frozen) {
    return;
  }
  entity.position.x += entity.velocity.x * dt + 0.5 * entity.acceleration.x * dt ** 2;
  entity.position.y += entity.velocity.y * dt + 0.5 * entity.acceleration.y * dt ** 2;
  entity.rotation += entity.angularVelocity * dt + 0.5 * entity.angularAcceleration * dt ** 2;
  entity.velocity.x += entity.drag * entity.acceleration.x * dt;
  entity.velocity.y += entity.drag * entity.acceleration.y * dt;
  const velocityMagnitude = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2);
  if (velocityMagnitude > entity.maxVelocity) {
    entity.velocity.x /= velocityMagnitude / entity.maxVelocity;
    entity.velocity.y /= velocityMagnitude / entity.maxVelocity;
  }
  entity.angularVelocity += entity.angularAcceleration * dt;
  entity.acceleration.x = entity.force.x / entity.mass;
  entity.acceleration.y = entity.force.y / entity.mass;
  entity.angularAcceleration = entity.torque / entity.inertia;
  entity.force.x = 0;
  entity.force.y = 0;
  entity.torque = 0;
};

export const applyForce = (entity, force, torque) => {
  entity.force.x += force.x;
  entity.force.y += force.y;
  entity.torque += torque;
};

export const distanceBetween = (a, b) => {
  return Math.sqrt((b.position.x - a.position.x) ** 2 + (b.position.y - a.position.y) ** 2);
};

export const checkCollision = (a, b) => {
  const distance = distanceBetween(a, b);
  return distance < a.radius + b.radius;
};

export const checkAndResolveCollision = (a, b, elasticity, subOverlap) => {
  const distance = distanceBetween(a, b);
  if (distance >= a.radius + b.radius) {
    return false;
  }

  const normal = {
    x: (b.position.x - a.position.x) / distance,
    y: (b.position.y - a.position.y) / distance,
  };
  const momentum =
    (2 * (a.velocity.x * normal.x + a.velocity.y * normal.y - b.velocity.x * normal.x - b.velocity.y * normal.y)) /
    (a.mass + b.mass);
  const overlap = a.radius + b.radius - distance;

  if (subOverlap) {
    if (!a.frozen) {
      a.position.x -= normal.x * overlap;
      a.position.y -= normal.y * overlap;
    }
    if (!b.frozen) {
      b.position.x += normal.x * overlap;
      b.position.y += normal.y * overlap;
    }
  }
  a.velocity.x -= momentum * elasticity * b.mass * normal.x;
  a.velocity.y -= momentum * elasticity * b.mass * normal.y;
  b.velocity.x += momentum * elasticity * a.mass * normal.x;
  b.velocity.y += momentum * elasticity * a.mass * normal.y;

  return true;
};

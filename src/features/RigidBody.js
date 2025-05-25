import * as renderer from "../renderer/2d.js";
import { sub, dot, mul, scale, lerp, normalize, length } from "../util/linalg.js";

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
    texture: null,
    fractureSeeds: [],
    textureReady: false,
    voronoiData: null,
  };
};

export const velocityVerlet = (entity, dt) => {
  if (entity.frozen) {
    return;
  }

  // linear
  entity.position.x += entity.velocity.x * dt + 0.5 * entity.acceleration.x * dt ** 2;
  entity.position.y += entity.velocity.y * dt + 0.5 * entity.acceleration.y * dt ** 2;
  entity.velocity.x += entity.drag * entity.acceleration.x * dt;
  entity.velocity.y += entity.drag * entity.acceleration.y * dt;
  entity.acceleration.x = entity.force.x / entity.mass;
  entity.acceleration.y = entity.force.y / entity.mass;
  entity.force.x = 0;
  entity.force.y = 0;

  // angular
  entity.rotation += entity.angularVelocity * dt + 0.5 * entity.angularAcceleration * dt ** 2;
  entity.angularVelocity += entity.angularAcceleration * dt;
  entity.angularAcceleration = entity.torque / entity.inertia;
  entity.torque = 0;

  // check max-velocity
  const velocityMagnitude = Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2);
  if (velocityMagnitude > entity.maxVelocity) {
    entity.velocity.x /= velocityMagnitude / entity.maxVelocity;
    entity.velocity.y /= velocityMagnitude / entity.maxVelocity;
  }

  if (isNaN(entity.position.x) || isNaN(entity.position.y)) {
    console.warn("Entity position is NaN", entity);
    entity.position.x = 0;
    entity.position.y = 0;
  }
};

export const applyForce = (entity, force, torque) => {
  entity.force.x += force.x;
  entity.force.y += force.y;
  entity.torque += torque;
};

export const distanceBetween = (a, b) => {
  return Math.sqrt((b.position.x - a.position.x) ** 2 + (b.position.y - a.position.y) ** 2);
};

export const checkCollisionDiscDisc = (a, b) => {
  const distance = distanceBetween(a, b);
  return distance < a.radius + b.radius;
};

export const checkCollisionDiscBox = (disc, box) => {
  const difference = sub(disc.position, box.position);
  const cos = Math.cos(-box.rotation);
  const sin = Math.sin(-box.rotation);
  const local = {
    x: difference.x * cos - difference.y * sin,
    y: difference.x * sin + difference.y * cos,
  };
  const closest = {
    x: Math.max(-width / 2, Math.min(local.x, width / 2)),
    y: Math.max(-height / 2, Math.min(local.y, height / 2)),
  };
  const distance = sub(local, closest);
  const distanceSquared = dot(distance, distance);
  return distanceSquared <= radius * radius;
};

export const checkCollisionBoxBox = (a, b) => {
  const distance = distanceBetween(a, b);
  return distance < a.radius + b.radius;
};

export const checkAndResolveCollision = (a, b, onCollision) => {
  const distance = distanceBetween(a, b);
  const radii = a.radius + b.radius;
  if (distance >= radii) {
    return false;
  }

  // Calculate colllision
  const collisionPoint = lerp(a.position, b.position, a.radius / distance);
  const normal = normalize(sub(b.position, a.position)); // points from a to b
  const tangent = {
    x: -normal.y,
    y: normal.x,
  };
  const overlap = radii - distance + 0.00001; // +small epsilon
  const totalMass = a.mass + b.mass;

  a.position.x -= (normal.x * overlap * b.mass) / totalMass;
  a.position.y -= (normal.y * overlap * b.mass) / totalMass;

  b.position.x += (normal.x * overlap * a.mass) / totalMass;
  b.position.y += (normal.y * overlap * a.mass) / totalMass;

  if (distanceBetween(a, b) < radii) {
    console.warn("Collision resolution failed");
  }

  const relativeVelocity = sub(a.velocity, b.velocity);

  const momentumA = ((2 * b.mass) / totalMass) * dot(relativeVelocity, normal);
  const momentumB = ((2 * a.mass) / totalMass) * dot(relativeVelocity, normal);

  const distanceA = sub(collisionPoint, a.position);
  const distanceB = sub(collisionPoint, b.position);

  const torqueA = distanceA.x * momentumA * tangent.x + distanceA.y * momentumA * tangent.y;
  const torqueB = distanceB.x * momentumB * tangent.x + distanceB.y * momentumB * tangent.y;

  const oldVelocityA = { ...a.velocity };
  const oldVelocityB = { ...b.velocity };

  const oldAngularVelocityA = a.angularVelocity;
  const oldAngularVelocityB = b.angularVelocity;

  if (!a.frozen) {
    a.velocity.x -= momentumA * normal.x;
    a.velocity.y -= momentumA * normal.y;
    a.torque += torqueA;
  }
  if (!b.frozen) {
    b.velocity.x += momentumB * normal.x;
    b.velocity.y += momentumB * normal.y;
    b.torque += torqueB;
  }

  const collisionA = {
    radius: a.radius,
    position: { ...a.position },
    newVelocity: { ...a.velocity },
    oldVelocity: oldVelocityA,
    newAngularVelocity: a.angularVelocity,
    oldAngularVelocity: oldAngularVelocityA,
  };
  const collisionB = {
    radius: b.radius,
    position: { ...b.position },
    newVelocity: { ...b.velocity },
    oldVelocity: oldVelocityB,
    newAngularVelocity: b.angularVelocity,
    oldAngularVelocity: oldAngularVelocityB,
  };

  onCollision(collisionA, collisionB, collisionPoint, normal);

  if (isNaN(a.position.x) || isNaN(a.position.y) || isNaN(b.position.x) || isNaN(b.position.y)) {
    console.warn("Entity position is NaN after collision resolution", a, b);
    a.position.x = 0;
    a.position.y = 0;
    b.position.x = 0;
    b.position.y = 0;
  }

  return true;
};

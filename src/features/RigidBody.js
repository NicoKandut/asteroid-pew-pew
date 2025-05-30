import * as renderer from "../renderer/2d.js";
import {
  sub,
  dot,
  mul,
  scale,
  lerp,
  normalize,
  length,
  angleToUnitVector,
  add,
  cross2D,
  cross2DVec,
} from "../util/linalg.js";

export const BOX = "box";
export const DISC = "disc";

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

export const calculateTotalMomentum = (asteroids) => {
  let totalMomentum = { x: 0, y: 0 };
  for (const asteroid of asteroids) {
    if (asteroid.frozen) {
      continue;
    }
    totalMomentum.x += asteroid.velocity.x * asteroid.mass;
    totalMomentum.y += asteroid.velocity.y * asteroid.mass;
  }

  if (isNaN(totalMomentum.x) || isNaN(totalMomentum.y)) {
    console.warn("Total momentum is NaN", totalMomentum);
    debugger;
  }

  return Math.sqrt(totalMomentum.x ** 2 + totalMomentum.y ** 2);
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
    debugger;
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
  const radii = a.radius + b.radius;
  if (distance < radii) {
    const normal = normalize(sub(b.position, a.position));
    const collisionPoint = lerp(a.position, b.position, a.radius / distance);
    const overlap = radii - distance; // +small epsilon
    return {
      collisionPoint,
      normal,
      overlap,
    };
  } else {
    return null;
  }
};

export const getCorners = (box) => {
  const size = { x: box.width / 2, y: box.height / 2 };
  const u = angleToUnitVector(box.rotation);
  const v = { x: -u.y, y: u.x };
  return [
    { x: box.position.x - size.x * u.x - size.y * v.x, y: box.position.y - size.x * u.y - size.y * v.y },
    { x: box.position.x + size.x * u.x - size.y * v.x, y: box.position.y + size.x * u.y - size.y * v.y },
    { x: box.position.x + size.x * u.x + size.y * v.x, y: box.position.y + size.x * u.y + size.y * v.y },
    { x: box.position.x - size.x * u.x + size.y * v.x, y: box.position.y - size.x * u.y + size.y * v.y },
  ];
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
    x: Math.max(-box.width / 2, Math.min(local.x, box.width / 2)),
    y: Math.max(-box.height / 2, Math.min(local.y, box.height / 2)),
  };

  const distance = sub(local, closest);
  const d = Math.sqrt(distance.x * distance.x + distance.y * distance.y);

  if (d <= disc.radius) {
    const cos = Math.cos(box.rotation);
    const sin = Math.sin(box.rotation);
    const closestGlobal = {
      x: box.position.x + closest.x * cos - closest.y * sin,
      y: box.position.y + closest.x * sin + closest.y * cos,
    };
    const normal = normalize(sub(disc.position, closestGlobal));
    const difference = normalize(sub(box.position, disc.position));
    const similarity = dot(normal, difference);
    if (similarity < 0) {
      normal.x = -normal.x;
      normal.y = -normal.y;
    }

    if (isNaN(normal.x) || isNaN(normal.y)) {
      console.warn("Collision normal is NaN", disc, box, normal);
      return null;
    }

    const collisionPoint = {
      x: disc.position.x + normal.x * disc.radius,
      y: disc.position.y + normal.y * disc.radius,
    };
    const overlap = disc.radius - d + 0.00001; // +small epsilon

    if (isNaN(collisionPoint.x) || isNaN(collisionPoint.y)) {
      console.warn("Collision point is NaN", disc, box, collisionPoint);
      return null;
    }

    return {
      collisionPoint,
      normal,
      overlap,
    };
  }
};

export const checkCollisionBoxDisc = (box, disc) => {
  const collision = checkCollisionDiscBox(disc, box);
  if (collision === null || collision === undefined) {
    return null;
  }

  collision.normal.x = -collision.normal.x;
  collision.normal.y = -collision.normal.y;

  return collision;
};

export const checkCollisionBoxBox = (a, b) => {
  const aU = angleToUnitVector(a.rotation);
  const aV = { x: -aU.y, y: aU.x };

  const bU = angleToUnitVector(b.rotation);
  const bV = { x: -bU.y, y: bU.x };

  const aCorners = getCorners(a);
  const bCorners = getCorners(b);

  const axes = [aU, aV, bU, bV];

  let aInBCornersIndices = [0, 1, 2, 3];
  let bInACornersIndices = [0, 1, 2, 3];

  let collisionPoint;
  let normal;
  let overlap = Infinity;

  for (let i = 0; i < axes.length; ++i) {
    const axis = axes[i];
    const projectToAxis = (corner) => dot(corner, axis);

    const aProj = aCorners.map(projectToAxis);
    const bProj = bCorners.map(projectToAxis);

    const aMin = Math.min(...aProj);
    const aMax = Math.max(...aProj);
    const bMin = Math.min(...bProj);
    const bMax = Math.max(...bProj);

    if (aMax < bMin || bMax < aMin) {
      return null; // No collision
    }

    if (i < 2) {
      bInACornersIndices = bInACornersIndices.filter((j) => bProj[j] >= aMin && bProj[j] <= aMax);
    } else {
      aInBCornersIndices = aInBCornersIndices.filter((j) => aProj[j] >= bMin && aProj[j] <= bMax);
    }

    const max = Math.min(aMax, bMax);
    const min = Math.max(aMin, bMin);

    const overlapAmount = max - min;

    if (overlapAmount < overlap) {
      overlap = overlapAmount;
      normal = axis;
    }
  }

  const corners = [...aInBCornersIndices.map((j) => aCorners[j]), ...bInACornersIndices.map((j) => bCorners[j])];

  if (corners.length === 0) {
    console.warn("No corners found for collision, this should not happen", a, b);
    return null; // No collision
  }

  const corner = corners.reduce((c1, c2) => ({ x: c1.x + c2.x, y: c1.y + c2.y }), { x: 0, y: 0 });
  corner.x /= corners.length;
  corner.y /= corners.length;

  collisionPoint = corner;

  validateCollision(collisionPoint, normal, overlap);

  const difference = normalize(sub(b.position, a.position));
  const similarity = dot(normal, difference);
  if (similarity < 0) {
    normal.x = -normal.x;
    normal.y = -normal.y;
  }

  return {
    collisionPoint,
    normal,
    overlap,
  };
};

const isBox = (entity) => entity.collider === BOX;

const isDisc = (entity) => entity.collider === DISC;

const validateCollision = (collisionPoint, normal, overlap) => {
  if (isNaN(collisionPoint.x) || isNaN(collisionPoint.y)) {
    console.warn("Collision point is NaN", a, b, collisionPoint);
    debugger;
  }

  if (isNaN(normal.x) || isNaN(normal.y)) {
    console.warn("Collision normal is NaN", a, b, normal);
    debugger;
  }

  if (isNaN(overlap)) {
    console.warn("Collision overlap is NaN", a, b, overlap);
    debugger;
  }
};

export const checkAndResolveCollision = (a, b, onCollision) => {
  let collision;

  if (isBox(a) && isBox(b)) {
    collision = checkCollisionBoxBox(a, b);
  } else if (isDisc(a) && isBox(b)) {
    collision = checkCollisionDiscBox(a, b);
  } else if (isBox(a) && isDisc(b)) {
    collision = checkCollisionBoxDisc(a, b);
  } else if (isDisc(a) && isDisc(b)) {
    collision = checkCollisionDiscDisc(a, b);
  }

  if (collision === undefined || collision === null) {
    return false;
  }

  let { collisionPoint, normal, overlap } = collision;

  overlap += 0.00001; // +small epsilon

  if (overlap > 10) {
    console.warn("Collision overlap is too large, this should not happen", a, b, overlap);
  }

  // Calculate colllision
  const totalMass = a.mass + b.mass;

  const distanceA = sub(collisionPoint, a.position);
  const distanceB = sub(collisionPoint, b.position);

  a.position.x -= (normal.x * overlap * b.mass) / totalMass;
  a.position.y -= (normal.y * overlap * b.mass) / totalMass;

  b.position.x += (normal.x * overlap * a.mass) / totalMass;
  b.position.y += (normal.y * overlap * a.mass) / totalMass;

  let afterCollision;

  if (isBox(a) && isBox(b)) {
    afterCollision = checkCollisionBoxBox(a, b);
  } else if (isDisc(a) && isBox(b)) {
    afterCollision = checkCollisionDiscBox(a, b);
  } else if (isBox(a) && isDisc(b)) {
    afterCollision = checkCollisionDiscBox(b, a);
  } else if (isDisc(a) && isDisc(b)) {
    afterCollision = checkCollisionDiscDisc(a, b);
  }

  if (afterCollision !== undefined && afterCollision !== null) {
    console.warn("Collision still detected after resolving overlap", a, b, afterCollision);
  }

  const aVelocity = add(a.velocity, cross2D(distanceA, a.angularVelocity));
  const bVelocity = add(b.velocity, cross2D(distanceB, b.angularVelocity));

  const relativeVelocity = sub(aVelocity, bVelocity);
  const relativeNormalVelocity = dot(relativeVelocity, normal);

  // moving apart => no collision
  // if (relativeNormalVelocity > 0) {
  //   return false;
  // }

  const aN = cross2DVec(distanceA, normal);
  const bN = cross2DVec(distanceB, normal);

  const invMassSum = 1 / a.mass + 1 / b.mass + (aN * aN) / a.inertia + (bN * bN) / b.inertia;

  const j = (-2 * relativeNormalVelocity) / invMassSum;

  const impulse = {
    x: j * normal.x,
    y: j * normal.y,
  };

  const oldVelocityA = { ...a.velocity };
  const oldVelocityB = { ...b.velocity };

  const oldAngularVelocityA = a.angularVelocity;
  const oldAngularVelocityB = b.angularVelocity;

  if (!a.frozen) {
    a.velocity.x += impulse.x / a.mass;
    a.velocity.y += impulse.y / a.mass;
    a.angularVelocity += cross2DVec(distanceA, impulse) / a.inertia;
  }
  if (!b.frozen) {
    b.velocity.x -= impulse.x / b.mass;
    b.velocity.y -= impulse.y / b.mass;
    b.angularVelocity -= cross2DVec(distanceB, impulse) / b.inertia;
  }

  if (isNaN(a.velocity.x) || isNaN(a.velocity.y) || isNaN(b.velocity.x) || isNaN(b.velocity.y)) {
    console.warn("Entity velocity is NaN after collision resolution", a, b);
    debugger;
  }

  if (isNaN(a.angularVelocity) || isNaN(b.angularVelocity)) {
    console.warn("Entity angular velocity is NaN after collision resolution", a, b);
    debugger;
  }

  const collisionA = {
    collider: a.collider,
    position: { ...a.position },
    newVelocity: { ...a.velocity },
    oldVelocity: oldVelocityA,
    newAngularVelocity: a.angularVelocity,
    oldAngularVelocity: oldAngularVelocityA,
  };
  const collisionB = {
    collider: b.collider,
    position: { ...b.position },
    newVelocity: { ...b.velocity },
    oldVelocity: oldVelocityB,
    newAngularVelocity: b.angularVelocity,
    oldAngularVelocity: oldAngularVelocityB,
  };

  if (a.collider === DISC) {
    collisionA.radius = a.radius;
  }
  if (b.collider === DISC) {
    collisionB.radius = b.radius;
  }
  if (a.collider === BOX) {
    collisionA.width = a.width;
    collisionA.height = a.height;
    collisionA.rotation = a.rotation;
  }
  if (b.collider === BOX) {
    collisionB.width = b.width;
    collisionB.height = b.height;
    collisionB.rotation = b.rotation;
  }

  onCollision(collisionA, collisionB, collisionPoint, normal, overlap);

  if (isNaN(a.position.x) || isNaN(a.position.y) || isNaN(b.position.x) || isNaN(b.position.y)) {
    console.warn("Entity position is NaN after collision resolution", a, b);
    debugger;
  }

  return true;
};

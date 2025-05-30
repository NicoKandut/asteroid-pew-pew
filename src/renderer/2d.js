import * as ht from "../features/SceneHierarchy";
import boomUrl0 from "/img/boom/boom_0.gif?url";
import boomUrl1 from "/img/boom/boom_1.gif?url";
import boomUrl2 from "/img/boom/boom_2.gif?url";
import boomUrl3 from "/img/boom/boom_3.gif?url";
import boomUrl4 from "/img/boom/boom_4.gif?url";
import boomUrl5 from "/img/boom/boom_5.gif?url";
import boomUrl6 from "/img/boom/boom_6.gif?url";
import boomUrl7 from "/img/boom/boom_7.gif?url";
import boomUrl8 from "/img/boom/boom_8.gif?url";
import boomUrl9 from "/img/boom/boom_9.gif?url";
import boomUrl10 from "/img/boom/boom_10.gif?url";
import boomUrl11 from "/img/boom/boom_11.gif?url";
import boomUrl12 from "/img/boom/boom_12.gif?url";
import boomUrl13 from "/img/boom/boom_13.gif?url";
import boomUrl14 from "/img/boom/boom_14.gif?url";
// https://pixabay.com/vectors/ice-block-cube-frozen-cold-34075/
import iceUrl from "/img/ice.png?url";
import powerupUrl from "/img/powerup.png?url";

import { drawSeeds } from "../features/VoronoiFracture.js";
import { angleToUnitVector } from "../util/linalg.js";
import { getCorners } from "../features/RigidBody.js";

const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");

// ENTITY TYPES
export const ASTEROID = "asteroid";
export const BULLET = "bullet";
export const EXPLOSION = "explosion";
export const FLASH = "flash";
export const ROCKET = "rocket";
export const SPACESHIP = "spaceship";
export const VELOCITY = "velocity";
export const SPACESHIPPART = "spaceshippart";
export const FLAMES = "flames";
export const POWERUP = "powerup";
export const FLAME_PARTICLES = "flame_particles";
export const COLLISION = "collision";

// COLORS
const WHITE = "#ffffff";
const YELLOW = "#ffff00";
const RED = "#ff0000";
const GREEN = "#00ff00";

// RENDER IDENTIFIERS
let nextId = 0;
const getId = () => `${nextId++}`;

// RENDER DETAILS
const renderDetails = {
  [ASTEROID]: {
    color: WHITE,
  },
  [BULLET]: {
    color: YELLOW,
    length: 10,
    strokeWidth: 2,
  },
  [ROCKET]: {
    color: RED,
    radius: 10,
  },
  [SPACESHIP]: {
    color: GREEN,
  },
  [VELOCITY]: {
    color: RED,
  },
  [SPACESHIPPART]: {
    color: GREEN,
  },
  [FLAMES]: {
    color: RED,
  },
  [FLAME_PARTICLES]: {
    color: "blue",
  },
};

// CURRENT RENDERED ENTITIES
const entities = {
  [FLAMES]: {},
  [FLAME_PARTICLES]: {},
  [SPACESHIP]: {},
  [SPACESHIPPART]: {},
  [ASTEROID]: {},
  [BULLET]: {},
  [ROCKET]: {},
  [EXPLOSION]: {},
  [FLASH]: {},
  [POWERUP]: {},
  [COLLISION]: {},
};

let velocityDrawing = false;
let hitboxDrawing = false;
let trajectoryDrawing = false;
let drawSplinePaths = false;
let drawVornoiSeeds = false;
let drawDistanceFields = false;

export const setVelocityDrawing = (draw) => {
  velocityDrawing = draw;
};

export const setDrawHitboxes = (draw) => {
  hitboxDrawing = draw;
};

export const setDrawTrajectory = (draw) => {
  trajectoryDrawing = draw;
};

export const setDrawSplinePaths = (draw) => {
  drawSplinePaths = draw;
};

export const setDrawVoronoiSeeds = (draw) => {
  drawVornoiSeeds = draw;
};

export const setDrawDistanceFields = (draw) => {
  drawDistanceFields = draw;
};

// RENDER ENTITY MANAGEMENT
export const addEntity = (type, entity) => {
  entity.id = getId();
  entities[type][entity.id] = entity;
};

export const removeEntity = (type, id) => {
  delete entities[type][id];
  ht.removeTrajectory(id);
};

export const removeAllEntities = () => {
  for (const type in entities) {
    entities[type] = {};
  }
  ht.removeAllTrajectory();
};

const boomFrames = [];
for (let i = 0; i < 15; ++i) {
  boomFrames.push(new Image());
}
boomFrames[0].src = boomUrl0;
boomFrames[1].src = boomUrl1;
boomFrames[2].src = boomUrl2;
boomFrames[3].src = boomUrl3;
boomFrames[4].src = boomUrl4;
boomFrames[5].src = boomUrl5;
boomFrames[6].src = boomUrl6;
boomFrames[7].src = boomUrl7;
boomFrames[8].src = boomUrl8;
boomFrames[9].src = boomUrl9;
boomFrames[10].src = boomUrl10;
boomFrames[11].src = boomUrl11;
boomFrames[12].src = boomUrl12;
boomFrames[13].src = boomUrl13;
boomFrames[14].src = boomUrl14;

const iceImage = new Image();
iceImage.src = iceUrl;

// DRAWING
export const render = () => {
  // resize
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // clear
  context.clearRect(0, 0, canvas.width, canvas.height);

  // draw all entities by type

  for (const type in entities) {
    // configure drawing for entity type
    for (const entity of Object.values(entities[type])) {
      switch (type) {
        case ASTEROID:
          drawCircular(entity);
          break;
        case EXPLOSION:
          drawExplosion(entity);
          break;
        case BULLET:
          drawBullet(entity);
          break;
        case ROCKET:
          drawRocket(entity);
          break;
        case SPACESHIP:
        case SPACESHIPPART:
          drawRectangular(entity);
          break;
        case FLAMES:
          drawFlames(entity);
          break;
        case FLAME_PARTICLES:
          drawFlameParticles(entity);
          break;
        case FLASH:
          drawFlash(entity);
          break;
        case POWERUP:
          drawPowerup(entity);
          break;
        case COLLISION:
          drawCollision(entity);
          break;
      }

      if (type !== COLLISION && type !== EXPLOSION && type !== FLASH) {
        ht.addTrajectory(entity.id, ht.calcTransform(entity));
      }
    }

    //context.fill();
  }

  if (velocityDrawing) {
    context.strokeStyle = renderDetails[VELOCITY].color;
    context.lineWidth = 1;
    context.beginPath();
    for (const type in entities) {
      for (const entity of Object.values(entities[type])) {
        if ("velocity" in entity) {
          const { position, velocity } = entity;
          const { x, y } = position;
          const { x: vx, y: vy } = velocity;
          context.moveTo(x, y);
          context.lineTo(x + vx * 200, y + vy * 200);
        }
        if ("angularVelocity" in entity) {
          const { position, angularVelocity } = entity;
          const { x, y } = position;

          if (angularVelocity > 0) {
            context.moveTo(x + 20, y);
            context.arc(x, y, 20, 0, angularVelocity * 300);
          } else {
            context.moveTo(x + 20 * Math.cos(angularVelocity * 300), y + 20 * Math.sin(angularVelocity * 300));
            context.arc(x, y, 20, angularVelocity * 300, 0);
          }
        }
      }

      context.stroke();
    }
  }

  if (hitboxDrawing) {
    context.strokeStyle = "cyan";
    context.lineWidth = 1;
    context.beginPath();
    for (const type in entities) {
      for (const entity of Object.values(entities[type])) {
        addPathCollider(entity);
      }
    }
    context.stroke();
  }

  if (trajectoryDrawing) ht.drawTrajectory(context);
};

const drawCircular = (entity) => {
  const { width, height, radius, texture, textureReady, voronoiData } = entity;

  if (!textureReady) return;
  const transform = ht.calcTransform(entity);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  const calcWidth = width != 0 ? width : radius * 2;
  const clacHeight = height != 0 ? height : radius * 2;

  const drawTexture = drawDistanceFields && voronoiData ? voronoiData.heatMap : texture;

  context.drawImage(drawTexture, -radius, -radius, calcWidth, clacHeight);

  if (entity.frozen) {
    context.globalAlpha = 0.2;
    context.drawImage(iceImage, -radius - 20, -radius - 20, calcWidth + 40, clacHeight + 40);
    context.globalAlpha = 1;
  }

  context.restore();

  if (drawVornoiSeeds) {
    drawSeeds(context, entity);
  }
};

const drawBullet = (entity) => {
  const { length } = renderDetails[BULLET];
  const c = (Math.cos(entity.rotation) * length) / 2;
  const s = (Math.sin(entity.rotation) * length) / 2;
  context.fillStyle = entity.friendly ? renderDetails[BULLET].color : "red";
  context.strokeStyle = entity.friendly ? renderDetails[BULLET].color : "red";
  context.lineWidth = renderDetails[BULLET]?.strokeWidth ?? 0;
  context.beginPath();
  context.moveTo(entity.position.x + c, entity.position.y + s);
  context.lineTo(entity.position.x - c, entity.position.y - s);
  context.stroke();
};

const drawRocket = (entity) => {
  const { radius } = renderDetails[ROCKET];
  const third = (2 * Math.PI) / 8;
  const p1 = {
    x: entity.position.x + radius * Math.cos(entity.rotation),
    y: entity.position.y + radius * Math.sin(entity.rotation),
  };
  const p2 = {
    x: entity.position.x - radius * Math.cos(entity.rotation + third),
    y: entity.position.y - radius * Math.sin(entity.rotation + third),
  };
  const p3 = {
    x: entity.position.x - radius * Math.cos(entity.rotation - third),
    y: entity.position.y - radius * Math.sin(entity.rotation - third),
  };

  context.fillStyle = renderDetails[ROCKET].color;
  context.strokeStyle = renderDetails[ROCKET].color;
  context.lineWidth = renderDetails[ROCKET]?.strokeWidth ?? 0;

  context.beginPath();
  context.moveTo(p1.x, p1.y);
  context.lineTo(p2.x, p2.y);
  context.lineTo(p3.x, p3.y);
  context.lineTo(p1.x, p1.y);
  context.stroke();

  if (drawSplinePaths) {
    for (const target of entity.targets) {
      context.moveTo(target.position.x, target.position.y);
      context.arc(target.position.x, target.position.y, 4, 0, 2 * Math.PI);
    }
    context.fill();

    context.strokeStyle = "grey";
    context.beginPath();
    context.moveTo(entity.pathPoints[0].x, entity.pathPoints[0].y);
    for (const point of entity.pathPoints) {
      context.lineTo(point.x, point.y);
      context.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      context.moveTo(point.x, point.y);
    }
    context.lineTo(entity.targets[entity.targets.length - 1].x, entity.targets[entity.targets.length - 1].y);
    context.stroke();
  }
};

export const drawExplosion = (entity) => {
  const width = 100;
  const height = 100;
  context.translate(entity.position.x, entity.position.y);
  const texture = boomFrames[entity.frame];
  context.drawImage(texture, -width / 2, -height / 2, width, height);
  context.translate(-entity.position.x, -entity.position.y);
  if (entity.frame < boomFrames.length - 1) {
    entity.frame++;
  } else {
    removeEntity(EXPLOSION, entity.id);
  }
};

export const drawRectangular = (entity) => {
  const { width, height, texture, textureReady } = entity;

  if (!textureReady) return;

  const transform = ht.calcTransform(entity);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);
  context.drawImage(texture, -width / 2, -height / 2, width, height);
  context.restore();
};

export const drawFlames = (entity) => {
  const { width, height } = entity;
  const transform = ht.calcTransform(entity);

  const parentVelocity = entity?.parent?.velocity ?? { x: 0, y: 1 };
  const parentParentVelocity = entity?.parent?.parent?.velocity ?? { x: 0, y: 0 };
  const totalVelocity = {
    x: parentVelocity.x + parentParentVelocity.x,
    y: parentVelocity.y + parentParentVelocity.y,
  };
  const velocityScale = Math.min(Math.sqrt(totalVelocity.x ** 2 + totalVelocity.y ** 2) * 5, 2);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  context.beginPath();
  const flicker = Math.random() * 5;

  context.moveTo(0, 0);
  context.lineTo(-width, (height + flicker) * velocityScale);
  context.lineTo(width, (height + flicker) * velocityScale);
  context.closePath();

  context.fillStyle = "orange";
  context.fill();

  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-width / 2, (height / 2 + flicker) * velocityScale);
  context.lineTo(width / 2, (height / 2 + flicker) * velocityScale);
  context.closePath();

  context.fillStyle = "yellow";
  context.fill();

  context.restore();
};

export const drawFlameParticles = (entity) => {
  const { width, height } = entity;

  const transform = ht.calcTransform(entity);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  const particleCount = 5;
  for (let i = 0; i < particleCount; i++) {
    const offsetX = (Math.random() - 0.5) * width * 2;
    const offsetY = Math.random() + height;
    const size = 1 + Math.random() * 2;

    context.globalAlpha = 0.2 + Math.random() * 0.3;
    context.fillStyle = "blue";
    context.beginPath();
    context.arc(offsetX, offsetY, size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  context.restore();
};

const drawFlash = (entity) => {
  const center = entity.position;
  const rotation = entity.rotation;
  const innerRadius = 3;
  const outerRadius = 15;

  context.fillStyle = "white";
  context.strokeStyle = "none";
  context.beginPath();
  context.translate(center.x, center.y);
  context.rotate(rotation);
  context.moveTo(innerRadius, innerRadius);
  context.lineTo(outerRadius, 0);
  context.lineTo(innerRadius, -innerRadius);
  context.lineTo(0, -outerRadius);
  context.lineTo(-innerRadius, -innerRadius);
  context.lineTo(-outerRadius, 0);
  context.lineTo(-innerRadius, innerRadius);
  context.lineTo(0, outerRadius);
  context.resetTransform();
  context.closePath();
  context.fill();
};

const powerupImage = new Image();
powerupImage.src = powerupUrl;
const drawPowerup = (entity) => {
  const { width, height } = entity;

  const offsetX = width / 2;
  const offsetY = height / 2;

  context.save();
  context.translate(entity.position.x, entity.position.y);
  context.rotate(entity.rotation);
  context.drawImage(powerupImage, -offsetX, -offsetY, width, height);
  switch (entity.type) {
    case "health":
      context.textAlign = "center";
      context.font = "20px Arial";
      context.fillText("🧡", 0, 7);
      break;
    case "damage":
      context.fillStyle = "yellow";
      context.textAlign = "center";
      context.font = "20px Arial";
      context.fillText("=", 0, 7);
      break;
    case "rocket-piercing":
      context.textAlign = "center";
      context.font = "20px Arial";
      context.fillText("🚀", 0, 7);
      break;
    default:
      console.warn("Unknown powerup type:", entity.type);
  }
  context.restore();
};

const addPathAngularVelocity = (x, y, angularVelocity, radius, scale = 300) => {
  if (angularVelocity > 0) {
    context.moveTo(x + radius, y);
    context.arc(x, y, radius, 0, angularVelocity * scale);
  } else {
    context.moveTo(x + radius * Math.cos(angularVelocity * scale), y + radius * Math.sin(angularVelocity * scale));
    context.arc(x, y, radius, angularVelocity * scale, 0);
  }
};

const addPathCollider = (entity) => {
  switch (entity.collider) {
    case undefined:
      // no collider, skip
      break;
    case "disc":
      context.moveTo(entity.position.x + entity.radius, entity.position.y);
      context.arc(entity.position.x, entity.position.y, entity.radius, 0, 2 * Math.PI);
      break;
    case "box":
      const corners = getCorners(entity);
      context.moveTo(corners.at(-1).x, corners.at(-1).y);
      corners.forEach((corner) => context.lineTo(corner.x, corner.y));
      break;
    default:
      console.warn("Unknown collider type:", entity.collider);
  }
};

const drawCollision = (entity) => {
  const { a, b, collisionPoint, normal, lifetime } = entity;

  if (lifetime == 0) {
    removeEntity(COLLISION, entity.id);
    return;
  }

  entity.lifetime--;

  context.strokeStyle = "white";
  context.lineWidth = 1;
  context.beginPath();

  addPathCollider(a);
  addPathCollider(b);
  context.stroke();

  // normal
  context.strokeStyle = "magenta";
  context.lineWidth = 1;
  context.moveTo(collisionPoint.x + 5, collisionPoint.y);
  context.beginPath();
  context.arc(collisionPoint.x, collisionPoint.y, 5, 0, 2 * Math.PI);
  context.moveTo(collisionPoint.x, collisionPoint.y);
  context.lineTo(collisionPoint.x + normal.x * 20, collisionPoint.y + normal.y * 20);
  context.stroke();

  // old velocity
  context.strokeStyle = "red";
  context.beginPath();
  context.moveTo(a.position.x, a.position.y);
  context.lineTo(a.position.x + a.oldVelocity.x * 200, a.position.y + a.oldVelocity.y * 200);
  context.moveTo(b.position.x, b.position.y);
  context.lineTo(b.position.x + b.oldVelocity.x * 200, b.position.y + b.oldVelocity.y * 200);
  addPathAngularVelocity(a.position.x, a.position.y, a.oldAngularVelocity, 20);
  addPathAngularVelocity(b.position.x, b.position.y, b.oldAngularVelocity, 20);
  context.stroke();

  // new velocity
  context.strokeStyle = "green";
  context.beginPath();
  context.moveTo(a.position.x, a.position.y);
  context.lineTo(a.position.x + a.newVelocity.x * 200, a.position.y + a.newVelocity.y * 200);
  context.moveTo(b.position.x, b.position.y);
  context.lineTo(b.position.x + b.newVelocity.x * 200, b.position.y + b.newVelocity.y * 200);
  addPathAngularVelocity(a.position.x, a.position.y, a.newAngularVelocity, 25);
  addPathAngularVelocity(b.position.x, b.position.y, b.newAngularVelocity, 25);
  context.stroke();

  context.save();
};

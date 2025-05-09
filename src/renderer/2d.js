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
};

// CURRENT RENDERED ENTITIES
const entities = {
  [FLAMES]: {},
  [SPACESHIP]: {},
  [SPACESHIPPART]: {},
  [ASTEROID]: {},
  [BULLET]: {},
  [ROCKET]: {},
  [EXPLOSION]: {},
  [FLASH]: {},
  [POWERUP]: {},
};

let velocityDrawing = false;
let hitboxDrawing = false;
let trajectoryDrawing = false;
let drawSplinePaths = false;

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
        case FLASH:
          drawFlash(entity);
          break;
        case POWERUP:
          drawPowerup(entity);
          break;
      }

      ht.addTrajectory(entity.id, ht.calcTransform(entity));
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
      }
      context.stroke();
    }
  }

  if (trajectoryDrawing) ht.drawTrajectory(context);
};

const drawCircular = (entity) => {
  const { radius, texture } = entity;
  const transform = ht.calcTransform(entity);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  context.drawImage(texture, -radius, -radius, radius * 2, radius * 2);

  if (hitboxDrawing) {
    context.strokeStyle = RED;
    context.lineWidth = 1;

    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, 0, 2 * Math.PI);

    context.stroke();
  }

  if (entity.frozen) {
    context.globalAlpha = 0.2;
    context.drawImage(iceImage, -radius - 10, -radius - 10, radius * 2 + 20, radius * 2 + 20);
    context.globalAlpha = 1;
  }

  context.restore();
};

const drawBullet = (entity) => {
  const { length } = renderDetails[BULLET];
  const c = (Math.cos(entity.rotation) * length) / 2;
  const s = (Math.sin(entity.rotation) * length) / 2;
  context.fillStyle = renderDetails[BULLET].color;
  context.strokeStyle = renderDetails[BULLET].color;
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
  const { width, height, texture } = entity;
  const transform = ht.calcTransform(entity);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  context.drawImage(texture, -width / 2, -height / 2, width, height);

  if (hitboxDrawing) {
    context.strokeStyle = "lime";
    context.lineWidth = 1;
    context.strokeRect(-width / 2, -height / 2, width, height);
  }

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

  if (hitboxDrawing) {
    context.strokeStyle = "lime";
    context.lineWidth = 1;
    context.strokeRect(-width, 0, width * 2, height + flicker);
  }

  context.restore();
  // context.moveTo(entity.position.x, entity.position.y);
  // for (const target of entity.targets) {
  //   context.lineTo(target.position.x, target.position.y);
  // }
};

const drawFlash = (entity) => {
  const center = entity.position;
  const rotation = entity.rotation;
  const innerRadius = 3;
  const outerRadius = 15;

  context.fillStyle = "white";
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
  const { radius } = entity;
  const size = radius * 2;
  context.save();
  context.translate(entity.position.x, entity.position.y);
  context.rotate(entity.rotation);

  context.drawImage(powerupImage, -radius, -radius, size, size);

  if (hitboxDrawing) {
    context.strokeStyle = "lime";
    context.lineWidth = 1;
    context.strokeRect(-radius, -radius, size, size);
  }

  switch (entity.type) {
    case "health":
      context.textAlign = "center";
      context.font = "20px Arial";
      context.fillText("💚", 0, 7);
      break;
    case "damage":
      context.fillStyle = "yellow";
      context.textAlign = "center";
      context.font = "20px Arial";
      context.fillText("=", 0, 7);
      break;
    case "rocket-piercing":
      context.fillStyle = "blue";
      context.textAlign = "center";
      context.font = "20px Arial";
      context.fillText("🚀", 0, 7);
      break;
  }

  context.restore();
};

import * as ht from '../features/hierarchicalTransformations';

const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");

// ENTITY TYPES
export const ASTEROID = "asteroid";
export const BULLET = "bullet";
export const ROCKET = "rocket";
export const SPACESHIP = "spaceship";
export const VELOCITY = "velocity";
export const SPACESHIPPART = 'spaceshippart'
export const FLAMES = 'flames'

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
    color: WHITE
  },
  [BULLET]: {
    color: YELLOW,
    length: 10,
    strokeWidth: 2,
  },
  [ROCKET]: {
    color: RED
  },
  [SPACESHIP]: {
    color: GREEN
  },
  [VELOCITY]: {
    color: RED,
  },
  [SPACESHIPPART]: {
    color: GREEN
  },
  [FLAMES]: {
    color: RED
  }
};

// CURRENT RENDERED ENTITIES
const entities = {
  [FLAMES]: {},
  [SPACESHIP]: {},
  [SPACESHIPPART]: {},
  [ASTEROID]: {},
  [BULLET]: {},
  [ROCKET]: {}
};

let velocityDrawing = false;

// INITIALIZATION
export const init = () => {
  // NOOP in 2d renderer, will be heavy in webgl
  console.info("renderer inititalized");
};

export const setVelocityDrawing = (draw) => {
  velocityDrawing = draw;
};

// RENDER ENTITY MANAGEMENT
export const addEntity = (type, entity) => {
  entity.id = getId();
  entities[type][entity.id] = entity;
};

export const removeEntity = (type, id) => {
  delete entities[type][id];
};

const img = new Image();
img.src = "/public/rock.webp";

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
        const { position, velocity } = entity;
        const { x, y } = position;
        const { x: vx, y: vy } = velocity;
        context.moveTo(x, y);
        context.lineTo(x + vx * 200, y + vy * 200);
      }
      context.stroke();
    }
  }
};

const drawAsteroid = (asteroid) => {
  context.save()
  context.fillStyle = renderDetails[ASTEROID].color;
  context.strokeStyle = renderDetails[ASTEROID].color;
  context.lineWidth = renderDetails[ASTEROID]?.strokeWidth ?? 0;



  context.beginPath();
  context.moveTo(asteroid.position.x + asteroid.radius, asteroid.position.y);
  context.arc(asteroid.position.x, asteroid.position.y, asteroid.radius, 0, 2 * Math.PI);
  context.moveTo(asteroid.position.x, asteroid.position.y);

  context.stroke();

  context.restore();
};

const drawCircular = (entity) => {
  const {radius, position, rotation, parent, texture} = entity;
  const transform = ht.calcTransform({x: position.x, y: position.y, rotation: rotation}, parent);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  context.drawImage(texture, -radius, -radius, radius * 2, radius * 2);

  // context.fillStyle = renderDetails[ASTEROID].color;
  // context.strokeStyle = renderDetails[ASTEROID].color;
  // context.lineWidth = renderDetails[ASTEROID]?.strokeWidth ?? 0;

  // context.beginPath();
  // context.moveTo(0, 0);
  // context.arc(0, 0, radius, 0, 2 * Math.PI);

  // context.stroke();

  context.restore();
};

const drawBullet = (entity) => {
  context.fillStyle = renderDetails[BULLET].color;
  context.strokeStyle = renderDetails[BULLET].color;
  context.lineWidth = renderDetails[BULLET]?.strokeWidth ?? 0;

  context.beginPath();

  const { length } = renderDetails[BULLET];
  const c = (Math.cos(entity.rotation) * length) / 2;
  const s = (Math.sin(entity.rotation) * length) / 2;
  context.moveTo(entity.position.x + c, entity.position.y + s);
  context.lineTo(entity.position.x - c, entity.position.y - s);

  context.stroke();
};

const drawRocket = (entity) => {
  context.fillStyle = renderDetails[ROCKET].color;
  context.strokeStyle = renderDetails[ROCKET].color;
  context.lineWidth = renderDetails[ROCKET]?.strokeWidth ?? 0;

  context.beginPath();

  const { radius } = entity;
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
  context.moveTo(p1.x, p1.y);
  context.lineTo(p2.x, p2.y);
  context.lineTo(p3.x, p3.y);
  context.lineTo(p1.x, p1.y);

  context.stroke();
};

export const drawRectangular = (entity) => {
  const {width, height} = entity;
  const transform = ht.calcTransform({x: entity.position.x, y: entity.position.y, rotation: entity.rotation}, entity.parent);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  context.drawImage(entity.texture, -width / 2, -height / 2, width, height);

  // context.strokeStyle = 'lime';
  // context.lineWidth = 1;
  // context.strokeRect(
  //   -width / 2,
  //   -height / 2,
  //   width,
  //   height
  // );

  context.restore();
};

export const drawFlames = (entity) => {
  const {width, height} = entity;
  const transform = ht.calcTransform({x: entity.position.x, y: entity.position.y, rotation: entity.rotation}, entity.parent);

  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);

  context.beginPath();
  const flicker = Math.random() * 5;

  context.moveTo(0, 0);
  context.lineTo(-width, height + flicker);
  context.lineTo(width, height + flicker);
  context.closePath();

  context.fillStyle = 'orange';
  context.fill();

  context.beginPath();
  context.moveTo(0, 0); 
  context.lineTo(-width / 2, height / 2 + flicker);
  context.lineTo(width / 2, height / 2 + flicker);
  context.closePath();

  context.fillStyle = 'yellow';
  context.fill();

  context.restore();
};

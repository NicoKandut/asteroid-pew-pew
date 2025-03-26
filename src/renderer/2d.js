const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");

// ENTITY TYPES
export const ASTEROID = "asteroid";
export const BULLET = "bullet";
export const ROCKET = "rocket";
export const SPACESHIP = "spaceship";
export const VELOCITY = "velocity";

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
    radius: 10,
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
    width: 10,
    height: 20,
  },
  [VELOCITY]: {
    color: RED,
  },
};

// CURRENT RENDERED ENTITIES
const entities = {
  [ASTEROID]: {},
  [BULLET]: {},
  [ROCKET]: {},
  [SPACESHIP]: {},
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
    context.fillStyle = renderDetails[type].color;
    context.strokeStyle = renderDetails[type].color;
    context.lineWidth = renderDetails[type]?.strokeWidth ?? 0;

    if (type === ASTEROID) {
      context.fillStyle = context.createPattern(img, "repeat");
    }
    context.beginPath();
    // draw each entity of the type
    for (const entity of Object.values(entities[type])) {
      switch (type) {
        case ASTEROID:
          drawAsteroid(entity.position, entity.rotation, entity.radius);
          break;
        case BULLET:
          drawBullet(entity.position, entity.rotation);
          break;
        case ROCKET:
          drawRocket(entity.position, entity.rotation);
          break;
        case SPACESHIP:
          drawSpaceship(entity.position, entity.rotation);
          break;
      }
    }
    context.fill();
    context.stroke();
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

const drawAsteroid = (position, _rotation, radius) => {
  context.moveTo(position.x + radius, position.y);
  context.arc(position.x, position.y, radius, 0, 2 * Math.PI);
};

const drawBullet = (position, rotation) => {
  const { length } = renderDetails[BULLET];
  const c = (Math.cos(rotation) * length) / 2;
  const s = (Math.sin(rotation) * length) / 2;
  context.moveTo(position.x + c, position.y + s);
  context.lineTo(position.x - c, position.y - s);
};

const drawRocket = (position, rotation) => {
  const { radius } = renderDetails[ROCKET];
  const third = (2 * Math.PI) / 8;
  const p1 = {
    x: position.x + radius * Math.cos(rotation),
    y: position.y + radius * Math.sin(rotation),
  };
  const p2 = {
    x: position.x - radius * Math.cos(rotation + third),
    y: position.y - radius * Math.sin(rotation + third),
  };
  const p3 = {
    x: position.x - radius * Math.cos(rotation - third),
    y: position.y - radius * Math.sin(rotation - third),
  };
  context.moveTo(p1.x, p1.y);
  context.lineTo(p2.x, p2.y);
  context.lineTo(p3.x, p3.y);
  context.lineTo(p1.x, p1.y);
};

const drawSpaceship = (position, rotation) => {
  const { width } = renderDetails[SPACESHIP];
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  context.moveTo(position.x + width * c, position.y + width * s);
  context.lineTo(position.x - width * s, position.y + width * c);
  context.lineTo(position.x - width * c, position.y - width * s);
  context.lineTo(position.x + width * s, position.y - width * c);
  context.lineTo(position.x + width * c, position.y + width * s);
};

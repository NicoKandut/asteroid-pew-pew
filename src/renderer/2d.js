const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");

export const ASTEROID = "asteroid";
export const BULLET = "bullet";
export const ROCKET = "rocket";
export const SPACESHIP = "spaceship";

// RENDER IDENTIFIERS
let nextId = 0;
const getId = () => `${nextId++}`;

// RENDER DETAILS
const renderDetails = {
  [ASTEROID]: {
    color: "#ffffff",
    type: "circle",
    radius: 10,
  },
  [BULLET]: {
    color: "#ffff00",
    type: "line",
    length: 10,
    strokeWidth: 2,
  },
  [ROCKET]: {
    color: "#ff0000",
    type: "triangle",
    radius: 10,
  },
  [SPACESHIP]: {
    color: "#00ff00",
    type: "rectangle",
    width: 10,
    height: 20,
  },
};

// CURRENT RENDERED ENTITIES
const entities = {
  [ASTEROID]: {},
  [BULLET]: {},
  [ROCKET]: {},
  [SPACESHIP]: {},
};

// init
export const init = () => {
  console.info("renderer inititalized");
};

export const render = () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const type in entities) {
    // configure drawing for entity type
    context.fillStyle = renderDetails[type].color;
    context.strokeStyle = renderDetails[type].color;
    context.lineWidth = renderDetails[type]?.strokeWidth ?? 0;

    // draw each entity of the type
    for (const entity of Object.values(entities[type])) {
      switch (type) {
        case ASTEROID:
          drawAsteroid(entity.position, entity.rotation);
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
  }
};

// RENDER ENTITY MANAGEMENT
export const addEntity = (type, position, rotation) => {
  const id = getId();
  entities[type][id] = { position, rotation };
  return id;
};
export const removeEntity = (type, id) => {
  delete entities[type][id];
};
export const updateEntity = (type, id, position, rotation) => {
  entities[type][id].position = position;
  entities[type][id].rotation = rotation;
};

// DRAWING
const drawAsteroid = (position, _rotation) => {
  const { radius } = renderDetails[ASTEROID];
  context.beginPath();
  context.arc(position.x, position.y, radius, 0, 2 * Math.PI);
  context.fill();
};
const drawBullet = (position, rotation) => {
  const { length } = renderDetails[BULLET];
  const c = (Math.cos(rotation) * length) / 2;
  const s = (Math.sin(rotation) * length) / 2;
  context.beginPath();
  context.moveTo(position.x + c, position.y + s);
  context.lineTo(position.x - c, position.y - s);
  context.stroke();
};
const drawRocket = (position, rotation) => {
  const { radius } = renderDetails[ROCKET];
  const third = (2 * Math.PI) / 8;
  context.beginPath();
  context.moveTo(
    position.x + radius * Math.cos(rotation),
    position.y + radius * Math.sin(rotation)
  );
  context.lineTo(
    position.x - radius * Math.cos(rotation + third),
    position.y - radius * Math.sin(rotation + third)
  );
  context.lineTo(
    position.x - radius * Math.cos(rotation - third),
    position.y - radius * Math.sin(rotation - third)
  );
  context.lineTo(
    position.x + radius * Math.cos(rotation),
    position.y + radius * Math.sin(rotation)
  );
  context.stroke();
};
const drawSpaceship = (position, rotation) => {
  const { width } = renderDetails[SPACESHIP];
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  context.beginPath();
  context.moveTo(position.x + width * c, position.y + width * s);
  context.lineTo(position.x - width * s, position.y + width * c);
  context.lineTo(position.x - width * c, position.y - width * s);
  context.lineTo(position.x + width * s, position.y - width * c);
  context.lineTo(position.x + width * c, position.y + width * s);
  context.fill();
};

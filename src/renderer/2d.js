const MAX_GEOMETRIES = 3000;

const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");

export const ASTEROID = "asteroid";
export const BULLET = "bullet";
export const ROCKET = "rocket";
export const SPACESHIP = "spaceship";

// resources
const asteroid = {
  color: "#ffffff",
  type: "circle",
  radius: 10,
};

const bullet = {
  color: "#ffff00",
  type: "line",
  length: 3,
};

const rocket = {
  color: "#ff0000",
  type: "triangle",
  radius: 1.5,
};

const spaceship = {
  color: "#00ff00",
  type: "rectangle",
  width: 10,
  height: 20,
};

const entities = {
  [ASTEROID]: [],
  [BULLET]: [],
  [ROCKET]: [],
  [SPACESHIP]: [],
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
    context.fillStyle = type.color;
    for (const entity of entities[type]) {
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

export const addEntity = (type, position, rotation) => {
  entities[type].push({ position, rotation });
  return entities[type].length - 1;
};

export const removeEntity = (type, index) => {
  entities[type].splice(index, 1);
};

export const updateEntity = (type, index, position, rotation) => {
  entities[type][index].position = position;
  entities[type][index].rotation = rotation;
};

const drawAsteroid = (position, _rotation) => {
  context.beginPath();
  context.arc(position.x, position.y, asteroid.radius, 0, 2 * Math.PI);
  context.fill();
};

const drawBullet = (position, rotation) => {
  let c = (Math.cos(rotation) * bullet.length) / 2;
  let s = (Math.sin(rotation) * bullet.length) / 2;
  context.beginPath();
  context.moveTo(position.x + c, position.y + s);
  context.lineTo(position.x - c, position.y - s);
  context.stroke();
};

const drawRocket = (position, rotation) => {
  const third = (2 * Math.PI) / 3;
  context.beginPath();
  context.moveTo(
    position.x + rocket.radius * Math.cos(rotation),
    position.y + rocket.radius * Math.sin(rotation)
  );
  context.lineTo(
    position.x - rocket.radius * Math.cos(rotation + third),
    position.y - rocket.radius * Math.sin(rotation + third)
  );
  context.lineTo(
    position.x - rocket.radius * Math.cos(rotation - third),
    position.y - rocket.radius * Math.sin(rotation - third)
  );
  context.stroke();
};

const drawSpaceship = (position, rotation) => {
  let c = Math.cos(rotation);
  let s = Math.sin(rotation);
  context.beginPath();
  context.moveTo(
    position.x + spaceship.width * c,
    position.y + spaceship.width * s
  );
  context.lineTo(
    position.x - spaceship.width * s,
    position.y + spaceship.width * c
  );
  context.lineTo(
    position.x - spaceship.width * c,
    position.y - spaceship.width * s
  );
  context.lineTo(
    position.x + spaceship.width * s,
    position.y - spaceship.width * c
  );
  context.lineTo(
    position.x + spaceship.width * c,
    position.y + spaceship.width * s
  );
  context.fill();
};

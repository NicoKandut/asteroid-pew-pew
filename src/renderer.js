import linesVertSource from "./lines.vert?raw";
import linesFragSource from "./lines.frag?raw";

const MAX_GEOMETRIES = 3000;

const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("webgl2");

// resources
const positions = new Float32Array(MAX_GEOMETRIES * 6 * 2);
const positionBuffer = context.createBuffer();
const colors = new Float32Array(MAX_GEOMETRIES * 6 * 4);
const colorBuffer = context.createBuffer();

// geometry
const geometries = [];
for (let i = 0; i < MAX_GEOMETRIES; ++i) {
  geometries.push({
    vertices: [],
    colors: [],
  });
}

let program;
let positionAttribute;
let colorAttribute;

// init
export const initRenderer = () => {
  const linesVert = createShader(context.VERTEX_SHADER, linesVertSource);
  const linesFrag = createShader(context.FRAGMENT_SHADER, linesFragSource);
  program = createProgram(linesVert, linesFrag);
  positionAttribute = createVertexAttribute("in_position", 2);
  colorAttribute = createVertexAttribute("in_color", 4);

  context.useProgram(program);
  context.clearColor(0.0, 0.0, 0.0, 1.0);
  context.clearDepth(1.0);
  context.enable(context.DEPTH_TEST);
  context.depthFunc(context.LEQUAL);

  console.info("renderer inititalized");
};

export const render = () => {
  // TODO: remove
  randomizeGeometry();

  updateGeometry();

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  context.viewport(0, 0, canvas.width, canvas.height);

  context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

  context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
  context.bufferData(context.ARRAY_BUFFER, positions, context.DYNAMIC_DRAW);
  context.vertexAttribPointer(positionAttribute, 2, context.FLOAT, false, 0, 0);
  context.enableVertexAttribArray(positionAttribute);

  context.bindBuffer(context.ARRAY_BUFFER, colorBuffer);
  context.bufferData(context.ARRAY_BUFFER, colors, context.DYNAMIC_DRAW);
  context.vertexAttribPointer(colorAttribute, 4, context.FLOAT, false, 0, 0);
  context.enableVertexAttribArray(colorAttribute);

  // draw lines
  context.drawArrays(context.LINES, 0, positions.length / 2);
};

const updateGeometry = () => {
  for (let i = 0; i < geometries.length; i++) {
    positions.set(geometries[i].vertices, i * 6 * 2);
    colors.set(geometries[i].color, i * 6 * 4);
  }
};

const createProgram = (vertexShader, fragmentShader) => {
  const program = context.createProgram();
  context.attachShader(program, vertexShader);
  context.attachShader(program, fragmentShader);
  context.linkProgram(program);

  if (!context.getProgramParameter(program, context.LINK_STATUS)) {
    console.error(context.getProgramInfoLog(program));
  }

  return program;
};

const createShader = (type, source) => {
  const shader = context.createShader(type);
  context.shaderSource(shader, source);
  context.compileShader(shader);

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    console.error(context.getShaderInfoLog(shader));
  }

  return shader;
};

const createVertexAttribute = (name, components) => {
  const attribute = context.getAttribLocation(program, name);
  context.enableVertexAttribArray(attribute);
  context.vertexAttribPointer(
    attribute,
    components,
    context.FLOAT,
    false,
    0,
    0
  );

  if (attribute < 0) {
    console.error(`Could not bind attribute ${name}`);
  }

  return attribute;
};

const randomizeGeometry = () => {
  geometries.forEach((g) => {
    let v1_x = Math.random() * 2 - 1;
    let v1_y = Math.random() * 2 - 1;
    let v2_x = Math.random() * 2 - 1;
    let v2_y = Math.random() * 2 - 1;
    let v3_x = Math.random() * 2 - 1;
    let v3_y = Math.random() * 2 - 1;

    let color_r = Math.random();
    let color_g = Math.random();
    let color_b = Math.random();

    g.vertices = [
      v1_x,
      v1_y,
      v2_x,
      v2_y,
      v2_x,
      v2_y,
      v3_x,
      v3_y,
      v3_x,
      v3_y,
      v1_x,
      v1_y,
    ];
    g.color = [
      color_r,
      color_g,
      color_b,
      1.0,
      color_r,
      color_g,
      color_b,
      1.0,
      color_r,
      color_g,
      color_b,
      1.0,
      color_r,
      color_g,
      color_b,
      1.0,
      color_r,
      color_g,
      color_b,
      1.0,
      color_r,
      color_g,
      color_b,
      1.0,
    ];
  });
};

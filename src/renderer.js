import linesVertSource from "./lines.vert?raw";
import linesFragSource from "./lines.frag?raw";

const canvas = document.getElementsByTagName("canvas")[0];
const context = canvas.getContext("webgl2");

// resources
const lineBuffer = context.createBuffer();

// geometry
const geometries = [];

// init
const linesVert = context.createShader(context.VERTEX_SHADER);
context.shaderSource(linesVert, linesVertSource);
context.compileShader(linesVert);

if (!context.getShaderParameter(linesVert, context.COMPILE_STATUS)) {
  console.error(context.getShaderInfoLog(linesVert));
}

const linesFrag = context.createShader(context.FRAGMENT_SHADER);
context.shaderSource(linesFrag, linesFragSource);
context.compileShader(linesFrag);

if (!context.getShaderParameter(linesFrag, context.COMPILE_STATUS)) {
  console.error(context.getShaderInfoLog(linesFrag));
}

const program = context.createProgram();
context.attachShader(program, linesVert);
context.attachShader(program, linesFrag);
context.linkProgram(program);

if (!context.getProgramParameter(program, context.LINK_STATUS)) {
  console.error(context.getProgramInfoLog(program));
}

const positionAttribute = context.getAttribLocation(program, "in_position");
context.enableVertexAttribArray(positionAttribute);
context.vertexAttribPointer(positionAttribute, 4, context.FLOAT, false, 0, 0);

// const colorAttribute = context.getAttribLocation(program, "in_color");
// context.enableVertexAttribArray(colorAttribute);
// context.vertexAttribPointer(colorAttribute, 4, context.FLOAT, false, 0, 0);

context.useProgram(program);
context.clearColor(0.0, 0.0, 0.0, 1.0);
context.clearDepth(1.0);
context.enable(context.DEPTH_TEST);
context.depthFunc(context.LEQUAL);

console.info("renderer ready");

export const addGeometry = (lines) => {
  const index = geometries.length;
  return index;
};

export const render = () => {
  geometries.length = 0;
  for (let i = 0; i < 1000; ++i) {
    geometries.push({
      vertices: [
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
      ],
    });
  }

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  context.viewport(0, 0, canvas.width, canvas.height);

  context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

  context.bindBuffer(context.ARRAY_BUFFER, lineBuffer);

  const vertices = new Float32Array(
    geometries.map((g) => g.vertices).reduce((a, b) => a.concat(b), [])
  );
  context.bufferData(context.ARRAY_BUFFER, vertices, context.DYNAMIC_DRAW);

  const loc_in_position = context.getAttribLocation(program, "in_position");
  context.vertexAttribPointer(loc_in_position, 2, context.FLOAT, false, 0, 0);
  context.enableVertexAttribArray(loc_in_position);

  // draw lines
  context.drawArrays(context.LINES, 0, vertices.length / 2);
};

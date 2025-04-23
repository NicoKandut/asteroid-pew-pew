import { sub, length } from "../renderer/linalg.js";

const SAMPLES_PER_SEGMENT = 10;
const SAMPLE_STEP = 30;

const catmullRom1D = (t, p0, p1, p2, p3) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

const catmullRom2D = (t, p0, p1, p2, p3) => ({
  x: catmullRom1D(t, p0.x, p1.x, p2.x, p3.x),
  y: catmullRom1D(t, p0.y, p1.y, p2.y, p3.y),
});

const catmullRomNativeSpeed = (entity, progress) => {
  const offset = Math.max(Math.min(Math.floor(progress), entity.targets.length - 4), 0);
  return catmullRom2D(
    progress % 1,
    entity.targets[offset + 0].position,
    entity.targets[offset + 1].position,
    entity.targets[offset + 2].position,
    entity.targets[offset + 3].position
  );
};

const catmullRomConstantSpeed = (entity, progress) => catmullRomNativeSpeed(entity, lookupArcLength(entity, progress));

export const createArcLengthTable = (entity) => {
  entity.arcLengthTable = [];
  let totalLength = 0;
  let previousPoint = entity.targets[1].position;
  for (let i = 0; i < (entity.targets.length - 3) * SAMPLES_PER_SEGMENT; ++i) {
    const v = i / SAMPLES_PER_SEGMENT;
    const nextPoint = catmullRomNativeSpeed(entity, v);
    const newLength = length(sub(nextPoint, previousPoint));
    totalLength += newLength;
    entity.arcLengthTable.push({ v, totalLength });
    previousPoint = nextPoint;
  }
  const offset = entity.targets.length - 4;
  const newPoint = catmullRom2D(
    1,
    entity.targets[offset + 0].position,
    entity.targets[offset + 1].position,
    entity.targets[offset + 2].position,
    entity.targets[offset + 3].position
  );
  const newLength = length(sub(newPoint, previousPoint));
  totalLength += newLength;
  entity.arcLengthTable.push({ v: entity.targets.length - 3, totalLength });
};

const easeInOut = (x) => {
  return -(Math.cos(Math.PI * x) - 1) / 2;
};

const lookupArcLength = (entity, progress) => {
  let nativeProgress = entity.arcLengthTable[entity.arcLengthTable.length - 1].v;
  for (let i = 1; i < entity.arcLengthTable.length; ++i) {
    const previous = entity.arcLengthTable[i - 1];
    const next = entity.arcLengthTable[i];
    if (progress < next.totalLength) {
      const diff = next.totalLength - previous.totalLength;
      if (diff === 0) {
        nativeProgress = next.v;
        break;
      }
      const relativeProgress = progress - previous.totalLength;
      const t = relativeProgress / diff;
      nativeProgress = previous.v * (1 - t) + next.v * t;
      break;
    }
  }
  const offset = Math.floor(nativeProgress);
  const t = nativeProgress - offset;
  const partialProgress = easeInOut(t);
  console.log("t => ", t, partialProgress);
  return offset + partialProgress;
};

export const pathInterpolate = (entity, progress) => {
  const newPosition = catmullRomConstantSpeed(entity, progress);
  entity.velocity = sub(newPosition, entity.position);
  entity.rotation = Math.atan2(entity.velocity.y, entity.velocity.x);
  entity.position = newPosition;

  const newProgress = Math.max(Math.min(Math.floor(lookupArcLength(entity, progress)), entity.targets.length - 3), 0);
  entity.targets[newProgress + 1].remove = true;
  if (newProgress >= entity.targets.length - 3) {
    entity.remove = true;
    return;
  }
};

export const samplePath = (entity) => {
  entity.pathPoints = [];
  const totalLength = entity.arcLengthTable[entity.arcLengthTable.length - 1].totalLength;
  for (let len = 0; len <= totalLength; len += SAMPLE_STEP) {
    entity.pathPoints.push(catmullRomConstantSpeed(entity, len));
  }
  entity.pathPoints.push(entity.targets[entity.targets.length - 2].position);
};

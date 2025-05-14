import { sub, length } from "../util/linalg.js";

const SAMPLES_PER_SEGMENT = 100;
const SAMPLE_STEP = 10;

const catmullRom1D = (t, p0, p1, p2, p3) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

const catmullRom2D = (t, p0, p1, p2, p3) => ({
  x: catmullRom1D(t, p0.x, p1.x, p2.x, p3.x),
  y: catmullRom1D(t, p0.y, p1.y, p2.y, p3.y),
});

const catmullRomNativeSpeed = (entity, offset, progress) =>
  catmullRom2D(
    progress,
    entity.targets[offset + 0].position,
    entity.targets[offset + 1].position,
    entity.targets[offset + 2].position,
    entity.targets[offset + 3].position
  );

const catmullRomConstantSpeed = (entity, lengthProgress) => {
  const progress = lookupArcLength(entity, lengthProgress);
  const numSegments = entity.targets.length - 3;
  const totalProgress = progress * numSegments;
  let offset = Math.floor(totalProgress);
  let progressInSegment = totalProgress - offset;
  if (offset >= numSegments) {
    offset -= 1;
    progressInSegment = 1;
  }
  return catmullRomNativeSpeed(entity, offset, progressInSegment);
};

export const createArcLengthTable = (entity) => {
  entity.arcLengthTable = [];
  let totalProgress = 0;
  let totalLength = 0;
  let previousPoint = entity.targets[1].position;
  const numSegments = entity.targets.length - 3;
  for (let offset = 0; offset < numSegments; ++offset) {
    for (let i = 0; i < SAMPLES_PER_SEGMENT; ++i) {
      const progress = i / SAMPLES_PER_SEGMENT;
      const nextPoint = catmullRomNativeSpeed(entity, offset, progress);
      const newLength = length(sub(nextPoint, previousPoint));
      totalLength += newLength;
      entity.arcLengthTable.push({ v: totalProgress, totalLength });
      previousPoint = nextPoint;
      totalProgress = (offset * SAMPLES_PER_SEGMENT + i) / (SAMPLES_PER_SEGMENT * numSegments);
    }
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
  entity.arcLengthTable.push({ v: 1, totalLength });
};

const easeInOut = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

const easeInCubic = (x) => x * x * x;

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const easeInSine = (x) => 1 - Math.cos((x * Math.PI) / 2);
const linear = (x) => x;

const lookupArcLength = (entity, lengthProgress) => {
  let progress = entity.arcLengthTable[entity.arcLengthTable.length - 1].v;
  for (let i = 1; i < entity.arcLengthTable.length; ++i) {
    const previous = entity.arcLengthTable[i - 1];
    const next = entity.arcLengthTable[i];
    if (lengthProgress < next.totalLength) {
      const diff = next.totalLength - previous.totalLength;
      if (diff === 0) {
        progress = next.v;
        break;
      }
      const relativeProgress = lengthProgress - previous.totalLength;
      const t = relativeProgress / diff;
      progress = previous.v * (1 - t) + next.v * t;
      break;
    } 
  }
  return Math.min(1, Math.max(0, easeInOutCubic(progress)));
};

export const pathInterpolate = (entity, progress, onTargetReached) => {
  const newPosition = catmullRomConstantSpeed(entity, progress);
  entity.velocity = sub(newPosition, entity.position);
  entity.rotation = Math.atan2(entity.velocity.y, entity.velocity.x);
  entity.position = newPosition;

  const currentTarget = Math.max(Math.floor(lookupArcLength(entity, progress) * (entity.targets.length - 3)), 0);
  if (currentTarget !== entity.currentTarget) {
    onTargetReached(entity.targets[currentTarget + 1]);
    entity.currentTarget = currentTarget;
  }
  if (currentTarget >= entity.targets.length - 3) {
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

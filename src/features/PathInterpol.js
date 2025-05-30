import { sub, length } from "../util/linalg.js";

let easingFunctionEnabled = false;
export const setEasingFunctionEnabled = (enabled) => {
  easingFunctionEnabled = enabled;
};

const SAMPLE_STEP = 40;
const τ = 0.9;

const catmullRom1D = (t, p0, p1, p2, p3) =>
  p1 +
  (-τ * p0 + τ * p2) * t +
  (2 * τ * p0 + (τ - 3) * p1 + (3 - 2 * τ) * p2 - τ * p3) * t * t +
  (-τ * p0 + (2 - τ) * p1 + (τ - 2) * p2 + τ * p3) * t * t * t;

const catmullRom2D = (t, p0, p1, p2, p3) => ({
  x: catmullRom1D(t, p0.x, p1.x, p2.x, p3.x),
  y: catmullRom1D(t, p0.y, p1.y, p2.y, p3.y),
});

const getOffset = (entity, cordLengthProgress) => {
  for (let offset = 0; offset < entity.targetCordLengths.length; ++offset) {
    if (cordLengthProgress < entity.targetCordLengths[offset]) {
      return offset;
    }
  }
  return entity.targetCordLengths.length - 1;
};

const catmullRomFullPath = (entity, cordLengthProgress) => {
  // lookup progress in arc length table
  const v = lookupArcLength(entity, cordLengthProgress);

  // adjust with looked up progress
  cordLengthProgress = v * entity.arcLengthTable.cordLength;
  const offset = getOffset(entity, cordLengthProgress);

  // map global cord length progress to local segment
  const segmentStart = offset === 0 ? 0 : entity.targetCordLengths[offset - 1];
  const segmentEnd = entity.targetCordLengths[offset];
  const cordLengthInSegment = cordLengthProgress - segmentStart;
  const segmentLength = segmentEnd - segmentStart;
  const progressInSegment = cordLengthInSegment / segmentLength;

  // compute position on the Catmull-Rom spline
  return catmullRom2D(
    progressInSegment,
    entity.targets[offset + 0].position,
    entity.targets[offset + 1].position,
    entity.targets[offset + 2].position,
    entity.targets[offset + 3].position
  );
};

export const createArcLengthTable = (entity) => {
  entity.arcLengthTable = []; // maps cord length to fractional progress
  entity.targetCordLengths = []; // stores cord lengths for each target asteroid
  entity.arcLengthTable.cordLength = 0; // total cord length of the path

  let previousPoint = entity.targets[1].position;

  // for each segment, perform adaptive sampling
  for (let offset = 0; offset < entity.targets.length - 3; ++offset) {
    // start with start of segment and end of segment
    const from = catmullRom2D(
      0,
      entity.targets[offset + 0].position,
      entity.targets[offset + 1].position,
      entity.targets[offset + 2].position,
      entity.targets[offset + 3].position
    );
    const to = catmullRom2D(
      1,
      entity.targets[offset + 0].position,
      entity.targets[offset + 1].position,
      entity.targets[offset + 2].position,
      entity.targets[offset + 3].position
    );
    const distance = length(sub(to, from));
    const queue = [{ fromProgress: 0, toProgress: 1, from, to, distance }];
    const points = new Set(); // stores the resulting sample points (fraction in segment)
    points.add(0);
    points.add(1);

    while (queue.length > 0) {
      const { fromProgress, toProgress, from, to, distance } = queue.pop();
      const midProgress = (fromProgress + toProgress) / 2;
      const mid = catmullRom2D(
        midProgress,
        entity.targets[offset + 0].position,
        entity.targets[offset + 1].position,
        entity.targets[offset + 2].position,
        entity.targets[offset + 3].position
      );
      const fromMidDistance = length(sub(mid, from));
      const midToDistance = length(sub(to, mid));

      // Check distance between from and to vs sum of distances from from to mid and mid to to
      const error = Math.abs(fromMidDistance + midToDistance - distance);

      if (error > 0.01) {
        // If the difference is too large, we need to subdivide further
        queue.push({ fromProgress, toProgress: midProgress, from, to: mid, distance: fromMidDistance });
        queue.push({ fromProgress: midProgress, toProgress, from: mid, to, distance: midToDistance });
      } else {
        // If the difference is acceptable, we can take the mid point
        points.add(midProgress);
      }
    }

    // sort points
    const sortedPoints = [...points.values()];
    sortedPoints.sort((a, b) => a - b);

    // compute cord length for all table entries
    for (const progress of sortedPoints) {
      const point = catmullRom2D(
        progress,
        entity.targets[offset + 0].position,
        entity.targets[offset + 1].position,
        entity.targets[offset + 2].position,
        entity.targets[offset + 3].position
      );
      entity.arcLengthTable.cordLength += length(sub(point, previousPoint));
      entity.arcLengthTable.push({ v: 0, cordLength: entity.arcLengthTable.cordLength, offset });
      previousPoint = point;
    }

    // also add to targetCordLengths
    entity.targetCordLengths.push(entity.arcLengthTable.cordLength);
  }

  // calculate v as fraction of total length
  for (const entry of entity.arcLengthTable) {
    entry.v = entry.cordLength / entity.arcLengthTable.cordLength;
  }
};

const easeInOut = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
const easeInCubic = (x) => x * x * x;
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeInSine = (x) => 1 - Math.cos((x * Math.PI) / 2);
const linear = (x) => x;

const lookupArcLength = (entity, cordLengthProgress) => {
  // find where in the arc length table we are
  let { v } = entity.arcLengthTable[entity.arcLengthTable.length - 1];
  for (let i = 1; i < entity.arcLengthTable.length; ++i) {
    const previous = entity.arcLengthTable[i - 1];
    const next = entity.arcLengthTable[i];
    if (cordLengthProgress < next.cordLength) {
      const cordLength = next.cordLength - previous.cordLength;
      const progressBetween = cordLengthProgress - previous.cordLength;
      const t = progressBetween / cordLength;

      // linear interpolation between previous and next, should be smooth enough?
      v = previous.v * (1 - t) + next.v * t;
      break;
    }
  }

  // Apply easing function
  v = easingFunctionEnabled ? easeInCubic(v) : linear(v);

  // clamp to prevent out of bounds access
  v = Math.min(1, Math.max(0, v));

  return v;
};

export const pathInterpolate = (entity, cordLengthProgress, onTargetReached) => {
  // compute new point
  const newPosition = catmullRomFullPath(entity, cordLengthProgress);

  // update rocket
  entity.velocity = sub(newPosition, entity.position);
  entity.rotation = Math.atan2(entity.velocity.y, entity.velocity.x);
  entity.position = newPosition;

  // check if we reached the next target
  const v = lookupArcLength(entity, cordLengthProgress);
  cordLengthProgress = v * entity.arcLengthTable.cordLength;

  // fire callback if needed
  if (cordLengthProgress >= entity.targetCordLengths[entity.currentTarget]) {
    onTargetReached(entity.targets[entity.currentTarget + 2]);
    ++entity.currentTarget;
  }
};

export const samplePath = (entity) => {
  entity.pathPoints = [];

  // visualize rocket velocity
  const steps = Math.ceil(entity.arcLengthTable.cordLength / SAMPLE_STEP);
  for (let i = 0; i < steps; ++i) {
    const len = (i / steps) * entity.arcLengthTable.cordLength;
    entity.pathPoints.push(catmullRomFullPath(entity, len));
  }
  entity.pathPoints.push(entity.targets[entity.targets.length - 2].position);


  // visualize arc length table
  // for (let i = 0; i < entity.arcLengthTable.length; ++i) {
  //   const { v } = entity.arcLengthTable[i];
  //   entity.pathPoints.push(catmullRomFullPath(entity, v * entity.arcLengthTable.cordLength));
  // }
  // entity.pathPoints.push(entity.targets[entity.targets.length - 2].position);

  // console.log("Path points:", entity.pathPoints.length);

  // create debug numbers
  // const debug = {
  //   cordLength: [],
  //   v: [],
  //   offset: [],
  //   adjustedCordLength: [],
  //   progressInSegment: [],
  // };
  // let csv = "cordlength,v,offset,adjustedCordLength,progressInSegment\n";
  // for (let i = 0; i < steps; ++i) {
  //   const cordLength = (i / steps) * entity.arcLengthTable.cordLength;
  //   debug.cordLength.push(cordLength);

  //   const { v, offset } = lookupArcLength(entity, cordLength);
  //   debug.v.push(v);
  //   debug.offset.push(offset);

  //   const adjustedCordLength = v * entity.arcLengthTable.cordLength;
  //   debug.adjustedCordLength.push(adjustedCordLength);

  //   const segmentStart = offset === 0 ? 0 : entity.targetCordLengths[offset - 1];
  //   const segmentEnd = entity.targetCordLengths[offset];
  //   const cordLengthInSegment = cordLength - segmentStart;
  //   const segmentLength = segmentEnd - segmentStart;
  //   const progressInSegment = cordLengthInSegment / segmentLength;
  //   debug.progressInSegment.push(progressInSegment);

  //   const csvRow = `${cordLength},${v},${offset},${adjustedCordLength},${progressInSegment}\n`;
  //   csv += csvRow;
  // }

  // console.log("Debug CSV:\n", csv);
};

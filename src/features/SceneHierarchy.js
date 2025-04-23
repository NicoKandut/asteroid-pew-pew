let trajectoryHistory = new Map();

const TRAIL_DURATION = 2000;

export const calcTransform = (entity) => {
  // console.log(entity);
  const offset = { x: entity.position.x, y: entity.position.y, rotation: entity.rotation };
  const parent = entity.parent;

  if (parent == null) return offset;

  const parentTransform = calcTransform(
    parent
  );

  const c = Math.cos(parentTransform.rotation);
  const s = Math.sin(parentTransform.rotation);

  return {
    x: parentTransform.x + offset.x * c - offset.y * s,
    y: parentTransform.y + offset.x * s + offset.y * c,
    rotation: parentTransform.rotation + offset.rotation,
  };
};

export const addTrajectory = (id, position) => {
  if (!trajectoryHistory[id]) {
    trajectoryHistory[id] = [];
  }

  const now = performance.now();

  trajectoryHistory[id].push({
    x: position.x,
    y: position.y,
    time: now,
  });

  trajectoryHistory[id] = trajectoryHistory[id].filter((p) => now - p.time < TRAIL_DURATION);
};

export const removeTrajectory = (id) => {
  delete trajectoryHistory[id];
}

export const drawTrajectory = (context) => {
  for (const id in trajectoryHistory) {
    const history = trajectoryHistory[id];

    if (!history || history.length < 2) continue;
  
    context.beginPath();
    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      if (i === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    }
  
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 1;
    context.stroke();
  }
}

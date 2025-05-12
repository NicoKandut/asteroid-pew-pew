//Settings
const seedCount = 5;
const bias = 0.7;


export function generateSeedsTowardImpact(impactPoint, radius) {
  const seeds = [];
  for (let i = 0; i < seedCount; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * radius;
    const dx = Math.cos(angle) * r;
    const dy = Math.sin(angle) * r;

    const cx = bias * impactPoint.x;
    const cy = bias * impactPoint.y;

    const sx = cx + dx;
    const sy = cy + dy;

    if (sx * sx + sy * sy <= Math.pow(radius, 2)) {
      seeds.push({ x: sx, y: sy });
    } else {
      i--;
    }
  }
  return seeds;
}

export function drawSeeds(context, entity) {

    const {position, rotation, fractureSeeds} = entity;

    const c = Math.cos(rotation);
    const s = Math.sin(rotation);

    context.fillStyle = 'red';
    for (const seed of fractureSeeds) {
        const seedAbsolute = {
            x: position.x + seed.x * c - seed.y * s,
            y: position.y + seed.x * s + seed.y * c,
            rotation: rotation
        };
        context.beginPath();
        context.arc(seedAbsolute.x, seedAbsolute.y, 2, 0, Math.PI * 2);
        context.fill();
    }
}

export function calculateImpactPoint(a, b) {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const sin = Math.sin(-a.rotation);
    const cos = Math.cos(-a.rotation);

    const localImpactPoint = {
        x: dx * cos - dy * sin,
        y: dx * sin + dy * cos,
    };

    return localImpactPoint;
}
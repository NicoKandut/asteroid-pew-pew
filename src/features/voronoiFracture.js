//Settings
const seedCount = 5;
const bias = 0.7;
const scale = 10;

export function generateVoronoiSeeds(impactPoint, radius) {
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
    const { position, rotation, fractureSeeds } = entity;

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

export function computeVoronoiField(entity, noiseFn = null) {
    const { fractureSeeds, radius } = entity;
    const width = radius * 2;
    const height = radius * 2;

    const cellMap = new Uint8Array(width * height);

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;

    const ctx = offscreen.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const cx = width / 2;
    const cy = height / 2;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const lx = x - cx;
            const ly = y - cy;

            let minDistSq = Infinity;
            let closestSeedIndex = -1;

            for (let i = 0; i < fractureSeeds.length; i++) {
                const seed = fractureSeeds[i];
                let dx = lx - seed.x;
                let dy = ly - seed.y;

                if (noiseFn) {
                    const n = noiseFn(x, y);
                    dx += (n - 0.5) * 10;
                    dy += (n - 0.5) * 10;
                }

                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    closestSeedIndex = i;
                }
            }

            cellMap[y * width + x] = closestSeedIndex;

            const dist = Math.sqrt(minDistSq);
            const norm = Math.min(1, dist / radius);

            const index = (y * width + x) * 4;

            const [r, g, b] = heatmapColor(norm);
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return { heatMap: offscreen, cellMap: cellMap };
}

function heatmapColor(t) {
    t = Math.max(0, Math.min(1, t));

    if (t < 0.33) {
        const k = t / 0.33;
        return [255, Math.round(255 * k), 0];
    } else if (t < 0.66) {
        const k = (t - 0.33) / 0.33;
        return [Math.round(255 * (1 - k)), 255, 0];
    } else {
        const k = (t - 0.66) / 0.34;
        return [0, Math.round(255 * (1 - k)), Math.round(255 * k)];
    }
}

export function generateNoise(entity) {
    const height = entity.radius * 2;
    const width = entity.radius * 2;

    const noise = new Float32Array(width * height);
    const gridX = Math.floor(width / scale) + 2;
    const gridY = Math.floor(height / scale) + 2;

    const grid = [];
    for (let i = 0; i < gridY * gridX; i++) {
        grid.push(Math.random());
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const gx = Math.floor(x / scale);
            const gy = Math.floor(y / scale);

            const lx = (x % scale) / scale;
            const ly = (y % scale) / scale;

            const i = gy * gridX + gx;
            const tl = grid[i];
            const tr = grid[i + 1];
            const bl = grid[i + gridX];
            const br = grid[i + gridX + 1];

            const top = tl * (1 - lx) + tr * lx;
            const bottom = bl * (1 - lx) + br * lx;
            noise[y * width + x] = top * (1 - ly) + bottom * ly;
        }
    }

    const noiseFn = (x, y) => noise[y * width + x];
    return noiseFn;
}

export function createFragementTexture(originalTexture, cellMap, entity) {
    const fragments = [];

    const width = entity.radius * 2;
    const height = entity.radius * 2;

    for (let i = 0; i < seedCount; i++) {
        let minX = width, minY = height, maxX = 0, maxY = 0

        for (let p = 0; p < cellMap.length; p++) {
            if (cellMap[p] !== i) continue;

            const currentX = p % width;
            const currentY = Math.floor(p / width);

            minX = currentX < minX ? currentX : minX;
            minY = currentY < minY ? currentY : minY;
            maxX = currentX > maxX ? currentX : maxX;
            maxY = currentY > maxY ? currentY : maxY;
        }

        const fragWidth = (maxX - minX) + 1;
        const fragHeight = (maxY - minY) + 1;

        const fragRadius = Math.max(fragWidth, fragHeight) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = fragRadius * 2;
        canvas.height = fragRadius * 2;
        const ctx = canvas.getContext('2d');

        const fragImage = ctx.createImageData(fragRadius * 2, fragRadius * 2);
        let fragPixels = fragImage.data;

        const srcCtx = originalTexture.getContext('2d');
        const srcImageData = srcCtx.getImageData(0, 0, width, height);
        const srcPixels = srcImageData.data;

        for (let p = 0; p < cellMap.length; p++) {
            if (cellMap[p] !== i) continue;

            const currentX = p % width;
            const currentY = Math.floor(p / width);
            const fragX = currentX - minX;
            const fragY = currentY - minY;

            const fragIndex = (fragY * fragWidth + fragX) * 4;
            const srcIndex = p * 4;

            fragPixels[fragIndex] = srcPixels[srcIndex];
            fragPixels[fragIndex + 1] = srcPixels[srcIndex + 1];
            fragPixels[fragIndex + 2] = srcPixels[srcIndex + 2];
            fragPixels[fragIndex + 3] = srcPixels[srcIndex + 3];
        }

        ctx.putImageData(fragImage, 0, 0);

        fragments.push(canvas);
    }

    return fragments;
}

function downloadCanvas(canvas, filename = 'fragment.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}
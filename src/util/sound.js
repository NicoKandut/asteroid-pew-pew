import propulsionUrl from "/audio/propulsion.mp3?url";
import bonkUrl from "/audio/bonk.mp3?url";
import explosionUrl from "/audio/explosion.mp3?url";
import laserUrl from "/audio/laser.mp3?url";
import metalHitUrl from "/audio/metal-hit.mp3?url";

let volumeModifier = 0.5;
export const setVolumeModifier = (value) => {
  volumeModifier = value;
};

// propulsion sound plays per default
const audioPropulsion = new Audio(propulsionUrl);
audioPropulsion.volume = 0;
audioPropulsion.loop = true;
document.addEventListener("keydown", () => audioPropulsion.play().catch(() => {}), { once: true });

export const setPropulsionVolume = (value) => {
  audioPropulsion.volume = value * volumeModifier;
};

export const playAsteroidCollisionSound = () => {
  const audio = new Audio(bonkUrl);
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

export const playSpaceshipCollisionSound = () => {
  const audio = new Audio(metalHitUrl);
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

export const playBulletShootSound = () => {
  const audio = new Audio(laserUrl);
  audio.volume = 0.3 * volumeModifier;
  audio.play().catch(() => {});
};

export const playBulletHitSound = () => {
  // const audio = new Audio(laserUrl);
  // audio.volume = 0.3 * volumeModifier;
  // audio.play().catch(() => {});
};

export const playExplosionSound = () => {
  const audio = new Audio(explosionUrl);
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

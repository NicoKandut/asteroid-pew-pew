export const AUDIO_DIR = "audio/";

let volumeModifier = 0.5;
export const setVolumeModifier = (value) => {
  volumeModifier = value;
};

// propulsion sound plays per default
const audioPropulsion = new Audio(AUDIO_DIR + "propulsion.mp3");
audioPropulsion.volume = 0;
audioPropulsion.loop = true;
document.addEventListener("keydown", () => audioPropulsion.play().catch(() => {}), { once: true });

export const setPropulsionVolume = (value) => {
  audioPropulsion.volume = value * volumeModifier;
};

export const playAsteroidCollisionSound = () => {
  const audio = new Audio(AUDIO_DIR + "bonk.mp3");
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

export const playSpaceshipCollisionSound = () => {
  const audio = new Audio(AUDIO_DIR + "metal-hit.mp3");
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

export const playBulletShootSound = () => {
  const audio = new Audio(AUDIO_DIR + "laser.mp3");
  audio.volume = 0.3 * volumeModifier;
  audio.play().catch(() => {});
};

export const playBulletHitSound = () => {
  // const audioHit = new Audio(AUDIO_DIR + "hit.mp3");
  // audioHit.volume = 0.05;
  // audioHit.play();
};

export const playExplosionSound = () => {
  const audio = new Audio(AUDIO_DIR + "explosion.mp3");
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

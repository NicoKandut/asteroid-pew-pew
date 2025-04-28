export const AUDIO_DIR = "https://github.com/NicoKandut/asteroid-pew-pew/raw/refs/heads/main/public/";

export const audioPropulsion = new Audio(AUDIO_DIR + "propulsion.mp3");
audioPropulsion.volume = 0;
audioPropulsion.loop = true;

document.addEventListener(
  "keydown",
  () => {
    audioPropulsion.play();
  },
  { once: true }
);

export const playAsteroidCollisionSound = () => {
  const audio = new Audio(AUDIO_DIR + "bonk.mp3");
  audio.volume = 0.05;
  audio.play();
};

export const playSpaceshipCollisionSound = () => {
  const audio = new Audio(AUDIO_DIR + "metal-hit.mp3");
  audio.volume = 0.05;
  audio.play();
};

export const playBulletShootSound = () => {
  const audio = new Audio(AUDIO_DIR + "laser.mp3");
  audio.volume = 0.02;
  audio.play();
};

export const playBulletHitSound = () => {
  // const audioHit = new Audio(AUDIO_DIR + "hit.mp3");
  // audioHit.volume = 0.05;
  // audioHit.play();
};

export const playExplosionSound = () => {
  const audio = new Audio(AUDIO_DIR + "explosion.mp3");
  audio.volume = 0.05;
  audio.play();
};

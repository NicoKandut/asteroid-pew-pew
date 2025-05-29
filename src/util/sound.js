import propulsionUrl from "/audio/propulsion.mp3?url";
import explosionUrl from "/audio/explosion.wav?url";
import laserUrl from "/audio/shoot.wav?url";
import hurtUrl from "/audio/hurt.wav?url";
import hitUrl from "/audio/hit.wav?url";
import clickUrl from "/audio/click.wav?url";
import submitUrl from "/audio/submit.wav?url";
import powerupUrl from "/audio/powerup.wav?url";
import backgroundMusicUrl from "/audio/CODEX_2015.mp3?url";
import armorHit from "/audio/armorHit.wav?url";

let volumeModifier = 0.1;
export const setVolumeModifier = (value) => {
  backgroundMusic.volume = 0.05 * value;
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

export const playSubmitSound = () => {
  const audio = new Audio(submitUrl);
  audio.volume = 0.5 * volumeModifier;
  audio.play().catch(() => {});
};

export const playClickSound = () => {
  const audio = new Audio(clickUrl);
  audio.volume = 0.5 * volumeModifier;
  audio.play().catch(() => {});
};

export const playAsteroidCollisionSound = () => {
  const audio = new Audio(hitUrl);
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

export const playSpaceshipCollisionSound = () => {
  const audio = new Audio(hurtUrl);
  audio.volume = 0.3 * volumeModifier;
  audio.play().catch(() => {});
};

export const playBulletShootSound = () => {
  const audio = new Audio(laserUrl);
  audio.volume = 0.1 * volumeModifier;
  audio.play().catch(() => {});
};

export const playBulletHitSound = () => {
  const audio = new Audio(hitUrl);
  audio.volume = 0.2 * volumeModifier;
  audio.play().catch(() => {});
};

export const playArmorHitSound = () => {
  const audio = new Audio(armorHit);
  audio.volume = 0.2 * volumeModifier;
  audio.play().catch(() => {});
};

export const playExplosionSound = () => {
  const audio = new Audio(explosionUrl);
  audio.volume = 0.3 * volumeModifier;
  audio.play().catch(() => {});
};

export const playPowerupSound = () => {
  const audio = new Audio(powerupUrl);
  audio.volume = 0.2 * volumeModifier;
  audio.play().catch(() => {});
}

const backgroundMusic = new Audio(backgroundMusicUrl);
backgroundMusic.volume = 0.05 * volumeModifier;
backgroundMusic.loop = true;

export const playBackgroundMusic = () => {
  backgroundMusic.play().catch(() => {});
};

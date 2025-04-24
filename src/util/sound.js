export const playAsteroidCollisionSound = () => {
    const audio = new Audio("/bonk.mp3");
    audio.volume = 0.05;
    audio.play();
}

export const playSpaceshipCollisionSound = () => {
    const audio = new Audio("/metal-hit.mp3");
    audio.volume = 0.05;
    audio.play();
}

export const playBulletShootSound = () => {
    const audio = new Audio("/laser.mp3");
    audio.volume = 0.02;
    audio.play();
}

export const playBulletHitSound = () => {
    // const audioHit = new Audio("/hit.mp3");
    // audioHit.volume = 0.05;
    // audioHit.play();
}

export const playExplosionSound = () => {
  const audio = new Audio("/explosion.mp3");
  audio.volume = 0.05;
  audio.play();
};

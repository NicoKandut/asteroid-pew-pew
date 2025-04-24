new Audio("/laser.mp3");


export const playBulletShootSound = () => {
    const audioHit = new Audio("/laser.mp3");
    audioHit.volume = 0.02;
    audioHit.play();
}

export const playBulletHitSound = () => {
    // const audioHit = new Audio("/hit.mp3");
    // audioHit.volume = 0.05;
    // audioHit.play();
}

export const playExplosionSound = () => {
  const audioExplosion = new Audio("/explosion.mp3");
  audioExplosion.volume = 0.05;
  audioExplosion.play();
};

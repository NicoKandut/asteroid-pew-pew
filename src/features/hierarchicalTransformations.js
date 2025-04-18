export const calcTransform = (offset, parent) => {
  if (parent == null) return offset;

  const c = Math.cos(parent.rotation);
  const s = Math.sin(parent.rotation);

  return {
    x: parent.position.x + offset.x * c - offset.y * s,
    y: parent.position.y + offset.x * s + offset.y * c,
    rotation: parent.rotation + offset.rotation,
  };
};

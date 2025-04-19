export const calcTransform = (offset, parent) => {
  if (parent == null) return offset;

  const parentTransform = calcTransform({x: parent.position.x, y: parent.position.y, rotation: parent.rotation}, parent.parent);
  
  const c = Math.cos(parentTransform.rotation);
  const s = Math.sin(parentTransform.rotation);

  return {
    x: parentTransform.x + offset.x * c - offset.y * s,
    y: parentTransform.y + offset.x * s + offset.y * c,
    rotation: parentTransform.rotation + offset.rotation,
  };
};

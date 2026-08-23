export function adjacentImageIndex(currentIndex, direction, imageCount) {
  if (imageCount <= 1) return 0;
  return (currentIndex + direction + imageCount) % imageCount;
}

export function swipeDirection(start, end, threshold = 45) {
  if (!start || !end) return 0;
  const horizontalDistance = end.x - start.x;
  const verticalDistance = end.y - start.y;
  if (Math.abs(horizontalDistance) < threshold || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return 0;
  return horizontalDistance < 0 ? 1 : -1;
}

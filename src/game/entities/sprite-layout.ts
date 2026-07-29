export function centeredBodyOffsetX(
  displayOriginX: number,
  bodyWidth: number,
): number {
  return displayOriginX - bodyWidth / 2;
}

export function centeredBodyOffsetY(
  displayOriginY: number,
  bodyHeight: number,
): number {
  return displayOriginY - bodyHeight / 2;
}

export function groundedBodyOffsetY(
  displayOriginY: number,
  bodyHeight: number,
  bodyBottomFromAnchor = 0,
): number {
  return displayOriginY + bodyBottomFromAnchor - bodyHeight;
}

import {
  centeredBodyOffsetX,
  groundedBodyOffsetY,
} from "./sprite-layout";

export const PLAYER_BODY_WIDTH = 42;
export const PLAYER_BODY_HEIGHT = 60;
export const PLAYER_BODY_BOTTOM_FROM_ANCHOR = -26;
export const PLAYER_NAMEPLATE_GAP_FROM_FEET = 6;

export function playerNameplateOffsetY(scale = 1): number {
  return PLAYER_BODY_BOTTOM_FROM_ANCHOR * scale + PLAYER_NAMEPLATE_GAP_FROM_FEET;
}

export function centeredPlayerBodyOffsetX(displayOriginX: number): number {
  return centeredBodyOffsetX(displayOriginX, PLAYER_BODY_WIDTH);
}

export function groundedPlayerBodyOffsetY(displayOriginY: number): number {
  return groundedBodyOffsetY(
    displayOriginY,
    PLAYER_BODY_HEIGHT,
    PLAYER_BODY_BOTTOM_FROM_ANCHOR,
  );
}

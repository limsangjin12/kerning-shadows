import { describe, expect, it } from "vitest";
import { spriteManifest } from "../assets/runtime-assets";
import {
  centeredPlayerBodyOffsetX,
  groundedPlayerBodyOffsetY,
  PLAYER_BODY_BOTTOM_FROM_ANCHOR,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_NAMEPLATE_GAP_FROM_FEET,
  playerNameplateOffsetY,
} from "./player-layout";
import {
  horizontalVelocityForActionStart,
  playerAirborneHorizontalVelocity,
  playerAirborneAnimation,
  playerMoveSpeed,
  playerWalkAnimationTimeScale,
  PLAYER_WALK_START_FRAME,
} from "./player-motion";
import { PLAYER_SHEET_BY_JOB } from "./player-appearance";
import { PlayerJob } from "../data/catalog";

describe("player frame alignment", () => {
  it("uses a distinct equipment sheet for every advancement rank", () => {
    expect(PLAYER_SHEET_BY_JOB).toEqual({
      [PlayerJob.Beginner]: "player",
      [PlayerJob.Rogue]: "playerRogue",
      [PlayerJob.Assassin]: "playerAssassin",
      [PlayerJob.Hermit]: "playerHermit",
      [PlayerJob.Hokage]: "playerHokage",
    });
  });
  it("uses the dedicated apex frame around zero vertical velocity", () => {
    expect(playerAirborneAnimation(-76)).toBe("jumpRise");
    expect(playerAirborneAnimation(-75)).toBe("jumpApex");
    expect(playerAirborneAnimation(0)).toBe("jumpApex");
    expect(playerAirborneAnimation(75)).toBe("jumpApex");
    expect(playerAirborneAnimation(76)).toBe("fall");
    expect(spriteManifest.sheets.player?.animations.hurt?.frameDurationMs).toBe(430);
  });

  it("preserves horizontal jump momentum when an attack starts in the air", () => {
    expect(horizontalVelocityForActionStart(210, -420, true)).toBe(210);
    expect(horizontalVelocityForActionStart(-180, 160, false)).toBe(-180);
    expect(horizontalVelocityForActionStart(210, 0, true)).toBe(0);
  });

  it("reverses airborne horizontal movement immediately while preserving released momentum", () => {
    expect(playerAirborneHorizontalVelocity(210, 0, false)).toBe(210);
    expect(playerAirborneHorizontalVelocity(260, -1, false)).toBe(-260);
    expect(playerAirborneHorizontalVelocity(-260, 1, false)).toBe(260);
    expect(playerAirborneHorizontalVelocity(312, -1, true)).toBe(-312);
  });

  it("scales the grounded walk cycle with horizontal movement speed", () => {
    expect(PLAYER_WALK_START_FRAME).toBe(1);
    expect(playerWalkAnimationTimeScale(0)).toBeCloseTo(0.78);
    expect(playerWalkAnimationTimeScale(130)).toBeCloseTo(1.05);
    expect(playerWalkAnimationTimeScale(260)).toBeCloseTo(1.32);
    expect(playerWalkAnimationTimeScale(-520)).toBeCloseTo(1.32);
    expect(playerMoveSpeed(false)).toBe(260);
    expect(playerMoveSpeed(true)).toBe(312);
    expect(playerWalkAnimationTimeScale(312, true)).toBeCloseTo(1.584);
  });

  it("keeps the collision body centered while per-frame origins change", () => {
    const frameWidth = spriteManifest.sheetDefaults.frameWidth;
    const origins = Object.values(spriteManifest.sheets.player?.frameOrigins ?? {});

    expect(origins).toHaveLength(16);
    for (const origin of origins) {
      const displayOriginX = origin.x * frameWidth;
      const displayOriginY = origin.y * spriteManifest.sheetDefaults.frameHeight;
      const bodyCenterX =
        -displayOriginX +
        centeredPlayerBodyOffsetX(displayOriginX) +
        PLAYER_BODY_WIDTH / 2;
      const bodyBottomY =
        -displayOriginY +
        groundedPlayerBodyOffsetY(displayOriginY) +
        PLAYER_BODY_HEIGHT;
      expect(bodyCenterX).toBe(0);
      expect(bodyBottomY).toBe(PLAYER_BODY_BOTTOM_FROM_ANCHOR);
    }
  });

  it("keeps idle and walk artwork 26 pixels above the visual anchor", () => {
    const origins = spriteManifest.sheets.player?.frameOrigins ?? {};
    const frameHeight = spriteManifest.sheetDefaults.frameHeight;

    for (const frame of ["0", "1", "2", "3"]) {
      expect(origins[frame]?.y).toBe(140 / frameHeight);
    }
    for (const frame of ["4", "5", "6", "7"]) {
      expect(origins[frame]?.y).toBe(128 / frameHeight);
    }
    expect(PLAYER_BODY_BOTTOM_FROM_ANCHOR).toBe(-26);
  });

  it("places the nameplate six pixels below the visual feet", () => {
    expect(playerNameplateOffsetY()).toBe(-20);
    expect(playerNameplateOffsetY(1.5)).toBe(-33);
    expect(
      playerNameplateOffsetY(1.5) - PLAYER_BODY_BOTTOM_FROM_ANCHOR * 1.5,
    ).toBe(PLAYER_NAMEPLATE_GAP_FROM_FEET);
  });
});

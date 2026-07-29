import { describe, expect, it } from "vitest";
import {
  DUA_APPROACH_SPEED,
  DUA_CRUISE_SPEED_THRESHOLD,
  DUA_FOLLOW_DEAD_ZONE,
  DUA_JUMP_SPEED,
  DUA_JUMP_TARGET_HEIGHT,
  DUA_LOOT_DETECTION_RADIUS,
  DUA_PLAYER_TRAILING_DISTANCE,
  DUA_TELEPORT_DISTANCE,
  DUA_TELEPORT_VERTICAL_DISTANCE,
  PUPPUCCINO_ITEM_ID,
  defaultPetCollection,
  duaFollowTarget,
  duaMovementDecision,
  nearestGroundedLootIndexForDua,
  normalizePetCollection,
  registerDuaWithPuppuccino,
} from "./pet-rules";

describe("pet rules", () => {
  it("creates an independent unregistered Dua collection and normalizes saved data", () => {
    const first = defaultPetCollection();
    const second = defaultPetCollection();

    expect(first).toEqual({ dua: { registered: false } });
    expect(first).not.toBe(second);
    expect(first.dua).not.toBe(second.dua);
    expect(normalizePetCollection({ dua: { registered: true } })).toEqual({
      dua: { registered: true },
    });
    expect(normalizePetCollection({ dua: { registered: "yes" } })).toEqual({
      dua: { registered: false },
    });
    expect(normalizePetCollection(null)).toEqual({
      dua: { registered: false },
    });
  });

  it("registers Dua with one Puppuccino without mutating the saved state", () => {
    const state = {
      pets: defaultPetCollection(),
      inventory: {
        mushroomCap: 3,
        [PUPPUCCINO_ITEM_ID]: 2,
      },
    };

    const result = registerDuaWithPuppuccino(state);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.state).toEqual({
      pets: { dua: { registered: true } },
      inventory: { mushroomCap: 3, [PUPPUCCINO_ITEM_ID]: 1 },
    });
    expect(result.state).not.toBe(state);
    expect(result.state.pets).not.toBe(state.pets);
    expect(result.state.pets.dua).not.toBe(state.pets.dua);
    expect(result.state.inventory).not.toBe(state.inventory);
    expect(state).toEqual({
      pets: { dua: { registered: false } },
      inventory: { mushroomCap: 3, [PUPPUCCINO_ITEM_ID]: 2 },
    });
  });

  it("leaves state untouched when the Puppuccino is missing or Dua is registered", () => {
    const withoutItem = {
      pets: defaultPetCollection(),
      inventory: { mushroomCap: 1 },
    };
    const missingResult = registerDuaWithPuppuccino(withoutItem);
    expect(missingResult).toEqual({
      success: false,
      state: withoutItem,
      reason: "item-not-owned",
    });
    expect(missingResult.state).toBe(withoutItem);

    const registered = {
      pets: { dua: { registered: true } },
      inventory: { [PUPPUCCINO_ITEM_ID]: 1 },
    };
    const registeredResult = registerDuaWithPuppuccino(registered);
    expect(registeredResult).toEqual({
      success: false,
      state: registered,
      reason: "already-registered",
    });
    expect(registeredResult.state).toBe(registered);
    expect(registered.inventory[PUPPUCCINO_ITEM_ID]).toBe(1);
  });

  it("selects the nearest grounded loot to Dua inside the player detection radius", () => {
    const player = { x: 100, y: 100 };
    const dua = { x: 300, y: 100 };
    const candidates = [
      { x: 120, y: 100, grounded: true },
      { x: 280, y: 100, grounded: false },
      { x: 320, y: 100, grounded: true },
      {
        x: player.x + DUA_LOOT_DETECTION_RADIUS + 1,
        y: 100,
        grounded: true,
      },
    ];

    expect(nearestGroundedLootIndexForDua(player, dua, candidates)).toBe(2);
    expect(
      nearestGroundedLootIndexForDua(player, dua, candidates, 15),
    ).toBeUndefined();
  });

  it("places the follow target behind the player's facing direction", () => {
    const player = { x: 500, y: 610 };
    expect(duaFollowTarget(player, 1)).toEqual({
      x: 500 - DUA_PLAYER_TRAILING_DISTANCE,
      y: 610,
    });
    expect(duaFollowTarget(player, -1)).toEqual({
      x: 500 + DUA_PLAYER_TRAILING_DISTANCE,
      y: 610,
    });
  });

  it("approaches nearby targets, idles in the dead zone, and teleports when stranded", () => {
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 100 + DUA_FOLLOW_DEAD_ZONE, y: 610 },
      ),
    ).toEqual({ kind: "idle", shouldJump: false });
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 100, y: 610 - DUA_JUMP_TARGET_HEIGHT - 1 },
      ),
    ).toEqual({ kind: "idle", shouldJump: true });
    expect(
      duaMovementDecision({ x: 100, y: 610 }, { x: 240, y: 500 }),
    ).toEqual({
      kind: "approach",
      direction: 1,
      speed: DUA_APPROACH_SPEED,
      shouldJump: true,
    });
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 240, y: 610 },
        { grounded: true, blockedLeft: false, blockedRight: true },
      ),
    ).toEqual({
      kind: "approach",
      direction: 1,
      speed: DUA_APPROACH_SPEED,
      shouldJump: true,
    });
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 100 + DUA_TELEPORT_DISTANCE + 1, y: 610 },
      ),
    ).toEqual({
      kind: "teleport",
      position: { x: 100 + DUA_TELEPORT_DISTANCE + 1, y: 610 },
    });
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 130, y: 610 - DUA_TELEPORT_VERTICAL_DISTANCE - 1 },
      ),
    ).toEqual({
      kind: "teleport",
      position: {
        x: 130,
        y: 610 - DUA_TELEPORT_VERTICAL_DISTANCE - 1,
      },
    });
    expect(DUA_APPROACH_SPEED).toBeGreaterThan(312);
    expect(DUA_JUMP_SPEED).toBeGreaterThanOrEqual(660);
  });

  it("matches a moving player's speed inside the follow dead zone instead of stopping", () => {
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 100 + DUA_FOLLOW_DEAD_ZONE, y: 610 },
        {
          grounded: true,
          blockedLeft: false,
          blockedRight: false,
          targetVelocityX: 260,
        },
      ),
    ).toEqual({
      kind: "approach",
      direction: 1,
      speed: 260,
      shouldJump: false,
    });
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 100, y: 610 },
        {
          grounded: true,
          blockedLeft: true,
          blockedRight: false,
          targetVelocityX: -312,
        },
      ),
    ).toEqual({
      kind: "approach",
      direction: -1,
      speed: 312,
      shouldJump: true,
    });
    expect(
      duaMovementDecision(
        { x: 100, y: 610 },
        { x: 100, y: 610 },
        {
          grounded: true,
          blockedLeft: false,
          blockedRight: false,
          targetVelocityX: DUA_CRUISE_SPEED_THRESHOLD,
        },
      ),
    ).toEqual({ kind: "idle", shouldJump: false });
  });
});

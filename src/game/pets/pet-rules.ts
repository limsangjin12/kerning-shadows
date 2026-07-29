export const PUPPUCCINO_ITEM_ID = "puppuccino";

export interface PetCollection {
  dua: {
    registered: boolean;
  };
}

export interface PetRegistrationState {
  pets: PetCollection;
  inventory: Record<string, number>;
}

export type DuaRegistrationFailureReason =
  | "item-not-owned"
  | "already-registered";

export type DuaRegistrationResult =
  | {
      success: true;
      state: PetRegistrationState;
    }
  | {
      success: false;
      state: PetRegistrationState;
      reason: DuaRegistrationFailureReason;
    };

export interface PetPoint {
  x: number;
  y: number;
}

export interface PetLootCandidate extends PetPoint {
  grounded: boolean;
}

export const DUA_LOOT_DETECTION_RADIUS = 720;
export const DUA_LOOT_PICKUP_DISTANCE = 44;
export const DUA_PLAYER_TRAILING_DISTANCE = 72;
export const DUA_FOLLOW_DEAD_ZONE = 20;
export const DUA_APPROACH_SPEED = 360;
export const DUA_CRUISE_SPEED_THRESHOLD = 20;
export const DUA_JUMP_SPEED = 700;
export const DUA_JUMP_TARGET_HEIGHT = 32;
export const DUA_TELEPORT_DISTANCE = 560;
export const DUA_TELEPORT_VERTICAL_DISTANCE = 220;

export interface DuaMovementContext {
  grounded: boolean;
  blockedLeft: boolean;
  blockedRight: boolean;
  targetVelocityX?: number;
}

export type DuaMovementDecision =
  | {
      kind: "idle";
      shouldJump: boolean;
    }
  | {
      kind: "approach";
      direction: -1 | 1;
      speed: number;
      shouldJump: boolean;
    }
  | {
      kind: "teleport";
      position: PetPoint;
    };

export function defaultPetCollection(): PetCollection {
  return {
    dua: {
      registered: false,
    },
  };
}

export function normalizePetCollection(value: unknown): PetCollection {
  if (!isRecord(value) || !isRecord(value.dua)) {
    return defaultPetCollection();
  }

  return {
    dua: {
      registered:
        typeof value.dua.registered === "boolean"
          ? value.dua.registered
          : false,
    },
  };
}

export function registerDuaWithPuppuccino(
  state: PetRegistrationState,
): DuaRegistrationResult {
  if (state.pets.dua.registered) {
    return {
      success: false,
      state,
      reason: "already-registered",
    };
  }

  const owned = nonNegativeItemCount(state.inventory[PUPPUCCINO_ITEM_ID]);
  if (owned === 0) {
    return {
      success: false,
      state,
      reason: "item-not-owned",
    };
  }

  return {
    success: true,
    state: {
      pets: {
        ...state.pets,
        dua: {
          ...state.pets.dua,
          registered: true,
        },
      },
      inventory: {
        ...state.inventory,
        [PUPPUCCINO_ITEM_ID]: owned - 1,
      },
    },
  };
}

export function nearestGroundedLootIndexForDua(
  player: PetPoint,
  dua: PetPoint,
  candidates: readonly PetLootCandidate[],
  detectionRadius = DUA_LOOT_DETECTION_RADIUS,
): number | undefined {
  if (!Number.isFinite(detectionRadius) || detectionRadius < 0) {
    return undefined;
  }

  const detectionRadiusSquared = detectionRadius ** 2;
  let nearestIndex: number | undefined;
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    if (
      !candidate.grounded ||
      !isFinitePoint(candidate) ||
      squaredDistance(player, candidate) > detectionRadiusSquared
    ) {
      return;
    }

    const distanceSquared = squaredDistance(dua, candidate);
    if (distanceSquared < nearestDistanceSquared) {
      nearestIndex = index;
      nearestDistanceSquared = distanceSquared;
    }
  });

  return nearestIndex;
}

export function duaFollowTarget(
  player: PetPoint,
  facingDirection: -1 | 1,
): PetPoint {
  return {
    x: player.x - facingDirection * DUA_PLAYER_TRAILING_DISTANCE,
    y: player.y,
  };
}

export function duaMovementDecision(
  current: PetPoint,
  target: PetPoint,
  context: DuaMovementContext = {
    grounded: false,
    blockedLeft: false,
    blockedRight: false,
  },
): DuaMovementDecision {
  const horizontalDistance = target.x - current.x;
  const verticalDistance = target.y - current.y;
  if (
    Math.abs(horizontalDistance) > DUA_TELEPORT_DISTANCE ||
    Math.abs(verticalDistance) > DUA_TELEPORT_VERTICAL_DISTANCE
  ) {
    return {
      kind: "teleport",
      position: { ...target },
    };
  }

  const targetAbove = verticalDistance < -DUA_JUMP_TARGET_HEIGHT;
  if (Math.abs(horizontalDistance) <= DUA_FOLLOW_DEAD_ZONE) {
    const targetVelocityX = Number.isFinite(context.targetVelocityX)
      ? (context.targetVelocityX ?? 0)
      : 0;
    if (Math.abs(targetVelocityX) > DUA_CRUISE_SPEED_THRESHOLD) {
      const direction = targetVelocityX < 0 ? -1 : 1;
      const blockedInDirection =
        context.grounded &&
        (direction < 0 ? context.blockedLeft : context.blockedRight);
      return {
        kind: "approach",
        direction,
        speed: Math.min(Math.abs(targetVelocityX), DUA_APPROACH_SPEED),
        shouldJump: targetAbove || blockedInDirection,
      };
    }
    return { kind: "idle", shouldJump: targetAbove };
  }

  const direction = horizontalDistance < 0 ? -1 : 1;
  const blockedInDirection =
    context.grounded &&
    (direction < 0 ? context.blockedLeft : context.blockedRight);
  return {
    kind: "approach",
    direction,
    speed: DUA_APPROACH_SPEED,
    shouldJump: targetAbove || blockedInDirection,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeItemCount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value ?? 0)) : 0;
}

function isFinitePoint(point: PetPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function squaredDistance(left: PetPoint, right: PetPoint): number {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2;
}

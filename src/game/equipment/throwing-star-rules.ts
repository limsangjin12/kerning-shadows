export const ThrowingStarTier = {
  Tier1: "tier1",
  Tier2: "tier2",
  Tier3: "tier3",
  Tier4: "tier4",
  Tier5: "tier5",
  Tier6: "tier6",
} as const;

export type ThrowingStarTier =
  (typeof ThrowingStarTier)[keyof typeof ThrowingStarTier];

export interface ThrowingStarDefinition {
  id: ThrowingStarTier;
  name: string;
  grade: number;
  price: number;
  damageMultiplier: number;
  projectileFrame: number;
  projectileScaleMultiplier: number;
}

export const THROWING_STAR_CATALOG = {
  [ThrowingStarTier.Tier1]: {
    id: ThrowingStarTier.Tier1,
    name: "수련생 표창",
    grade: 1,
    price: 50,
    damageMultiplier: 1,
    projectileFrame: 0,
    projectileScaleMultiplier: 1,
  },
  [ThrowingStarTier.Tier2]: {
    id: ThrowingStarTier.Tier2,
    name: "강철 표창",
    grade: 2,
    price: 250,
    damageMultiplier: 1.08,
    projectileFrame: 3,
    projectileScaleMultiplier: 1,
  },
  [ThrowingStarTier.Tier3]: {
    id: ThrowingStarTier.Tier3,
    name: "청옥 표창",
    grade: 3,
    price: 1_000,
    damageMultiplier: 1.18,
    projectileFrame: 6,
    projectileScaleMultiplier: 1,
  },
  [ThrowingStarTier.Tier4]: {
    id: ThrowingStarTier.Tier4,
    name: "홍염 표창",
    grade: 4,
    price: 4_000,
    damageMultiplier: 1.32,
    projectileFrame: 9,
    projectileScaleMultiplier: 1,
  },
  [ThrowingStarTier.Tier5]: {
    id: ThrowingStarTier.Tier5,
    name: "일식 표창",
    grade: 5,
    price: 12_000,
    damageMultiplier: 1.5,
    projectileFrame: 12,
    projectileScaleMultiplier: 1,
  },
  [ThrowingStarTier.Tier6]: {
    id: ThrowingStarTier.Tier6,
    name: "초대형 고드름",
    grade: 6,
    price: 0,
    damageMultiplier: 2,
    projectileFrame: 6,
    projectileScaleMultiplier: 1.75,
  },
} as const satisfies Record<ThrowingStarTier, ThrowingStarDefinition>;

export const THROWING_STAR_TIERS = Object.values(ThrowingStarTier) as readonly ThrowingStarTier[];

export const THROWING_STAR_SHOP_TIERS = [
  ThrowingStarTier.Tier1,
  ThrowingStarTier.Tier2,
  ThrowingStarTier.Tier3,
  ThrowingStarTier.Tier4,
  ThrowingStarTier.Tier5,
] as const;

export type PurchasableThrowingStarTier =
  (typeof THROWING_STAR_SHOP_TIERS)[number];

export interface ThrowingStarLoadout {
  owned: readonly ThrowingStarTier[];
  equipped: ThrowingStarTier;
}

export interface ThrowingStarShopState extends ThrowingStarLoadout {
  mesos: number;
}

export const DEFAULT_THROWING_STAR_LOADOUT: ThrowingStarLoadout = {
  owned: [ThrowingStarTier.Tier1],
  equipped: ThrowingStarTier.Tier1,
};

export type ThrowingStarPurchaseFailureReason =
  | "already-owned"
  | "insufficient-mesos";

export type ThrowingStarPurchaseResult =
  | {
      success: true;
      state: ThrowingStarShopState;
      item: ThrowingStarDefinition;
    }
  | {
      success: false;
      state: ThrowingStarShopState;
      reason: ThrowingStarPurchaseFailureReason;
    };

export type ThrowingStarEquipFailureReason =
  | "already-equipped"
  | "item-not-owned";

export type ThrowingStarEquipResult =
  | {
      success: true;
      state: ThrowingStarLoadout;
      item: ThrowingStarDefinition;
    }
  | {
      success: false;
      state: ThrowingStarLoadout;
      reason: ThrowingStarEquipFailureReason;
    };

export function purchaseThrowingStar(
  state: ThrowingStarShopState,
  tier: PurchasableThrowingStarTier,
): ThrowingStarPurchaseResult {
  if (state.owned.includes(tier)) {
    return { success: false, state, reason: "already-owned" };
  }

  const item = THROWING_STAR_CATALOG[tier];
  if (!Number.isFinite(state.mesos) || state.mesos < item.price) {
    return { success: false, state, reason: "insufficient-mesos" };
  }

  return {
    success: true,
    item,
    state: {
      mesos: state.mesos - item.price,
      owned: [...state.owned, tier],
      equipped: state.equipped,
    },
  };
}

export function equipThrowingStar(
  state: ThrowingStarLoadout,
  tier: ThrowingStarTier,
): ThrowingStarEquipResult {
  if (!state.owned.includes(tier)) {
    return { success: false, state, reason: "item-not-owned" };
  }
  if (state.equipped === tier) {
    return { success: false, state, reason: "already-equipped" };
  }

  return {
    success: true,
    item: THROWING_STAR_CATALOG[tier],
    state: {
      owned: [...state.owned],
      equipped: tier,
    },
  };
}

export function throwingStarDamageMultiplier(
  tier: ThrowingStarTier,
): number {
  return THROWING_STAR_CATALOG[tier].damageMultiplier;
}

export function applyThrowingStarDamage(
  baseDamage: number,
  tier: ThrowingStarTier,
): number {
  if (!Number.isFinite(baseDamage) || baseDamage <= 0) return 0;
  return Math.max(
    0,
    Math.floor(baseDamage * throwingStarDamageMultiplier(tier)),
  );
}

export function isThrowingStarTier(value: unknown): value is ThrowingStarTier {
  return (
    typeof value === "string" &&
    THROWING_STAR_TIERS.includes(value as ThrowingStarTier)
  );
}

export function normalizeThrowingStarLoadout(
  value: unknown,
): ThrowingStarLoadout {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      owned: [...DEFAULT_THROWING_STAR_LOADOUT.owned],
      equipped: DEFAULT_THROWING_STAR_LOADOUT.equipped,
    };
  }

  const record = value as Record<string, unknown>;
  const parsedOwned = Array.isArray(record.owned)
    ? record.owned.filter(isThrowingStarTier)
    : [];
  const owned = [
    ThrowingStarTier.Tier1,
    ...parsedOwned.filter((tier) => tier !== ThrowingStarTier.Tier1),
  ].filter((tier, index, tiers) => tiers.indexOf(tier) === index);
  const equipped =
    isThrowingStarTier(record.equipped) && owned.includes(record.equipped)
      ? record.equipped
      : ThrowingStarTier.Tier1;
  return { owned, equipped };
}

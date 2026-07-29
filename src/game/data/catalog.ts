export const PlayerJob = {
  Beginner: "beginner",
  Rogue: "rogue",
  Assassin: "assassin",
  Hermit: "hermit",
  Hokage: "hokage",
} as const;

export type PlayerJob = (typeof PlayerJob)[keyof typeof PlayerJob];

export const PLAYER_JOB_LABELS: Record<PlayerJob, string> = {
  [PlayerJob.Beginner]: "초보자",
  [PlayerJob.Rogue]: "로그",
  [PlayerJob.Assassin]: "어쌔신",
  [PlayerJob.Hermit]: "허밋",
  [PlayerJob.Hokage]: "호카게",
};

export const PLAYER_JOB_RANK: Record<PlayerJob, number> = {
  [PlayerJob.Beginner]: 0,
  [PlayerJob.Rogue]: 1,
  [PlayerJob.Assassin]: 2,
  [PlayerJob.Hermit]: 3,
  [PlayerJob.Hokage]: 4,
};

export const PlayerStat = {
  Str: "str",
  Dex: "dex",
  Int: "int",
  Luk: "luk",
} as const;

export type PlayerStat = (typeof PlayerStat)[keyof typeof PlayerStat];

export interface PlayerStats {
  str: number;
  dex: number;
  int: number;
  luk: number;
}

export interface PlayerSkillLevels {
  luckySeven: number;
  shadowVolley: number;
  keenSight: number;
  drain: number;
  phantomStars: number;
  criticalThrow: number;
  avenger: number;
  abyssRain: number;
  shadowBreathing: number;
  rasengan: number;
  nineTailsTransformation: number;
  tailedBeastBomb: number;
  teamAssault: number;
  thunderOrb: number;
  sageMode: number;
}

export interface PlayerProfile {
  id: "local-player";
  name: string;
  level: number;
  job: PlayerJob;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  mesos: number;
  stats: PlayerStats;
  statPoints: number;
  autoAllocateStats: boolean;
  skillPoints: number;
  skillLevels: PlayerSkillLevels;
}

export const DEFAULT_PLAYER_PROFILE: Readonly<PlayerProfile> = {
  id: "local-player",
  name: "루키",
  level: 9,
  job: PlayerJob.Beginner,
  hp: 180,
  maxHp: 180,
  mp: 90,
  maxMp: 90,
  mesos: 0,
  stats: {
    str: 4,
    dex: 25,
    int: 4,
    luk: 37,
  },
  statPoints: 0,
  autoAllocateStats: false,
  skillPoints: 0,
  skillLevels: {
    luckySeven: 0,
    shadowVolley: 0,
    keenSight: 0,
    drain: 0,
    phantomStars: 0,
    criticalThrow: 0,
    avenger: 0,
    abyssRain: 0,
    shadowBreathing: 0,
    rasengan: 0,
    nineTailsTransformation: 0,
    tailedBeastBomb: 0,
    teamAssault: 0,
    thunderOrb: 0,
    sageMode: 0,
  },
};

export function playerJobLabel(job: PlayerJob): string {
  return PLAYER_JOB_LABELS[job];
}

export const MONSTER_CATALOG = {
  greenMushroom: {
    name: "초록버섯",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 12,
    maxHp: 240,
    touchDamage: 18,
    defense: 0,
    moveSpeed: 48,
    expReward: 25,
    spriteSheet: "greenMushroom",
    visualScale: 1,
    bodyWidth: 54,
    bodyHeight: 42,
    drops: [
      {
        kind: "mesos",
        chance: 1,
        minAmount: 25,
        maxAmount: 50,
        spriteAnimation: "mesoPouch",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "mushroomCap",
        amount: 1,
        spriteAnimation: "mushroomCap",
      },
    ],
  },
  shadowSentinel: {
    name: "그림자 파수꾼",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 35,
    maxHp: 14_000,
    touchDamage: 90,
    defense: 80,
    moveSpeed: 72,
    expReward: 110,
    spriteSheet: "shadowSentinel",
    visualScale: 1.16,
    bodyWidth: 82,
    bodyHeight: 58,
    drops: [
      {
        kind: "mesos",
        chance: 1,
        minAmount: 400,
        maxAmount: 650,
        spriteAnimation: "mesoPouch",
      },
      {
        kind: "item",
        chance: 0.45,
        itemId: "recoveryBottle",
        amount: 1,
        spriteAnimation: "recoveryBottle",
      },
    ],
  },
  abyssGolem: {
    name: "심연의 골렘",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 70,
    maxHp: 160_000,
    touchDamage: 260,
    defense: 200,
    moveSpeed: 45,
    expReward: 260,
    spriteSheet: "abyssGolem",
    visualScale: 1.48,
    bodyWidth: 92,
    bodyHeight: 104,
    drops: [
      {
        kind: "mesos",
        chance: 1,
        minAmount: 5_000,
        maxAmount: 8_000,
        spriteAnimation: "mesoPouch",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "recoveryBottle",
        amount: 2,
        spriteAnimation: "recoveryBottle",
      },
    ],
  },
  crystalSentinel: {
    name: "수정굴 늑대",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 35,
    maxHp: 14_000,
    touchDamage: 90,
    defense: 80,
    moveSpeed: 96,
    expReward: 110,
    spriteSheet: "moonWolf",
    visualScale: 1.08,
    bodyWidth: 96,
    bodyHeight: 58,
    drops: [
      { kind: "mesos", chance: 1, minAmount: 400, maxAmount: 650, spriteAnimation: "mesoPouch" },
      { kind: "item", chance: 0.45, itemId: "recoveryBottle", amount: 1, spriteAnimation: "recoveryBottle" },
    ],
  },
  clockworkSentinel: {
    name: "망각된 기술자 좀비",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 50,
    maxHp: 50_000,
    touchDamage: 150,
    defense: 140,
    moveSpeed: 34,
    expReward: 170,
    spriteSheet: "plagueZombie",
    visualScale: 1.06,
    bodyWidth: 62,
    bodyHeight: 96,
    drops: [
      { kind: "mesos", chance: 1, minAmount: 800, maxAmount: 1_200, spriteAnimation: "mesoPouch" },
      { kind: "item", chance: 0.55, itemId: "recoveryBottle", amount: 1, spriteAnimation: "recoveryBottle" },
    ],
  },
  coralGolem: {
    name: "산호 맹그로브",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 75,
    maxHp: 220_000,
    touchDamage: 280,
    defense: 220,
    moveSpeed: 26,
    expReward: 280,
    spriteSheet: "ancientTreant",
    visualScale: 1.12,
    bodyWidth: 76,
    bodyHeight: 104,
    drops: [
      { kind: "mesos", chance: 1, minAmount: 5_500, maxAmount: 8_500, spriteAnimation: "mesoPouch" },
      { kind: "item", chance: 1, itemId: "recoveryBottle", amount: 2, spriteAnimation: "recoveryBottle" },
    ],
  },
  emberGolem: {
    name: "잿불 광부 좀비",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 105,
    maxHp: 750_000,
    touchDamage: 450,
    defense: 320,
    moveSpeed: 58,
    expReward: 420,
    spriteSheet: "plagueZombie",
    visualScale: 1.12,
    bodyWidth: 66,
    bodyHeight: 100,
    drops: [
      { kind: "mesos", chance: 1, minAmount: 8_000, maxAmount: 12_000, spriteAnimation: "mesoPouch" },
      { kind: "item", chance: 1, itemId: "recoveryBottle", amount: 2, spriteAnimation: "recoveryBottle" },
    ],
  },
  arcaneGolem: {
    name: "월광 늑대",
    bossRank: "normal",
    instantDefeatOnHit: false,
    level: 150,
    maxHp: 4_000_000,
    touchDamage: 850,
    defense: 450,
    moveSpeed: 116,
    expReward: 700,
    spriteSheet: "moonWolf",
    visualScale: 1.16,
    bodyWidth: 100,
    bodyHeight: 62,
    drops: [
      { kind: "mesos", chance: 1, minAmount: 14_000, maxAmount: 20_000, spriteAnimation: "mesoPouch" },
      { kind: "item", chance: 1, itemId: "recoveryBottle", amount: 3, spriteAnimation: "recoveryBottle" },
    ],
  },
  emberWarden: {
    name: "폭열군주 이그니카르",
    bossRank: "midboss",
    instantDefeatOnHit: false,
    level: 100,
    maxHp: 4_000_000,
    touchDamage: 600,
    defense: 400,
    moveSpeed: 38,
    expReward: 5_000,
    spriteSheet: "emberWarden",
    visualScale: 1.42,
    bodyWidth: 116,
    bodyHeight: 92,
    drops: [
      {
        kind: "mesos",
        chance: 1,
        minAmount: 50_000,
        maxAmount: 75_000,
        spriteAnimation: "mesoPouch",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "recoveryBottle",
        amount: 3,
        spriteAnimation: "recoveryBottle",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "emberCore",
        amount: 1,
        spriteAnimation: "recoveryBottle",
      },
    ],
  },
  eclipseArchivist: {
    name: "월식현자 루나시온",
    bossRank: "upperboss",
    instantDefeatOnHit: false,
    level: 140,
    maxHp: 20_000_000,
    touchDamage: 1_000,
    defense: 600,
    moveSpeed: 46,
    expReward: 12_000,
    spriteSheet: "eclipseArchivist",
    visualScale: 1.58,
    bodyWidth: 94,
    bodyHeight: 108,
    drops: [
      {
        kind: "mesos",
        chance: 1,
        minAmount: 200_000,
        maxAmount: 300_000,
        spriteAnimation: "mesoPouch",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "recoveryBottle",
        amount: 5,
        spriteAnimation: "recoveryBottle",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "moonlitCodex",
        amount: 1,
        spriteAnimation: "mushroomCap",
      },
    ],
  },
  onePunchMan: {
    name: "원펀맨",
    bossRank: "finalboss",
    instantDefeatOnHit: true,
    knockbackImmune: true,
    level: 200,
    maxHp: 80_000_000,
    touchDamage: 1,
    defense: 400,
    moveSpeed: 90,
    expReward: 20_000,
    spriteSheet: "onePunchMan",
    visualScale: 2.45,
    bodyWidth: 58,
    bodyHeight: 102,
    drops: [
      {
        kind: "mesos",
        chance: 1,
        minAmount: 1_000_000,
        maxAmount: 1_500_000,
        spriteAnimation: "mesoPouch",
      },
      {
        kind: "item",
        chance: 1,
        itemId: "experienceBook",
        amount: 5,
        spriteAnimation: "mushroomCap",
      },
    ],
  },
} as const;

export type MonsterKind = keyof typeof MONSTER_CATALOG;
export type MonsterBossRank =
  (typeof MONSTER_CATALOG)[MonsterKind]["bossRank"];

export function monsterKnockbackImmune(monsterKind: MonsterKind): boolean {
  const definition = MONSTER_CATALOG[monsterKind];
  return "knockbackImmune" in definition && definition.knockbackImmune === true;
}

export const MAP_CATALOG = {
  kerningCity: {
    name: "커닝시티",
    kind: "town",
  },
  greenMushroomCave: {
    name: "초록버섯굴",
    kind: "hunting-ground",
  },
  shadowTrialDungeon: {
    name: "그림자 시험장",
    kind: "dungeon",
  },
  crystalAntNest: {
    name: "수정 개미굴",
    kind: "dungeon",
  },
  clockworkTower: {
    name: "시계태엽 탑",
    kind: "dungeon",
  },
  sunkenCoralTemple: {
    name: "가라앉은 산호 신전",
    kind: "dungeon",
  },
  emberMine: {
    name: "잿불 광산",
    kind: "dungeon",
  },
  moonlitArcaneLibrary: {
    name: "달빛 마도서고",
    kind: "dungeon",
  },
  infiniteDuelGround: {
    name: "무한의 결투장",
    kind: "dungeon",
  },
  patienceForest: {
    name: "인내의 숲",
    kind: "challenge",
  },
} as const;

export const NPC_CATALOG = {
  darkLord: {
    name: "다크로드",
    role: "job-advancement",
    spriteSheet: "shadowMentor",
  },
  streetHealer: {
    name: "도시 치료사",
    role: "recovery",
    spriteSheet: "streetHealer",
  },
  bookMerchant: {
    name: "서적상 레오",
    role: "shop",
    spriteSheet: "streetHealer",
  },
  dungeonScout: {
    name: "원정대장 세라",
    role: "dungeon-boss-quest",
    spriteSheet: "dungeonScout",
  },
  gameDeveloper: {
    name: "일용직 개발자 임상진",
    role: "developer-promo",
    spriteSheet: "gameDeveloper",
    channelUrl: "https://www.youtube.com/@limsangjin12",
  },
  dua: {
    name: "두아",
    role: "pet-adoption",
    spriteSheet: "duaPet",
  },
} as const;

export const ITEM_CATALOG = {
  mesoPouch: { name: "메소 주머니", kind: "currency" },
  recoveryBottle: { name: "회복 물약", kind: "consumable" },
  mushroomCap: { name: "초록버섯의 갓", kind: "material" },
  experienceBook: { name: "경험의 서", kind: "consumable" },
  revivalCharm: { name: "부활의 부적", kind: "automatic-consumable" },
  puppuccino: { name: "멍푸치노", kind: "pet-gift" },
  emberCore: { name: "잿불 핵", kind: "boss-material" },
  moonlitCodex: { name: "월식의 금서", kind: "boss-material" },
} as const;

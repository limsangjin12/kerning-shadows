import type {
  SpriteAnimationDefinition,
  SpriteManifest,
  SpriteSheetDefinition,
} from "./manifest-types";

const REQUIRED_SHEETS = [
  "player",
  "playerRogue",
  "playerAssassin",
  "playerHermit",
  "playerHokage",
  "hokageEffects",
  "hokageAllies",
  "throwingStars",
  "greenMushroom",
  "shadowSentinel",
  "abyssGolem",
  "plagueZombie",
  "moonWolf",
  "ancientTreant",
  "emberWarden",
  "eclipseArchivist",
  "onePunchMan",
  "dungeonScout",
  "shadowMentor",
  "streetHealer",
  "gameDeveloper",
  "combatEffects",
  "worldEffectsLoot",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number.`);
  }
}

function assertNumberArray(
  value: unknown,
  path: string,
  length: number,
): asserts value is number[] {
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error(`${path} must contain ${length} numbers.`);
  }
  value.forEach((number, index) => assertNumber(number, `${path}.${index}`));
}

function validateAnimation(
  value: unknown,
  path: string,
  frameCount: number,
): asserts value is SpriteAnimationDefinition {
  if (!isRecord(value) || !Array.isArray(value.frames) || value.frames.length === 0) {
    throw new Error(`${path} must contain at least one frame.`);
  }

  for (const frame of value.frames) {
    if (!Number.isInteger(frame) || frame < 0 || frame >= frameCount) {
      throw new Error(`${path} contains an out-of-range frame.`);
    }
  }

  assertNumber(value.frameDurationMs, `${path}.frameDurationMs`);
  assertNumber(value.repeat, `${path}.repeat`);
  if (value.frameDurationMs <= 0 || value.repeat < -1) {
    throw new Error(`${path} contains invalid timing values.`);
  }
}

function validateSheet(
  value: unknown,
  path: string,
  frameCount: number,
): asserts value is SpriteSheetDefinition {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object.`);
  }

  if (
    typeof value.image !== "string" ||
    !value.image.startsWith("core/") ||
    !value.image.endsWith(".webp")
  ) {
    throw new Error(`${path}.image must point to a core lossless WebP sprite sheet.`);
  }

  if (
    typeof value.sourceImage !== "string" ||
    !value.sourceImage.startsWith("source/") ||
    !value.sourceImage.endsWith(".png")
  ) {
    throw new Error(`${path}.sourceImage must point to a source sprite sheet.`);
  }

  if (!isRecord(value.origin)) {
    throw new Error(`${path}.origin must be an object.`);
  }
  assertNumber(value.origin.x, `${path}.origin.x`);
  assertNumber(value.origin.y, `${path}.origin.y`);

  if (!isRecord(value.frameOrigins)) {
    throw new Error(`${path}.frameOrigins must be an object.`);
  }

  for (const [frameKey, origin] of Object.entries(value.frameOrigins)) {
    const frame = Number(frameKey);
    if (!Number.isInteger(frame) || frame < 0 || frame >= frameCount) {
      throw new Error(`${path}.frameOrigins contains an out-of-range frame.`);
    }
    if (!isRecord(origin)) {
      throw new Error(`${path}.frameOrigins.${frameKey} must be an object.`);
    }
    assertNumber(origin.x, `${path}.frameOrigins.${frameKey}.x`);
    assertNumber(origin.y, `${path}.frameOrigins.${frameKey}.y`);
    if (origin.x < 0 || origin.x > 1) {
      throw new Error(`${path}.frameOrigins.${frameKey}.x must be normalized.`);
    }
    if (origin.y < 0 || origin.y > 1.5) {
      throw new Error(
        `${path}.frameOrigins.${frameKey}.y exceeds the supported pivot range.`,
      );
    }
  }

  if (Object.keys(value.frameOrigins).length !== frameCount) {
    throw new Error(`${path}.frameOrigins must define every frame.`);
  }

  if (!isRecord(value.animations) || Object.keys(value.animations).length === 0) {
    throw new Error(`${path}.animations must not be empty.`);
  }

  for (const [animationName, animation] of Object.entries(value.animations)) {
    validateAnimation(animation, `${path}.animations.${animationName}`, frameCount);
  }
}

function expandCompactMonsterSheet(
  value: unknown,
  path: string,
  frameCount: number,
): unknown {
  if (!isRecord(value) || !isRecord(value.compactMonster)) return value;
  const compact = value.compactMonster;
  const originXPermille = compact.x;
  const originYPixels = compact.y;
  const frameDurationMs = compact.ms;
  assertNumberArray(
    originXPermille,
    `${path}.compactMonster.x`,
    frameCount,
  );
  assertNumberArray(
    originYPixels,
    `${path}.compactMonster.y`,
    frameCount,
  );
  assertNumberArray(
    frameDurationMs,
    `${path}.compactMonster.ms`,
    4,
  );

  return {
    image: value.image,
    sourceImage: value.sourceImage,
    facing: "right",
    flipForLeft: true,
    origin: { x: 0.5, y: 1 },
    frameOrigins: Object.fromEntries(
      originXPermille.map((x, index) => [
        String(index),
        { x: x / 1_000, y: originYPixels[index]! / 128 },
      ]),
    ),
    animations: {
      idle: { frames: [0, 1, 2, 3], frameDurationMs: frameDurationMs[0], repeat: -1 },
      walk: { frames: [4, 5, 6, 7], frameDurationMs: frameDurationMs[1], repeat: -1 },
      hurt: { frames: [8, 9, 10, 11], frameDurationMs: frameDurationMs[2], repeat: 0 },
      defeat: { frames: [12, 13, 14, 15], frameDurationMs: frameDurationMs[3], repeat: 0 },
    },
  };
}

export function validateSpriteManifest(value: unknown): SpriteManifest {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    throw new Error("Unsupported sprite manifest schema.");
  }

  const defaults = value.sheetDefaults;
  if (!isRecord(defaults)) {
    throw new Error("sheetDefaults must be an object.");
  }

  const numericKeys = [
    "width",
    "height",
    "columns",
    "rows",
    "frameWidth",
    "frameHeight",
  ] as const;
  for (const key of numericKeys) {
    assertNumber(defaults[key], `sheetDefaults.${key}`);
  }

  if (
    defaults.width !== 512 ||
    defaults.height !== 512 ||
    defaults.columns !== 4 ||
    defaults.rows !== 4 ||
    defaults.frameWidth !== 128 ||
    defaults.frameHeight !== 128 ||
    defaults.indexOrder !== "row-major" ||
    defaults.filter !== "nearest" ||
    defaults.trimmed !== false ||
    defaults.rotated !== false
  ) {
    throw new Error("Sprite sheet defaults do not match the fixed P0 contract.");
  }

  if (!isRecord(value.sheets)) {
    throw new Error("sheets must be an object.");
  }

  const frameCount = defaults.columns * defaults.rows;
  for (const key of REQUIRED_SHEETS) {
    if (!(key in value.sheets)) {
      throw new Error(`Missing required sprite sheet: ${key}`);
    }
  }

  const normalizedSheets = Object.fromEntries(
    Object.entries(value.sheets).map(([sheetName, sheet]) => [
      sheetName,
      expandCompactMonsterSheet(sheet, `sheets.${sheetName}`, frameCount),
    ]),
  );
  for (const [sheetName, sheet] of Object.entries(normalizedSheets)) {
    validateSheet(sheet, `sheets.${sheetName}`, frameCount);
  }

  return { ...value, sheets: normalizedSheets } as unknown as SpriteManifest;
}

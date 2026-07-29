import type { SceneKey } from "../flow/game-flow";
import type { AudioSettings } from "../settings/local-settings";
import type { PlayerSkillLevels, PlayerStats } from "../data/catalog";
import type {
  ActiveSkillId,
  SkillHotkeyAliases,
} from "../skills/skill-rules";

function gameHost(): HTMLElement {
  const host = document.querySelector<HTMLElement>("#game");
  if (!host) {
    throw new Error("Missing #game host element.");
  }
  return host;
}

export function markActiveScene(scene: SceneKey): void {
  gameHost().dataset.activeScene = scene;
}

export function markAssetsReady(ready: boolean): void {
  gameHost().dataset.assetsReady = String(ready);
}

export function markActiveMap(mapId: string): void {
  gameHost().dataset.activeMap = mapId;
}

export function markClimbState(active: boolean, climbableId?: string): void {
  const host = gameHost();
  host.dataset.playerClimbing = String(active);
  host.dataset.playerClimbableId = climbableId ?? "none";
}

export function markPlayerState(
  job: string,
  level: number,
  hp: number,
  mp: number,
  stats?: PlayerStats,
  statPoints?: number,
  autoAllocateStats?: boolean,
  name?: string,
): void {
  const host = gameHost();
  host.dataset.playerJob = job;
  host.dataset.playerLevel = String(level);
  host.dataset.playerHp = String(hp);
  host.dataset.playerMp = String(mp);
  if (stats) {
    host.dataset.playerStats = JSON.stringify(stats);
  }
  if (statPoints !== undefined) {
    host.dataset.playerStatPoints = String(statPoints);
  }
  if (autoAllocateStats !== undefined) {
    host.dataset.autoAllocateStats = String(autoAllocateStats);
  }
  if (name !== undefined) {
    host.dataset.playerName = name;
  }
}

export function markProgressState(
  exp: number,
  mesos: number,
  inventory: Readonly<Record<string, number>>,
): void {
  const host = gameHost();
  host.dataset.playerExp = String(exp);
  host.dataset.playerMesos = String(mesos);
  host.dataset.playerInventory = JSON.stringify(inventory);
}

export function markSkillState(
  skillPoints: number,
  skillLevels: PlayerSkillLevels,
  skillHotbar?: readonly ActiveSkillId[],
  skillHotkeyAliases?: SkillHotkeyAliases,
): void {
  const host = gameHost();
  host.dataset.playerSkillPoints = String(skillPoints);
  host.dataset.playerSkillLevels = JSON.stringify(skillLevels);
  if (skillHotbar) {
    host.dataset.playerSkillHotbar = JSON.stringify(skillHotbar);
  }
  if (skillHotkeyAliases) {
    host.dataset.playerSkillHotkeyAliases = JSON.stringify(skillHotkeyAliases);
  }
}

export function markHokageState(
  nineTailsTransformationActive: boolean,
  sageAuraActive: boolean,
): void {
  const host = gameHost();
  host.dataset.nineTailsTransformation = String(nineTailsTransformationActive);
  host.dataset.sageAura = String(sageAuraActive);
}

export function markNineTailsDrainState(
  tickCount = 0,
  drainedMp = 0,
  remainingMp = 0,
): void {
  const host = gameHost();
  host.dataset.nineTailsDrainTicks = String(
    Math.max(0, Math.floor(tickCount)),
  );
  host.dataset.nineTailsLastDrainMp = String(
    Math.max(0, Math.floor(drainedMp)),
  );
  host.dataset.nineTailsLastDrainRemainingMp = String(
    Math.max(0, Math.floor(remainingMp)),
  );
}

export function markHokageCinematic(cinematic: string): void {
  gameHost().dataset.hokageCinematic = cinematic;
}

export function markEndingCreditsState(
  status = "none",
  closeReason = "none",
): void {
  const host = gameHost();
  host.dataset.endingCredits = status;
  host.dataset.endingCreditsCloseReason = closeReason;
}

export function markTeamAssaultHitCount(count: number): void {
  gameHost().dataset.teamAssaultHitCount = String(count);
}

export function markEquipmentState(
  equippedThrowingStar: string,
  projectileFrame?: number,
): void {
  const host = gameHost();
  host.dataset.equippedThrowingStar = equippedThrowingStar;
  if (projectileFrame !== undefined) {
    host.dataset.lastProjectileFrame = String(projectileFrame);
  }
}

export function markJobQuestState(
  id: string | null,
  defeated: number,
  required: number,
  status: string,
): void {
  const host = gameHost();
  host.dataset.jobQuestId = id ?? "none";
  host.dataset.jobQuestDefeated = String(defeated);
  host.dataset.jobQuestRequired = String(required);
  host.dataset.jobQuestStatus = status;
}

export function markDungeonBossQuestState(stage: string): void {
  gameHost().dataset.dungeonBossQuestStage = stage;
}

export function markBossState(
  kind = "none",
  rank = "none",
  hp = 0,
  maxHp = 0,
  status = "none",
  phase?: 1 | 2,
  knockbackImmune = false,
): void {
  const host = gameHost();
  host.dataset.bossKind = kind;
  host.dataset.bossRank = rank;
  host.dataset.bossHp = String(hp);
  host.dataset.bossMaxHp = String(maxHp);
  host.dataset.bossStatus = status;
  host.dataset.bossPhase = phase === undefined ? "none" : String(phase);
  host.dataset.bossKnockbackImmune = String(knockbackImmune);
}

export function markBossRangedAttack(
  kind = "none",
  skill = "none",
  status = "none",
): void {
  const host = gameHost();
  host.dataset.bossRangedKind = kind;
  host.dataset.bossRangedSkill = skill;
  host.dataset.bossRangedStatus = status;
}

export function markPlayerAppearance(sheetKey: string): void {
  gameHost().dataset.playerAppearance = sheetKey;
}

export function markPlayerMotion(
  animation = "none",
  frame: string | number = -1,
  timeScale = 1,
): void {
  const host = gameHost();
  host.dataset.playerAnimation = animation;
  host.dataset.playerAnimationFrame = String(frame);
  host.dataset.playerAnimationTimeScale = timeScale.toFixed(2);
}

export function markHudPaddingViolations(
  count: number,
  items: readonly string[] = [],
): void {
  const host = gameHost();
  host.dataset.hudPaddingViolations = String(Math.max(0, count));
  host.dataset.hudPaddingViolationItems = items.join(",");
}

export function markMiniMapState(
  visible: boolean,
  playerMarker: { x: number; y: number } | null,
  npcCount: number,
  portalCount: number,
): void {
  const host = gameHost();
  host.dataset.miniMapMarkersVisible = String(visible);
  host.dataset.miniMapPlayerMarker = playerMarker
    ? `${Math.round(playerMarker.x)},${Math.round(playerMarker.y)}`
    : "none";
  host.dataset.miniMapNpcCount = String(Math.max(0, npcCount));
  host.dataset.miniMapPortalCount = String(Math.max(0, portalCount));
}

export function markPortalEffectState(
  portalCount = 0,
  animatedObjectCount = 0,
): void {
  const host = gameHost();
  host.dataset.portalEffectCount = String(Math.max(0, portalCount));
  host.dataset.portalEffectAnimatedObjects = String(
    Math.max(0, animatedObjectCount),
  );
  host.dataset.portalEffectAnimated = String(
    portalCount > 0 && animatedObjectCount > 0,
  );
}

export function markAttackAfterimage(kind = "none", count = 0): void {
  const host = gameHost();
  host.dataset.attackAfterimageKind = kind;
  host.dataset.attackAfterimageCount = String(Math.max(0, count));
}

export function markPlayerAttackState(
  kind = "none",
  speedMultiplier = 1,
  attackCount = 0,
): void {
  const host = gameHost();
  host.dataset.lastPlayerAttackKind = kind;
  host.dataset.lastPlayerAttackSpeedMultiplier = speedMultiplier.toFixed(2);
  host.dataset.playerAttackCount = String(Math.max(0, Math.floor(attackCount)));
}

export function markSkillProjectileStyle(kind: string, motion: string): void {
  const host = gameHost();
  host.dataset.lastSkillProjectileKind = kind;
  host.dataset.lastSkillProjectileMotion = motion;
}

export function markSkillImpactStyle(style: string): void {
  gameHost().dataset.lastSkillImpactStyle = style;
}

export function markSkillSpectacleTier(kind: string, tier: number): void {
  const host = gameHost();
  host.dataset.lastSkillSpectacleKind = kind;
  host.dataset.lastSkillSpectacleTier = String(tier);
}

export interface RuntimeTelemetry {
  playerX: number;
  playerY: number;
  playerVelocityX: number;
  playerMaxVelocityX: number;
  playerNameplateX: number;
  playerNameplateY: number;
  playerNameplateVisible: boolean;
  petActive: boolean;
  petX: number;
  petY: number;
  petBehavior: string;
  petTargetLoot: boolean;
  cameraScrollY: number;
  mapObjects: number;
  mapColliders: number;
  mapTimers: number;
  projectiles: number;
  projectileStates: readonly {
    kind: string;
    activeAgeMs: number;
    lifetimeMs: number;
    x: number;
  }[];
  bossProjectiles: number;
  loot: number;
  lootPositions: readonly number[];
  pendingRewards: number;
  trackedEffects: number;
  cinematicObjects: number;
  fps: number;
}

export function markRuntimeTelemetry(telemetry: RuntimeTelemetry): void {
  const host = gameHost();
  host.dataset.playerX = String(Math.round(telemetry.playerX));
  host.dataset.playerY = String(Math.round(telemetry.playerY));
  host.dataset.playerVelocityX = String(Math.round(telemetry.playerVelocityX));
  host.dataset.playerMaxVelocityX = String(
    Math.round(telemetry.playerMaxVelocityX),
  );
  host.dataset.playerNameplateX = String(Math.round(telemetry.playerNameplateX));
  host.dataset.playerNameplateY = String(Math.round(telemetry.playerNameplateY));
  host.dataset.playerNameplateVisible = String(telemetry.playerNameplateVisible);
  host.dataset.petActive = String(telemetry.petActive);
  host.dataset.petX = String(Math.round(telemetry.petX));
  host.dataset.petY = String(Math.round(telemetry.petY));
  host.dataset.petBehavior = telemetry.petBehavior;
  host.dataset.petTargetLoot = String(telemetry.petTargetLoot);
  host.dataset.cameraScrollY = String(Math.round(telemetry.cameraScrollY));
  host.dataset.runtimeMapObjects = String(telemetry.mapObjects);
  host.dataset.runtimeMapColliders = String(telemetry.mapColliders);
  host.dataset.runtimeMapTimers = String(telemetry.mapTimers);
  host.dataset.runtimeProjectiles = String(telemetry.projectiles);
  host.dataset.runtimeProjectileStates = JSON.stringify(
    telemetry.projectileStates.map((projectile) => ({
      kind: projectile.kind,
      activeAgeMs: Math.round(projectile.activeAgeMs),
      lifetimeMs: Math.round(projectile.lifetimeMs),
      x: Math.round(projectile.x),
    })),
  );
  host.dataset.runtimeBossProjectiles = String(telemetry.bossProjectiles);
  host.dataset.runtimeLoot = String(telemetry.loot);
  host.dataset.runtimeLootPositions = JSON.stringify(
    telemetry.lootPositions.map((position) => Math.round(position)),
  );
  host.dataset.runtimePendingRewards = String(telemetry.pendingRewards);
  host.dataset.runtimeTrackedEffects = String(telemetry.trackedEffects);
  host.dataset.runtimeCinematicObjects = String(telemetry.cinematicObjects);
  host.dataset.runtimeFps = String(Math.round(telemetry.fps));
}

export function markMilestoneEffect(effect: string): void {
  gameHost().dataset.milestoneEffect = effect;
}

export function markMonstersAlive(count: number): void {
  gameHost().dataset.monstersAlive = String(count);
}

export function markCombatEvent(event: string): void {
  gameHost().dataset.lastCombatEvent = event;
}

export function markDamageNumber(amount: number, palette: string): void {
  const host = gameHost();
  host.dataset.lastDamageAmount = String(Math.max(0, Math.floor(amount)));
  host.dataset.lastDamagePalette = palette;
}

export function announceGameStatus(message: string): void {
  const status = document.querySelector<HTMLElement>("#game-status");
  if (status) status.textContent = message;
}

export function markAudioState(
  settings: AudioSettings,
  activeBgm: string,
  locked: boolean,
  playing: boolean,
): void {
  const host = gameHost();
  host.dataset.audioMuted = String(settings.muted);
  host.dataset.bgmVolume = String(settings.bgmVolume);
  host.dataset.sfxVolume = String(settings.sfxVolume);
  host.dataset.activeBgm = activeBgm;
  host.dataset.audioLocked = String(locked);
  host.dataset.bgmPlaying = String(playing);
}

export function markAudioEvent(key: string): void {
  gameHost().dataset.lastAudioEvent = key;
}

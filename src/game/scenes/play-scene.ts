import Phaser from "phaser";
import { gameAudio } from "../audio/game-audio";
import { bgmForBossPresence } from "../audio/bgm-rules";
import {
  AudioAssetKey,
  DeferredAudioAssetLoader,
  type BgmAssetKey,
} from "../assets/audio-assets";
import { animationKey } from "../assets/animation-registry";
import { CombatAssetKey } from "../assets/combat-assets";
import {
  mapHazardFrame,
  mapObjectFrame,
  mapPlatformVisualTopY,
  mapPortalEffectFrame,
  mapPortalGlowColor,
  type MapObjectTheme,
} from "../assets/map-assets";
import {
  ATTACK_DEFINITIONS,
  AttackKind,
  PLAYER_INVULNERABILITY,
  PROJECTILE_SPAWN_OFFSET_X,
  advanceProjectileActiveAgeMs,
  applyDamage,
  attackSpeedMultiplier,
  attackBlockReason,
  canTakeContactDamage,
  drainRecovery,
  meleeAttackRangePx,
  playerInvulnerabilityAlpha,
  resolveAttack,
  usesEquippedWeaponPower,
  type AttackKind as AttackKindType,
} from "../combat/combat-rules";
import {
  bossProjectileVelocities,
  onePunchManPhaseFor,
  resolvedMonsterHitDamage,
  type BossRangedAttackDefinition,
} from "../combat/boss-ranged-attack-rules";
import {
  DamagePalette,
  damagePaletteForMonsterHit,
  damagePaletteLabel,
  showDamageNumber,
} from "../combat/damage-number";
import {
  canHitMonsterFromUpperFloor,
  canHitMonsterWithForwardMelee,
  type CombatBounds,
} from "../combat/monster-combat-rules";
import {
  ITEM_CATALOG,
  MONSTER_CATALOG,
  monsterKnockbackImmune,
  playerJobLabel,
  type PlayerStat,
} from "../data/catalog";
import {
  ATTACK_AFTERIMAGE_DEFINITIONS,
  attackAfterimageDelayMs,
  attackAfterimageX,
} from "../effects/attack-afterimage-rules";
import {
  SkillProjectileMotion,
  projectilePulseScale,
  projectileVerticalVelocity,
  skillProjectilePresentation,
  type SkillProjectilePresentation,
} from "../effects/skill-projectile-rules";
import { skillSpectacleDefinition } from "../effects/skill-spectacle-rules";
import {
  MILESTONE_BANNER,
  MILESTONE_EFFECTS,
  PORTAL_TRANSITION_EFFECT,
  milestoneInputLocked,
  type MilestoneEffectKind,
} from "../effects/milestone-effects";
import {
  PORTAL_AMBIENT_EFFECT,
  portalAnimatedObjectCount,
} from "../effects/portal-ambient-rules";
import {
  HOKAGE_CINEMATICS,
  HokageCinematicKind,
  TEAM_ASSAULT_HIT_TIMELINE_MS,
  teamAssaultAttacker,
  type HokageCinematicKind as HokageCinematicKindType,
} from "../effects/hokage-cinematic-rules";
import { PatrolMonster } from "../entities/patrol-monster";
import {
  PLATFORM_DROP_IGNORE_MS,
  PLATFORM_DROP_VELOCITY,
  canDropThroughPlatform,
} from "../entities/platform-drop-rules";
import { PLAYER_SHEET_BY_JOB } from "../entities/player-appearance";
import { Player } from "../entities/player";
import { DuaPet } from "../entities/dua-pet";
import {
  centeredBodyOffsetX,
  centeredBodyOffsetY,
  groundedBodyOffsetY,
} from "../entities/sprite-layout";
import { assertTransition, SceneKey } from "../flow/game-flow";
import {
  THROWING_STAR_CATALOG,
  applyThrowingStarDamage,
  equipThrowingStar as equipThrowingStarItem,
  purchaseThrowingStar as purchaseThrowingStarItem,
  type PurchasableThrowingStarTier,
  type ThrowingStarTier,
} from "../equipment/throwing-star-rules";
import { GameAction, inputBindingsForSkillHotbar } from "../input/actions";
import { InputController } from "../input/input-controller";
import {
  RECOVERY_BOTTLE_ITEM_ID,
  useRecoveryBottle,
  type UsableInventoryItemId,
} from "../inventory/inventory-item-rules";
import {
  REVIVAL_CHARM_ITEM_ID,
  consumeRevivalCharm,
} from "../inventory/revival-charm-rules";
import {
  applyLootReward,
  nearestLootIndex,
  resolveMonsterLoot,
  type LootReward,
} from "../loot/loot-rules";
import {
  DUA_LOOT_PICKUP_DISTANCE,
  duaFollowTarget,
  nearestGroundedLootIndexForDua,
  registerDuaWithPuppuccino,
} from "../pets/pet-rules";
import {
  LOOT_PRESENTATION,
  lootDespawnAlpha,
  lootEffectTint,
  resolveLootLandingPresentation,
} from "../loot/loot-presentation";
import {
  MAP_DEFINITIONS,
  MapId,
  spawnPoint,
  type ClimbableDefinition,
  type HazardDefinition,
  type MapDefinition,
  type MonsterSpawnDefinition,
  type NpcDefinition,
  type PlatformDefinition,
  type PortalDefinition,
} from "../maps/map-definitions";
import {
  hazardMotionOffset,
  rectanglesOverlap,
} from "../maps/map-hazard-rules";
import { hasFullVitals, restoreVitals } from "../npcs/npc-rules";
import { localProfileStore, type LocalProfile } from "../profile/local-profile";
import {
  allocateStatPoint,
  autoAllocateStatPoints,
  awardExperience,
  canApplyRecoveryTick,
  recoveryIntervalMs,
  recoverCharacter,
} from "../progression/progression-rules";
import {
  DUNGEON_BOSS_QUEST,
  DungeonBossQuestStage,
  acceptDungeonBossQuest,
  claimDungeonBossQuest,
  recordDungeonBossDefeat,
} from "../quests/dungeon-boss-quest";
import { shouldShowEndingCredits } from "../ending/ending-credits-rules";
import {
  JobAdvancementQuestId,
  acceptJobAdvancementQuest,
  claimJobAdvancementQuest,
  jobAdvancementQuestState,
  recordJobAdvancementDefeat,
} from "../quests/job-advancement-quests";
import { claimPatienceForestReward } from "../quests/patience-forest-reward";
import {
  allocateSkillPoint,
  drainNineTailsTransformationMp,
  mobileSkillsForHotbar,
  NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS,
  normalizeSkillHotbar,
  SKILL_DEFINITIONS,
  SkillId,
  toggleNineTailsTransformation,
} from "../skills/skill-rules";
import {
  ShopItemId,
  purchaseShopItem,
  useExperienceBook,
} from "../shop/shop-rules";
import { PlayHud } from "../ui/play-hud";
import {
  HUD_CONTENT_BOUNDS,
  HUD_COLLAPSED_SAFE_PADDING,
  HUD_PANEL_BOUNDS,
  gameplayCameraBoundsHeight,
  hudFloatingPanelBounds,
  hudFloatingPanelLayout,
  hudPanelCenter,
  hudTextFitsPanel,
  miniMapProjection,
  projectMiniMapPoint,
  type MiniMapProjection,
} from "../ui/hud-layout-rules";
import {
  HUD_PANEL_TOGGLE_EVENT,
  resetHudWindowControls,
  type HudFloatingPanel,
} from "../ui/hud-window-controls";
import {
  createMobileGameControls,
  type MobileGameControlsHandle,
} from "../ui/mobile-game-controls";
import {
  hideOverlay,
  showDuaAdoptionOverlay,
  showDeveloperPromoOverlay,
  showDungeonBossQuestOverlay,
  showEndingCreditsOverlay,
  showJobAdvancementOverlay,
  showInventoryOverlay,
  showGameMenuOverlay,
  showSettingsOverlay,
  showShopOverlay,
  showSkillHotkeyOverlay,
  showSkillOverlay,
  showStatsOverlay,
  type OverlayHandle,
  type EndingCreditsCloseReason,
  type InventoryOverlayHandle,
  type ShopOverlayHandle,
  type SkillHotkeyOverlayHandle,
  type SkillOverlayHandle,
  type StatsOverlayHandle,
} from "../ui/screen-overlay";
import {
  announceGameStatus,
  markActiveMap,
  markActiveScene,
  markClimbState,
  markAttackAfterimage,
  markCombatEvent,
  markDamageNumber,
  markBossRangedAttack,
  markBossState,
  markDungeonBossQuestState,
  markEquipmentState,
  markHokageCinematic,
  markEndingCreditsState,
  markMilestoneEffect,
  markMiniMapState,
  markHokageState,
  markNineTailsDrainState,
  markHudPaddingViolations,
  markMonstersAlive,
  markJobQuestState,
  markPlayerAppearance,
  markPlayerAttackState,
  markPlayerMotion,
  markPlayerState,
  markPortalEffectState,
  markProgressState,
  markRuntimeTelemetry,
  markSkillState,
  markSkillImpactStyle,
  markSkillProjectileStyle,
  markSkillSpectacleTier,
  markTeamAssaultHitCount,
} from "../ui/screen-state";
import { UiAssetKey } from "../assets/ui-assets";
import {
  HUD_PANEL_ALPHA,
  PIXEL_FONT_FAMILY,
  UI_DEPTH,
  addHudSurface,
  addNineSlicePanel,
} from "../ui/ui-theme";

interface PortalView {
  definition: PortalDefinition;
  sprite: Phaser.GameObjects.Image;
}

interface NpcView {
  definition: NpcDefinition;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
}

interface PlatformView {
  definition: PlatformDefinition;
  object: Phaser.GameObjects.Rectangle;
}

interface HazardView {
  definition: HazardDefinition;
  object: Phaser.GameObjects.Image;
}

interface ProjectileView {
  sprite: Phaser.Physics.Arcade.Sprite;
  kind: AttackKindType;
  damage: number;
  critical: boolean;
  activeAgeMs: number;
  baseScale: number;
  presentation: SkillProjectilePresentation;
  lifetimeMs: number;
  nextTrailAtMs: number;
  remainingTargets: number;
  hitMonsterIds: Set<string>;
}

interface BossProjectileView {
  sprite: Phaser.Physics.Arcade.Sprite;
  definition: BossRangedAttackDefinition;
  activeAgeMs: number;
}

interface LootView {
  reward: LootReward;
  sprite: Phaser.Physics.Arcade.Sprite;
  colliders: Phaser.Physics.Arcade.Collider[];
  expiresAt: number;
  wasGrounded: boolean;
  previousVelocityY: number;
  landingEffectsShown: number;
}

const INTERACTION_DISTANCE = 105;
const LOOT_PICKUP_DISTANCE = 115;
const LOOT_LIFETIME_MS = 12_000;
const PROJECTILE_TRAIL_INTERVAL_MS = 45;
const PROJECTILE_TRAIL_LIFETIME_MS = 105;
const RUNTIME_TELEMETRY_INTERVAL_MS = 250;

function arcadeBodyBounds(body: Phaser.Physics.Arcade.Body): CombatBounds {
  return {
    left: body.left,
    right: body.right,
    top: body.top,
    bottom: body.bottom,
  };
}

export class PlayScene extends Phaser.Scene {
  private inputController?: InputController;
  private mobileControls?: MobileGameControlsHandle;
  private player?: Player;
  private profile?: LocalProfile;
  private readonly mapObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly mapColliders: Phaser.Physics.Arcade.Collider[] = [];
  private readonly mapTimers: Phaser.Time.TimerEvent[] = [];
  private readonly platformViews: PlatformView[] = [];
  private readonly climbables: ClimbableDefinition[] = [];
  private readonly hazardViews: HazardView[] = [];
  private playerDropThrough?: {
    definition: PlatformDefinition;
    expiresAt: number;
  };
  private readonly portalViews: PortalView[] = [];
  private readonly npcViews: NpcView[] = [];
  private readonly monsters: PatrolMonster[] = [];
  private readonly pendingMonsterRewards = new Set<PatrolMonster>();
  private readonly projectiles: ProjectileView[] = [];
  private readonly bossProjectiles: BossProjectileView[] = [];
  private readonly lootViews: LootView[] = [];
  private duaPet?: DuaPet;
  private duaPetTargetLoot?: LootView;
  private readonly playerTrackedEffects: Phaser.GameObjects.Sprite[] = [];
  private mapNameText?: Phaser.GameObjects.Text;
  private mapLevelText?: Phaser.GameObjects.Text;
  private miniMapTexts: Phaser.GameObjects.Text[] = [];
  private miniMapPanel?: Phaser.GameObjects.NineSlice;
  private miniMapCollapsed = false;
  private miniMapProjection?: MiniMapProjection;
  private miniMapTerrain?: Phaser.GameObjects.Graphics;
  private miniMapPlayerMarker?: Phaser.GameObjects.Arc;
  private miniMapNpcCount = 0;
  private miniMapPortalCount = 0;
  private miniMapHeaderObjects: Array<
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Text
    | Phaser.GameObjects.Arc
  > = [];
  private miniMapBodyObjects: Array<
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Text
    | Phaser.GameObjects.Graphics
  > = [];
  private playHud?: PlayHud;
  private interactionPanel?: Phaser.GameObjects.NineSlice;
  private interactionText?: Phaser.GameObjects.Text;
  private systemPanel?: Phaser.GameObjects.NineSlice;
  private systemText?: Phaser.GameObjects.Text;
  private systemTimer?: Phaser.Time.TimerEvent;
  private dialog?: OverlayHandle;
  private statsDialog?: StatsOverlayHandle;
  private skillDialog?: SkillOverlayHandle;
  private shopDialog?: ShopOverlayHandle;
  private inventoryDialog?: InventoryOverlayHandle;
  private menuDialog?: OverlayHandle;
  private settingsDialog?: OverlayHandle;
  private skillHotkeyDialog?: SkillHotkeyOverlayHandle;
  private endingCreditsDialog?: OverlayHandle;
  private dialogNpc?: NpcView;
  private dialogOpen = false;
  private attackSequence = 0;
  private attackGeneration = 0;
  private invulnerableUntil = 0;
  private invulnerabilityVisualStartedAt = Number.NEGATIVE_INFINITY;
  private playerInvulnerabilityFlashing = false;
  private lastRecoveryAt = 0;
  private lastDamagedAt = Number.NEGATIVE_INFINITY;
  private playerRespawning = false;
  private pendingBossRangedAttacks = 0;
  private portalTransitionActive = false;
  private milestoneInputLockActive = false;
  private nextRuntimeTelemetryAt = 0;
  private nineTailsTransformationActive = false;
  private nextNineTailsMpDrainAt = Number.POSITIVE_INFINITY;
  private nineTailsMpDrainTicks = 0;
  private mapEnteredAt = 0;
  private hazardRestartAllowedAt = 0;
  private sageAuraEffect?: Phaser.GameObjects.Sprite;
  private nineTailsAuraEffect?: Phaser.GameObjects.Sprite;
  private hokageCinematicActive?: HokageCinematicKindType;
  private hokageCinematicGeneration = 0;
  private readonly hokageCinematicObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly hokageCinematicTimers: Phaser.Time.TimerEvent[] = [];
  private deferredAudioLoader?: DeferredAudioAssetLoader;
  private desiredMapBgm?: BgmAssetKey;

  constructor() {
    super(SceneKey.Gameplay);
  }

  create(): void {
    const profile = localProfileStore().load();
    if (!profile) {
      assertTransition(SceneKey.Gameplay, SceneKey.CharacterCreate);
      this.scene.start(SceneKey.CharacterCreate);
      return;
    }

    markActiveScene(SceneKey.Gameplay);
    hideOverlay();
    this.cameras.main.setBackgroundColor("#091316");

    this.profile = profile;
    this.dialog?.destroy();
    this.statsDialog?.destroy();
    this.skillDialog?.destroy();
    this.shopDialog?.destroy();
    this.inventoryDialog?.destroy();
    this.menuDialog?.destroy();
    this.settingsDialog?.destroy();
    this.skillHotkeyDialog?.destroy();
    this.endingCreditsDialog?.destroy();
    this.mobileControls?.destroy();
    this.dialog = undefined;
    this.statsDialog = undefined;
    this.skillDialog = undefined;
    this.shopDialog = undefined;
    this.inventoryDialog = undefined;
    this.menuDialog = undefined;
    this.settingsDialog = undefined;
    this.skillHotkeyDialog = undefined;
    this.endingCreditsDialog = undefined;
    this.mobileControls = undefined;
    this.deferredAudioLoader?.destroy();
    this.deferredAudioLoader = new DeferredAudioAssetLoader(this);
    this.desiredMapBgm = undefined;
    this.duaPet = undefined;
    this.duaPetTargetLoot = undefined;
    this.dialogNpc = undefined;
    this.dialogOpen = false;
    this.attackSequence = 0;
    this.attackGeneration += 1;
    this.invulnerableUntil = 0;
    this.invulnerabilityVisualStartedAt = Number.NEGATIVE_INFINITY;
    this.playerInvulnerabilityFlashing = false;
    this.lastDamagedAt = Number.NEGATIVE_INFINITY;
    this.playerRespawning = false;
    this.pendingBossRangedAttacks = 0;
    this.portalTransitionActive = false;
    this.milestoneInputLockActive = false;
    this.nextRuntimeTelemetryAt = 0;
    this.nineTailsTransformationActive = false;
    this.nextNineTailsMpDrainAt = Number.POSITIVE_INFINITY;
    this.nineTailsMpDrainTicks = 0;
    this.finishHokageCinematic();
    markMilestoneEffect("none");
    markHokageCinematic("none");
    markEndingCreditsState();
    markTeamAssaultHitCount(0);
    markNineTailsDrainState();
    markBossRangedAttack();
    markAttackAfterimage();
    markPlayerAttackState();
    markPlayerMotion();
    markClimbState(false);
    this.lastRecoveryAt = this.time.now;
    this.createHud();
    resetHudWindowControls();
    this.miniMapCollapsed = false;
    for (const panel of ["miniMap", "quest", "controls"] as const) {
      this.game.canvas.setAttribute(`data-hud-${panel}-collapsed`, "false");
    }
    window.addEventListener(HUD_PANEL_TOGGLE_EVENT, this.handleHudPanelToggle);
    window.addEventListener("keydown", this.handleDialogEscape);

    this.player = new Player(
      this,
      0,
      0,
      this.profile.character.job,
      this.profile.character.name,
    );
    this.player.setCombatActionHandler((kind) => this.performAttack(kind));
    this.player.setTransformationToggleHandler(() =>
      this.toggleTransformation(),
    );
    this.player.setJumpHandler(() => gameAudio().playSfx(AudioAssetKey.Jump));
    this.player.setPlatformDropHandler(() => this.dropThroughCurrentPlatform());
    this.player.setCombatActionBlockedHandler(() => {
      this.showSystemMessage("현재 동작이 끝난 뒤 다시 공격하세요.");
      markCombatEvent("attack-blocked-action");
    });
    this.inputController = new InputController(
      this.game.canvas,
      inputBindingsForSkillHotbar(
        this.profile.skillHotbar,
        this.profile.skillHotkeyAliases,
      ),
    );
    this.mobileControls = createMobileGameControls(
      (action, pressed, source) => {
        if (pressed) {
          this.inputController?.pressVirtual(action, source);
        } else {
          this.inputController?.releaseVirtual(action, source);
        }
      },
    );
    this.mobileControls.update(
      this.profile.character.job,
      this.profile.skillHotbar,
    );
    const initialMap = this.profile.location;
    const initialSpawn = Object.keys(
      MAP_DEFINITIONS[initialMap].spawnPoints,
    )[0];
    if (!initialSpawn) {
      throw new Error(`Map ${initialMap} does not define a spawn point.`);
    }
    this.enterMap(initialMap, initialSpawn);
    this.game.canvas.focus({ preventScroll: true });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.dialog?.destroy();
      this.statsDialog?.destroy();
      this.skillDialog?.destroy();
      this.shopDialog?.destroy();
      this.inventoryDialog?.destroy();
      this.menuDialog?.destroy();
      this.settingsDialog?.destroy();
      this.skillHotkeyDialog?.destroy();
      this.endingCreditsDialog?.destroy();
      this.systemTimer?.remove(false);
      this.mobileControls?.destroy();
      this.inputController?.destroy();
      this.desiredMapBgm = undefined;
      this.deferredAudioLoader?.destroy();
      this.deferredAudioLoader = undefined;
      window.removeEventListener(
        HUD_PANEL_TOGGLE_EVENT,
        this.handleHudPanelToggle,
      );
      window.removeEventListener("keydown", this.handleDialogEscape);
      this.clearMap();
    });
  }

  update(_time: number, delta: number): void {
    this.updateNineTailsTransformationMpDrain();
    this.updateNaturalRecovery();
    this.updatePlayerInvulnerabilityFlash();
    this.updatePlayerTrackedEffects();
    this.updateMiniMapPlayerMarker();
    this.updateRuntimeTelemetry();
    if (
      !this.player ||
      !this.inputController ||
      this.playerRespawning ||
      this.portalTransitionActive ||
      this.milestoneInputLockActive ||
      this.hokageCinematicActive !== undefined
    ) {
      return;
    }

    if (this.dialogOpen) {
      return;
    }

    if (this.inputController.consumePressed(GameAction.OpenMenu)) {
      if (this.player.isActionLocked() || this.hasBlockingCombat()) {
        this.showSystemMessage("공격이 끝난 뒤 전체 메뉴를 열어주세요.");
      } else {
        this.openGameMenuDialog();
      }
      return;
    }

    if (this.inputController.consumePressed(GameAction.OpenStats)) {
      if (this.player.isActionLocked() || this.hasBlockingCombat()) {
        this.showSystemMessage("공격이 끝난 뒤 능력치 창을 열어주세요.");
      } else {
        this.openStatsDialog();
      }
      return;
    }

    if (this.inputController.consumePressed(GameAction.OpenSkills)) {
      if (this.player.isActionLocked() || this.hasBlockingCombat()) {
        this.showSystemMessage("공격이 끝난 뒤 스킬 창을 열어주세요.");
      } else {
        this.openSkillDialog();
      }
      return;
    }

    if (this.inputController.consumePressed(GameAction.OpenInventory)) {
      if (this.player.isActionLocked() || this.hasBlockingCombat()) {
        this.showSystemMessage("공격이 끝난 뒤 인벤토리를 열어주세요.");
      } else {
        this.openInventoryDialog();
      }
      return;
    }

    this.updateLoot();
    this.updateDuaPet();
    this.updatePlayerClimbCandidate();
    this.player.updateFromInput(this.inputController);
    markClimbState(this.player.isClimbing(), this.player.activeClimbableId());
    this.updateHazards();
    const playerMotion = this.player.motionState();
    markPlayerMotion(
      playerMotion.animation,
      playerMotion.frame,
      playerMotion.timeScale,
    );
    for (const monster of this.monsters) {
      monster.updatePatrol(this.time.now);
      if (monster.isAlive() && this.physics.overlap(this.player, monster)) {
        this.handlePlayerContact(monster);
      }
    }
    this.updateBossRangedAttacks();
    this.updateProjectiles(delta);
    this.updateBossProjectiles(delta);
    if (this.player.isActionLocked() || this.hasBlockingCombat()) {
      this.hideInteractionMessage();
      this.mobileControls?.setInteractionAction("none");
      if (this.inputController.consumePressed(GameAction.Interact)) {
        this.showSystemMessage("공격이 끝난 뒤 이동하거나 대화하세요.");
        markCombatEvent("interaction-blocked-combat");
      }
      return;
    }
    this.updateInteraction();
  }

  private hasBlockingCombat(): boolean {
    return (
      this.projectiles.length > 0 ||
      this.bossProjectiles.length > 0 ||
      this.pendingBossRangedAttacks > 0 ||
      this.pendingMonsterRewards.size > 0
    );
  }

  private enterMap(mapId: MapId, spawnId: string): void {
    if (!this.player || !this.profile) {
      return;
    }

    this.clearMap();
    this.playerDropThrough = undefined;
    markActiveMap(mapId);
    const definition = MAP_DEFINITIONS[mapId];
    const spawn = spawnPoint(mapId, spawnId);
    const midBossDefeated =
      this.profile.dungeonBossQuest.stage !== DungeonBossQuestStage.Offer &&
      this.profile.dungeonBossQuest.stage !== DungeonBossQuestStage.MidBoss;
    const portals = definition.portals.filter(
      (portal) => !portal.requiresDungeonMidBossDefeat || midBossDefeated,
    );

    this.physics.world.setBounds(0, 0, definition.width, definition.height);
    this.cameras.main.setBounds(
      0,
      0,
      definition.width,
      gameplayCameraBoundsHeight(definition.height),
    );

    for (const layer of definition.backgroundLayers) {
      const background = this.add
        .image(0, 0, layer.key)
        .setOrigin(0)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(layer.depth);
      if (layer.sizing === "viewport") {
        background.setDisplaySize(1280, 720);
      } else {
        background.setDisplaySize(definition.width, definition.height);
      }
      this.mapObjects.push(background);
    }

    for (const platform of definition.platforms) {
      this.createPlatform(platform, definition.objectTheme);
    }
    for (const portal of portals) {
      this.createPortal(portal, definition.objectTheme);
    }
    markPortalEffectState(
      portals.length,
      portalAnimatedObjectCount(portals.length),
    );
    for (const npc of definition.npcs.filter(
      ({ id }) => id !== "dua" || !this.profile?.pets.dua.registered,
    )) {
      this.createNpc(npc);
    }
    for (const monster of definition.monsters) {
      const trialMonster: MonsterSpawnDefinition =
        mapId === MapId.ShadowTrialDungeon &&
        this.profile.activeJobAdvancementQuest?.id ===
          JobAdvancementQuestId.RogueTrial
          ? { ...monster, kind: "greenMushroom" }
          : monster;
      this.createMonster(trialMonster);
    }
    this.syncMapBgm(definition);
    this.climbables.push(...(definition.climbables ?? []));
    for (const climbable of definition.climbables ?? []) {
      this.createClimbableVisual(climbable, definition.objectTheme);
    }
    for (const hazard of definition.hazards ?? []) {
      this.createHazard(hazard);
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.cancelClimb();
    body.enable = true;
    body.reset(spawn.x, spawn.y);
    this.player.setAlpha(1).clearTint().setAcceleration(0, 0).setVelocity(0, 0);
    if (this.profile.pets.dua.registered) {
      this.createDuaPet(spawn.x - 72, spawn.y);
    }
    this.mapEnteredAt = this.time.now;
    this.hazardRestartAllowedAt = this.time.now + 700;
    this.syncPersistentHokageEffects();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(260, 120);
    this.cameras.main.fadeIn(PORTAL_TRANSITION_EFFECT.fadeInMs, 0, 0, 0);

    this.mapNameText?.setText(definition.name);
    this.mapLevelText?.setText(
      definition.recommendedLevelRange
        ? definition.recommendedLevelRange[0] ===
          definition.recommendedLevelRange[1]
          ? `추천 레벨 · Lv.${definition.recommendedLevelRange[0]}`
          : `추천 레벨 · Lv.${definition.recommendedLevelRange[0]}–${definition.recommendedLevelRange[1]}`
        : "현재 지역",
    );
    this.drawMiniMap(definition);
    this.hideInteractionMessage();
    this.persistRegion(definition);
    this.updateHud();
    this.updateMonsterMarker();
    this.updateBossHud();
  }

  private createPlatform(
    definition: PlatformDefinition,
    theme: MapObjectTheme,
  ): void {
    if (!this.player) {
      return;
    }
    const player = this.player;

    const platform = this.add.rectangle(
      definition.x,
      definition.y,
      definition.width,
      definition.height,
      0xffffff,
      0,
    );
    this.physics.add.existing(platform, true);
    this.mapObjects.push(platform);
    this.platformViews.push({ definition, object: platform });

    const visual = mapObjectFrame(theme, "platform");
    const visualHeight = definition.oneWay
      ? Math.max(42, Math.min(76, definition.width * 0.24))
      : 110;
    const collisionTopY = definition.y - definition.height / 2;
    const platformImage = this.add
      .image(
        definition.x,
        mapPlatformVisualTopY(theme, collisionTopY, visualHeight),
        visual.key,
        visual.frame,
      )
      .setOrigin(0.5, 0)
      .setDisplaySize(definition.width, visualHeight)
      .setDepth(-100);
    this.mapObjects.push(platformImage);

    const process = definition.oneWay
      ? (): boolean => this.canLandOnOneWay(player, definition)
      : undefined;
    this.mapColliders.push(
      this.physics.add.collider(player, platform, undefined, process, this),
    );
  }

  private createPortal(
    definition: PortalDefinition,
    theme: MapObjectTheme,
  ): void {
    const visual = mapObjectFrame(theme, "portal");
    const effectVisual = mapPortalEffectFrame();
    const glowColor = mapPortalGlowColor(theme);
    const floorGlow = this.add
      .ellipse(definition.x, definition.y - 2, 128, 24, glowColor, 0.42)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5);
    const floorCore = this.add
      .ellipse(definition.x, definition.y - 2, 76, 9, 0xffffff, 0.76)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5);
    this.tweens.add({
      targets: floorGlow,
      alpha: 0.68,
      scaleX: 1.16,
      duration: 860,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
    const verticalDefinition = PORTAL_AMBIENT_EFFECT.verticalEnergy;
    const verticalEnergy = this.add
      .image(
        definition.x,
        definition.y + verticalDefinition.offsetY,
        effectVisual.key,
        effectVisual.frame,
      )
      .setDisplaySize(verticalDefinition.width, verticalDefinition.height)
      .setAngle(verticalDefinition.angle)
      .setAlpha(verticalDefinition.alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);
    const verticalScaleX = verticalEnergy.scaleX;
    const verticalScaleY = verticalEnergy.scaleY;
    this.tweens.add({
      targets: verticalEnergy,
      alpha: 0.48,
      angle: verticalDefinition.angle + 4,
      scaleX: verticalScaleX * 1.08,
      scaleY: verticalScaleY * 0.94,
      duration: verticalDefinition.pulseMs,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
    const sigilDefinition = PORTAL_AMBIENT_EFFECT.groundSigil;
    const groundSigil = this.add
      .image(
        definition.x,
        definition.y + sigilDefinition.offsetY,
        effectVisual.key,
        effectVisual.frame,
      )
      .setDisplaySize(sigilDefinition.width, sigilDefinition.height)
      .setAlpha(sigilDefinition.alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);
    const sigilScaleX = groundSigil.scaleX;
    const sigilScaleY = groundSigil.scaleY;
    this.tweens.add({
      targets: groundSigil,
      alpha: 0.58,
      angle: 2,
      scaleX: sigilScaleX * 1.06,
      scaleY: sigilScaleY * 0.92,
      duration: sigilDefinition.pulseMs,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
    const echoDefinition = PORTAL_AMBIENT_EFFECT.groundEcho;
    const groundEcho = this.add
      .image(
        definition.x,
        definition.y + echoDefinition.offsetY,
        effectVisual.key,
        effectVisual.frame,
      )
      .setDisplaySize(echoDefinition.width, echoDefinition.height)
      .setTint(glowColor)
      .setAlpha(echoDefinition.alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(6);
    const echoScaleX = groundEcho.scaleX;
    const echoScaleY = groundEcho.scaleY;
    this.tweens.add({
      targets: groundEcho,
      alpha: 0.16,
      angle: -3,
      scaleX: echoScaleX * 1.18,
      scaleY: echoScaleY * 1.12,
      duration: echoDefinition.pulseMs,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
    const sprite = this.add
      .image(definition.x, definition.y, visual.key, visual.frame)
      .setOrigin(0.5, 1)
      .setDisplaySize(110, 126)
      .setDepth(7);
    const particles = PORTAL_AMBIENT_EFFECT.particles.map((particle, index) => {
      const mote = this.add
        .circle(
          definition.x + particle.offsetX,
          definition.y - 13,
          particle.radius,
          index % 3 === 0 ? 0xffffff : glowColor,
          0.94,
        )
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(8)
        .setScale(0.7);
      this.tweens.add({
        targets: mote,
        x: definition.x + particle.offsetX + particle.driftX,
        y: definition.y - particle.rise,
        alpha: 0,
        scale: 0.18,
        duration: particle.durationMs,
        delay: particle.delayMs,
        ease: "Sine.Out",
        repeat: -1,
      });
      return mote;
    });
    const label = this.add
      .text(definition.x, 0, definition.label, {
        color: "#d8ffff",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "14px",
        backgroundColor: "#081315aa",
        padding: { x: 7, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(8);
    label.setY(Math.floor(sprite.getBounds().top) - 8);
    this.portalViews.push({ definition, sprite });
    this.mapObjects.push(
      floorGlow,
      floorCore,
      verticalEnergy,
      groundSigil,
      groundEcho,
      sprite,
      ...particles,
      label,
    );
  }

  private createClimbableVisual(
    definition: ClimbableDefinition,
    theme: MapObjectTheme,
  ): void {
    const visual = mapObjectFrame(theme, "rope");
    const rope = this.add
      .image(definition.x, definition.top, visual.key, visual.frame)
      .setOrigin(0.5, 0)
      .setDisplaySize(
        Math.max(18, definition.width + 8),
        definition.bottom - definition.top,
      )
      .setDepth(-90);
    this.mapObjects.push(rope);
  }

  private createHazard(definition: HazardDefinition): void {
    const visual = mapHazardFrame(definition.kind);
    const object = this.add
      .image(definition.x, definition.y, visual.key, visual.frame)
      .setDisplaySize(definition.width, definition.height);
    object.setDepth(9);
    this.hazardViews.push({ definition, object });
    this.mapObjects.push(object);
  }

  private updatePlayerClimbCandidate(): void {
    if (!this.player) return;
    const candidate = this.climbables
      .filter(
        ({ x, top, bottom, width }) =>
          Math.abs(this.player!.x - x) <= Math.max(70, width / 2 + 28) &&
          this.player!.y >= top - 34 &&
          this.player!.y <= bottom + 34,
      )
      .sort(
        (left, right) =>
          Math.abs(this.player!.x - left.x) -
          Math.abs(this.player!.x - right.x),
      )[0];
    this.player.setClimbCandidate(candidate);
  }

  private updateHazards(): void {
    if (!this.player || this.time.now < this.hazardRestartAllowedAt) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    const playerBounds = {
      centerX: (body.left + body.right) / 2,
      centerY: (body.top + body.bottom) / 2,
      width: body.width,
      height: body.height,
    };
    for (const hazard of this.hazardViews) {
      const offset = hazardMotionOffset(
        this.time.now - this.mapEnteredAt,
        hazard.definition.motion,
      );
      const x =
        hazard.definition.x +
        (hazard.definition.motion.axis === "x" ? offset : 0);
      const y =
        hazard.definition.y +
        (hazard.definition.motion.axis === "y" ? offset : 0);
      hazard.object
        .setPosition(x, y)
        .setRotation((this.time.now / 420) % (Math.PI * 2));
      if (
        rectanglesOverlap(playerBounds, {
          centerX: x,
          centerY: y,
          width: hazard.definition.width,
          height: hazard.definition.height,
        })
      ) {
        this.restartPatienceForestCourse(hazard.definition.id);
        return;
      }
    }
  }

  private restartPatienceForestCourse(hazardId: string): void {
    if (
      !this.player ||
      !this.profile ||
      this.profile.location !== MapId.PatienceForest
    ) {
      return;
    }
    const spawn = spawnPoint(MapId.PatienceForest, "fromCave");
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.player.cancelClimb();
    body.allowGravity = true;
    body.reset(spawn.x, spawn.y);
    this.player.setAcceleration(0, 0).setVelocity(0, 0).clearTint().setAlpha(1);
    this.inputController?.resetState();
    this.hazardRestartAllowedAt = this.time.now + 900;
    this.cameras.main.flash(160, 116, 42, 58, true);
    this.showSystemMessage("장애물에 닿아 인내의 숲 입구로 돌아왔습니다.");
    markClimbState(false);
    markCombatEvent(`patience-hazard-restart:${hazardId}`);
  }

  private createNpc(definition: NpcDefinition): void {
    const sprite = this.add
      .sprite(definition.x, definition.y, definition.spriteSheet, 0)
      .setOrigin(0.5, 1)
      .setScale(definition.id === "dua" ? 0.62 : 1)
      .setDepth(8)
      .play(animationKey(definition.spriteSheet, "idle"));
    const label = this.add
      .text(definition.x, 0, definition.label, {
        color: "#f2d184",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "15px",
        backgroundColor: "#120c18bb",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(9);
    label.setY(Math.floor(sprite.getBounds().top) - 8);
    this.npcViews.push({ definition, sprite, label });
    this.mapObjects.push(sprite, label);
  }

  private createDuaPet(x: number, y: number, celebrate = false): void {
    if (this.duaPet?.active || !this.profile?.pets.dua.registered) return;
    const duaPet = new DuaPet(this, x, y);
    this.duaPet = duaPet;
    this.duaPetTargetLoot = undefined;
    this.mapObjects.push(duaPet);
    for (const platform of this.platformViews) {
      const process = platform.definition.oneWay
        ? (): boolean => this.canLandOnOneWay(duaPet, platform.definition)
        : undefined;
      this.mapColliders.push(
        this.physics.add.collider(
          duaPet,
          platform.object,
          undefined,
          process,
          this,
        ),
      );
    }
    if (celebrate) duaPet.playHappy();
  }

  private removeNpc(view: NpcView): void {
    const viewIndex = this.npcViews.indexOf(view);
    if (viewIndex >= 0) this.npcViews.splice(viewIndex, 1);
    for (const object of [view.sprite, view.label]) {
      const objectIndex = this.mapObjects.indexOf(object);
      if (objectIndex >= 0) this.mapObjects.splice(objectIndex, 1);
      this.tweens.killTweensOf(object);
      object.destroy();
    }
  }

  private createMonster(definition: MonsterSpawnDefinition): void {
    const monster = new PatrolMonster(this, definition.x, definition.y, {
      id: definition.id,
      kind: definition.kind,
      patrolMinX: definition.patrolMinX,
      patrolMaxX: definition.patrolMaxX,
      respawnMs: definition.respawnMs,
      onRespawn: () => {
        this.syncMapBgm();
        this.updateMonsterMarker();
        this.updateBossHud();
        markCombatEvent(`monster-respawned:${definition.id}`);
      },
    });
    this.monsters.push(monster);

    for (const platform of this.platformViews) {
      const process = platform.definition.oneWay
        ? (): boolean => this.canLandOnOneWay(monster, platform.definition)
        : undefined;
      this.mapColliders.push(
        this.physics.add.collider(
          monster,
          platform.object,
          undefined,
          process,
          this,
        ),
      );
    }
  }

  private canLandOnOneWay(
    subject: Phaser.Physics.Arcade.Sprite,
    definition: PlatformDefinition,
  ): boolean {
    const body = subject.body as Phaser.Physics.Arcade.Body | null;
    if (
      subject === this.player &&
      this.playerDropThrough?.definition === definition &&
      this.time.now <= this.playerDropThrough.expiresAt
    ) {
      return false;
    }
    const platformTop = definition.y - definition.height / 2;
    return Boolean(
      body && body.velocity.y >= 0 && body.bottom <= platformTop + 20,
    );
  }

  private dropThroughCurrentPlatform(): boolean {
    if (!this.player) {
      return false;
    }
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    if (!body) {
      return false;
    }

    const platform = this.platformViews.find(({ definition }) => {
      const platformTop = definition.y - definition.height / 2;
      return canDropThroughPlatform({
        bodyLeft: body.left,
        bodyRight: body.right,
        bodyBottom: body.bottom,
        platformLeft: definition.x - definition.width / 2,
        platformRight: definition.x + definition.width / 2,
        platformTop,
        oneWay: definition.oneWay,
      });
    });
    if (!platform) {
      return false;
    }

    this.playerDropThrough = {
      definition: platform.definition,
      expiresAt: this.time.now + PLATFORM_DROP_IGNORE_MS,
    };
    body.blocked.down = false;
    body.touching.down = false;
    this.player.setVelocityY(PLATFORM_DROP_VELOCITY);
    markCombatEvent("platform-drop-through");
    return true;
  }

  private performAttack(kind: AttackKindType): boolean {
    if (!this.player || !this.profile) {
      return false;
    }

    const blockReason = attackBlockReason(
      kind,
      this.profile.character,
      this.nineTailsTransformationActive,
    );
    if (blockReason === "job-required") {
      const definition = ATTACK_DEFINITIONS[kind];
      this.showSystemMessage(
        `${playerJobLabel(definition.requiredJob)} 전직 후 ${definition.label}을 사용할 수 있습니다.`,
      );
      markCombatEvent(`${kind}-blocked-job`);
      return false;
    }
    if (blockReason === "not-enough-mp") {
      this.showSystemMessage("MP가 부족합니다.");
      markCombatEvent(`${kind}-blocked-mp`);
      return false;
    }
    if (blockReason === "transformation-required") {
      this.showSystemMessage("구미호 변신 중에만 사용할 수 있습니다.");
      markCombatEvent(`${kind}-blocked-transformation`);
      return false;
    }

    const resolution = resolveAttack(
      kind,
      {
        ...this.profile.character,
        nineTailsTransformationActive: this.nineTailsTransformationActive,
      },
      this.attackSequence,
    );
    if (!resolution.ok) {
      return false;
    }
    this.profile.character.mp = resolution.remainingMp;
    if (this.nineTailsTransformationActive && this.profile.character.mp === 0) {
      this.deactivateNineTailsTransformation(
        "MP가 모두 소모되어 구미호 변신이 해제되었습니다.",
      );
    }
    localProfileStore().save(this.profile);
    this.updateHud();

    this.attackSequence += 1;
    markPlayerAttackState(
      kind,
      attackSpeedMultiplier(kind),
      this.attackSequence,
    );
    const attackGeneration = ++this.attackGeneration;
    this.createAttackMotionAfterimages(kind);
    this.createTieredSkillCastEffect(kind);
    if (kind === AttackKind.Rasengan) {
      this.startHokageCinematic(HokageCinematicKind.Rasengan);
    } else if (kind === AttackKind.TailedBeastBomb) {
      this.startHokageCinematic(HokageCinematicKind.TailedBeastBomb);
    } else if (kind === AttackKind.TeamAssault) {
      this.startHokageCinematic(HokageCinematicKind.TeamAssault);
    } else if (kind === AttackKind.ThunderOrb) {
      this.startHokageCinematic(HokageCinematicKind.ThunderOrb);
    }
    for (const [hitIndex, hit] of resolution.hits.entries()) {
      const launch = (): void => {
        if (
          this.player?.active &&
          !this.playerRespawning &&
          attackGeneration === this.attackGeneration
        ) {
          const damage = usesEquippedWeaponPower(kind)
            ? applyThrowingStarDamage(
                hit.damage,
                this.profile!.throwingStars.equipped,
              )
            : hit.damage;
          switch (ATTACK_DEFINITIONS[kind].delivery) {
            case "melee":
              this.resolveMeleeAttack(kind, damage, hit.critical);
              break;
            case "cinematic":
              this.resolveTeamAssaultHit(damage, hit.critical, hitIndex);
              break;
            case "projectile":
              this.launchProjectile(
                kind,
                damage,
                hit.critical,
                resolution.projectileLifetimeMs,
                hitIndex,
              );
              break;
          }
        }
      };
      const delayMs =
        kind === AttackKind.TeamAssault
          ? (TEAM_ASSAULT_HIT_TIMELINE_MS[hitIndex] ?? hit.delayMs)
          : hit.delayMs;
      if (delayMs === 0) {
        launch();
      } else {
        this.scheduleMapTimer(delayMs, launch);
      }
    }

    markCombatEvent(`${kind}-attack`);
    return true;
  }

  private resolveMeleeAttack(
    kind: AttackKindType,
    damage: number,
    critical: boolean,
  ): void {
    if (!this.player) return;
    const direction = this.player.facingDirection();
    const effectX = this.player.x + direction * 66;
    if (kind === AttackKind.Rasengan) {
      this.createHokageEffect(effectX, this.player.y - 52, "rasengan", 0.92, {
        flipX: direction < 0,
      });
    } else {
      this.createCombatEffect(
        effectX,
        this.player.y - 50,
        "playerHurtSpark",
        0.9,
        {
          tint: 0xff8b38,
        },
      );
    }
    const horizontalRange = meleeAttackRangePx(
      kind,
      this.profile?.character.skillLevels,
    );
    const target = this.monsters
      .filter((monster) => {
        const forwardDistance = (monster.x - this.player!.x) * direction;
        const standardMeleeHit =
          forwardDistance >= -18 &&
          forwardDistance <= horizontalRange &&
          Math.abs(monster.y - this.player!.y) <= 105;
        const upperFloorClawHit =
          kind === AttackKind.NineTailsClaw &&
          canHitMonsterWithForwardMelee(
            monster.monsterKind,
            this.player!.x,
            this.player!.y,
            direction,
            horizontalRange,
            arcadeBodyBounds(monster.body as Phaser.Physics.Arcade.Body),
          );
        return monster.isAlive() && (standardMeleeHit || upperFloorClawHit);
      })
      .sort(
        (left, right) =>
          Math.abs(left.x - this.player!.x) -
          Math.abs(right.x - this.player!.x),
      )[0];
    if (target) {
      this.applyAttackHit(kind, damage, critical, target);
    }
  }

  private toggleTransformation(): boolean {
    if (!this.profile || !this.player) return false;
    const result = toggleNineTailsTransformation(
      this.nineTailsTransformationActive,
      this.profile.character,
    );
    if (!result.ok) {
      this.showSystemMessage(
        result.reason === "not-enough-mp"
          ? "구미호 변신에 필요한 MP가 부족합니다."
          : "호카게 전직 후 사용할 수 있습니다.",
      );
      markCombatEvent(`nine-tails-toggle-blocked:${result.reason}`);
      return false;
    }
    this.nineTailsTransformationActive = result.active;
    this.profile.character.mp = result.remainingMp;
    this.player.setNineTailsTransformationActive(result.active);
    this.nextNineTailsMpDrainAt = result.active
      ? this.time.now + NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS
      : Number.POSITIVE_INFINITY;
    this.nineTailsMpDrainTicks = 0;
    markNineTailsDrainState(0, 0, result.remainingMp);
    this.syncPersistentHokageEffects();
    localProfileStore().save(this.profile);
    this.updateHud();
    this.showSystemMessage(
      result.active
        ? "구미호 변신 · 초당 최대 MP 1% · CTRL 할퀴기 2배속 · 이동속도 +20%"
        : "구미호 변신을 해제했습니다.",
    );
    if (result.active) {
      this.startHokageCinematic(HokageCinematicKind.NineTailsTransformation);
    }
    markCombatEvent(`nine-tails-toggle:${result.active ? "on" : "off"}`);
    return true;
  }

  private startHokageCinematic(kind: HokageCinematicKindType): void {
    this.finishHokageCinematic();
    const definition = HOKAGE_CINEMATICS[kind];
    const generation = ++this.hokageCinematicGeneration;
    this.hokageCinematicActive = kind;
    this.player?.stopForDialog();
    this.physics.world.pause();
    markHokageCinematic(kind);
    if (kind === HokageCinematicKind.TeamAssault) {
      markTeamAssaultHitCount(0);
    }

    const backdrop = this.add
      .sprite(640, 360, UiAssetKey.HokageCinematics, definition.frame)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 20)
      .setScale(2.12)
      .setAlpha(0);
    const colorWash = this.add
      .rectangle(640, 360, 1280, 720, definition.accent, 0.12)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 21)
      .setBlendMode(Phaser.BlendModes.ADD);
    const scanlines = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 22);
    scanlines.lineStyle(1, 0xd8f5ff, 0.075);
    for (let y = 2; y < 720; y += 6) {
      scanlines.lineBetween(0, y, 1280, y);
    }
    const topBar = this.add
      .rectangle(640, 28, 1280, 56, 0x030608, 0.94)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 23);
    const bottomBar = this.add
      .rectangle(640, 692, 1280, 56, 0x030608, 0.94)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 23);
    const frame = this.add
      .rectangle(640, 360, 1234, 626, 0x000000, 0)
      .setStrokeStyle(3, definition.accent, 0.8)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 24);
    const title = this.add
      .text(92, 584, definition.title, {
        color: "#fff6d0",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: kind === HokageCinematicKind.TeamAssault ? "48px" : "54px",
        stroke: "#071115",
        strokeThickness: 9,
      })
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 26)
      .setAlpha(0);
    const flash = this.add
      .rectangle(640, 360, 1280, 720, 0xffffff, 1)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 30)
      .setAlpha(0.86);
    this.hokageCinematicObjects.push(
      backdrop,
      colorWash,
      scanlines,
      topBar,
      bottomBar,
      frame,
      title,
      flash,
    );

    this.tweens.add({
      targets: backdrop,
      alpha: 0.92,
      scaleX: 2,
      scaleY: 2,
      duration: 260,
      ease: "Quad.Out",
    });
    this.tweens.add({
      targets: colorWash,
      alpha: { from: 0.04, to: 0.2 },
      yoyo: true,
      repeat: 2,
      duration: 180,
    });
    this.tweens.add({
      targets: title,
      x: 122,
      alpha: 1,
      duration: 240,
      ease: "Back.Out",
    });
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 170,
      ease: "Quad.Out",
    });
    this.cameras.main.shake(
      definition.shakeDurationMs,
      definition.shakeIntensity,
    );

    if (kind === HokageCinematicKind.TeamAssault) {
      this.createTeamAssaultAllies(generation);
    }
    this.scheduleHokageCinematicTimer(definition.durationMs - 210, () => {
      if (generation !== this.hokageCinematicGeneration) return;
      this.tweens.add({
        targets: this.hokageCinematicObjects,
        alpha: 0,
        duration: 190,
        ease: "Quad.In",
      });
    });
    this.scheduleHokageCinematicTimer(definition.durationMs, () => {
      if (generation === this.hokageCinematicGeneration) {
        this.finishHokageCinematic();
      }
    });
  }

  private createTeamAssaultAllies(generation: number): void {
    const shion = this.add
      .sprite(-120, 316, "hokageAllies", 0)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 27)
      .setScale(1.42)
      .play(animationKey("hokageAllies", "shionEnter"));
    const hana = this.add
      .sprite(1_400, 432, "hokageAllies", 8)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 27)
      .setScale(1.5)
      .setFlipX(true)
      .play(animationKey("hokageAllies", "hanaEnter"));
    this.hokageCinematicObjects.push(shion, hana);
    this.tweens.add({
      targets: shion,
      x: 400,
      y: 332,
      duration: 320,
      ease: "Cubic.Out",
    });
    this.tweens.add({
      targets: hana,
      x: 872,
      y: 418,
      duration: 330,
      ease: "Cubic.Out",
    });
    this.scheduleHokageCinematicTimer(390, () => {
      if (generation === this.hokageCinematicGeneration && shion.active) {
        shion.play(animationKey("hokageAllies", "shionThrow"), true);
      }
    });
    this.scheduleHokageCinematicTimer(760, () => {
      if (generation === this.hokageCinematicGeneration && hana.active) {
        hana.play(animationKey("hokageAllies", "hanaKick"), true);
      }
    });
    this.scheduleHokageCinematicTimer(960, () => {
      if (generation === this.hokageCinematicGeneration && hana.active) {
        hana.play(animationKey("hokageAllies", "hanaPunch"), true);
      }
    });
    this.scheduleHokageCinematicTimer(1_330, () => {
      if (generation !== this.hokageCinematicGeneration) return;
      shion.play(animationKey("hokageAllies", "shionExit"), true);
      hana.play(animationKey("hokageAllies", "hanaExit"), true);
      this.tweens.add({
        targets: shion,
        x: 1_420,
        y: 250,
        angle: 12,
        duration: 360,
        ease: "Cubic.In",
      });
      this.tweens.add({
        targets: hana,
        x: -140,
        y: 490,
        angle: -10,
        duration: 360,
        ease: "Cubic.In",
      });
    });
  }

  private resolveTeamAssaultHit(
    damage: number,
    critical: boolean,
    hitIndex: number,
  ): void {
    const target = this.monsters
      .filter((monster) => monster.isAlive())
      .sort((left, right) => {
        const originX = this.player?.x ?? 0;
        return Math.abs(left.x - originX) - Math.abs(right.x - originX);
      })[0];
    const attacker = teamAssaultAttacker(hitIndex);
    const tint =
      attacker === "shion"
        ? 0x65e8ff
        : attacker === "hanaKick"
          ? 0xffdc68
          : 0xff746b;
    const screenX = target ? target.x - this.cameras.main.scrollX : 640;
    const screenY = target ? target.y - this.cameras.main.scrollY - 48 : 360;
    this.createTeamAssaultImpact(
      screenX,
      screenY,
      tint,
      hitIndex + 1,
      attacker,
    );
    markTeamAssaultHitCount(hitIndex + 1);
    markCombatEvent(`team-assault-hit:${hitIndex + 1}:${attacker}`);
    if (target) {
      this.applyAttackHit(AttackKind.TeamAssault, damage, critical, target);
    }
  }

  private createTeamAssaultImpact(
    x: number,
    y: number,
    tint: number,
    hitCount: number,
    attacker: ReturnType<typeof teamAssaultAttacker>,
  ): void {
    const burst = this.add
      .circle(x, y, 18, tint, 0.32)
      .setStrokeStyle(5, 0xffffff, 0.92)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 29);
    const hitLabel = this.add
      .text(x + 28, y - 54, `${hitCount} HIT`, {
        color: attacker === "shion" ? "#bdf8ff" : "#fff0a8",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "25px",
        stroke: "#071115",
        strokeThickness: 6,
      })
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 29)
      .setOrigin(0.5);
    this.hokageCinematicObjects.push(burst, hitLabel);
    this.tweens.add({
      targets: burst,
      scale: 5.4,
      alpha: 0,
      duration: 230,
      ease: "Quad.Out",
    });
    this.tweens.add({
      targets: hitLabel,
      y: y - 88,
      alpha: 0,
      duration: 380,
      ease: "Cubic.Out",
    });
    this.cameras.main.shake(105, 0.012 + hitCount * 0.0015);
  }

  private scheduleHokageCinematicTimer(
    delayMs: number,
    callback: () => void,
  ): void {
    let timer!: Phaser.Time.TimerEvent;
    timer = this.time.delayedCall(delayMs, () => {
      const index = this.hokageCinematicTimers.indexOf(timer);
      if (index >= 0) this.hokageCinematicTimers.splice(index, 1);
      callback();
    });
    this.hokageCinematicTimers.push(timer);
  }

  private finishHokageCinematic(): void {
    const wasActive = this.hokageCinematicActive !== undefined;
    this.hokageCinematicGeneration += 1;
    for (const timer of this.hokageCinematicTimers.splice(0)) {
      timer.remove(false);
    }
    for (const object of this.hokageCinematicObjects.splice(0)) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.hokageCinematicActive = undefined;
    if (wasActive) {
      this.physics.world.resume();
      this.cameras.main.resetFX();
    }
    markHokageCinematic("none");
  }

  private launchProjectile(
    kind: AttackKindType,
    damage: number,
    critical: boolean,
    lifetimeMs: number,
    hitIndex: number,
  ): void {
    if (!this.player) {
      return;
    }
    const direction = this.player.facingDirection();
    gameAudio().playSfx(AudioAssetKey.Throw);
    const chakraProjectile =
      kind === AttackKind.TailedBeastBomb || kind === AttackKind.ThunderOrb;
    const sheetKey = chakraProjectile ? "hokageEffects" : "throwingStars";
    const animation = chakraProjectile
      ? "tailedBeastBombProjectile"
      : (this.profile?.throwingStars.equipped ?? "tier1");
    const presentation = skillProjectilePresentation(kind, hitIndex);
    const equippedStar = this.profile
      ? THROWING_STAR_CATALOG[this.profile.throwingStars.equipped]
      : undefined;
    const baseScale =
      ATTACK_DEFINITIONS[kind].projectileScale *
      (chakraProjectile ? 1 : (equippedStar?.projectileScaleMultiplier ?? 1));
    const projectile = this.physics.add
      .sprite(
        this.player.x + direction * PROJECTILE_SPAWN_OFFSET_X,
        this.player.y - 42 + presentation.spawnOffsetY,
        sheetKey,
        0,
      )
      .setDepth(14)
      .setScale(baseScale)
      .setFlipX(direction < 0)
      .play(animationKey(sheetKey, animation));
    if (
      kind === AttackKind.ThunderOrb ||
      kind === AttackKind.ShadowVolley ||
      kind === AttackKind.Drain ||
      kind === AttackKind.PhantomStars
    ) {
      projectile.setTint(
        presentation.trailTints[hitIndex % presentation.trailTints.length] ??
          this.attackTint(kind),
      );
    }
    if (!chakraProjectile && this.profile?.throwingStars.equipped === "tier6") {
      projectile.setTint(0xc8f7ff);
    }
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    const bodySize = chakraProjectile ? 62 : 48;
    const bodyHeight = chakraProjectile ? 62 : 34;
    body
      .setSize(bodySize, bodyHeight)
      .setVelocity(
        direction * ATTACK_DEFINITIONS[kind].projectileSpeed,
        presentation.initialVelocityY,
      );
    this.syncAnimatedBody(projectile, body, bodySize, bodyHeight, "centered");
    this.projectiles.push({
      sprite: projectile,
      kind,
      damage,
      critical,
      activeAgeMs: 0,
      baseScale,
      presentation,
      lifetimeMs,
      nextTrailAtMs: PROJECTILE_TRAIL_INTERVAL_MS,
      remainingTargets: ATTACK_DEFINITIONS[kind].maxTargets,
      hitMonsterIds: new Set<string>(),
    });
    markSkillProjectileStyle(kind, presentation.motion);
    if (!chakraProjectile && this.profile) {
      markEquipmentState(
        this.profile.throwingStars.equipped,
        THROWING_STAR_CATALOG[this.profile.throwingStars.equipped]
          .projectileFrame,
      );
    }
  }

  private updateBossRangedAttacks(): void {
    if (!this.player) return;
    for (const monster of this.monsters) {
      const definition = monster.tryStartRangedAttack(
        this.time.now,
        this.player.x,
        this.player.y - 44,
      );
      if (!definition) continue;

      this.pendingBossRangedAttacks += 1;
      markBossRangedAttack(monster.monsterKind, definition.id, "windup");
      markCombatEvent(`boss-ranged-windup:${definition.id}`);
      this.scheduleMapTimer(definition.windupMs, () => {
        this.pendingBossRangedAttacks = Math.max(
          0,
          this.pendingBossRangedAttacks - 1,
        );
        this.launchBossProjectile(monster, definition);
      });
    }
  }

  private launchBossProjectile(
    monster: PatrolMonster,
    definition: BossRangedAttackDefinition,
  ): void {
    if (
      !this.player ||
      !monster.active ||
      !monster.isAlive() ||
      this.playerRespawning
    ) {
      return;
    }
    const direction = this.player.x < monster.x ? -1 : 1;
    const spawnX = monster.x + direction * definition.spawnOffsetX;
    const spawnY = monster.y - definition.spawnOffsetY;
    const velocities = bossProjectileVelocities(
      this.player.x - spawnX,
      this.player.y - 44 - spawnY,
      definition.projectileSpeed,
      definition.projectileCount,
      definition.projectileSpreadDegrees,
    );
    for (const velocity of velocities) {
      const punchShockwave = definition.projectileVisual === "punchShockwave";
      const projectile = this.physics.add
        .sprite(
          spawnX,
          spawnY,
          punchShockwave ? CombatAssetKey.OnePunchShockwave : "combatEffects",
          0,
        )
        .setDepth(16)
        .setScale(definition.projectileScale)
        .setTint(definition.projectileTint);
      if (punchShockwave) {
        projectile
          .setRotation(Math.atan2(velocity.y, velocity.x))
          .setBlendMode(Phaser.BlendModes.ADD);
      } else {
        projectile
          .setFlipX(velocity.x < 0)
          .play(animationKey("combatEffects", "throwingStar"));
      }
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      const bodyWidth = punchShockwave ? 142 : 46;
      const bodyHeight = punchShockwave ? 50 : 42;
      body.allowGravity = false;
      body.setSize(bodyWidth, bodyHeight).setVelocity(velocity.x, velocity.y);
      this.syncAnimatedBody(
        projectile,
        body,
        bodyWidth,
        bodyHeight,
        "centered",
      );
      this.bossProjectiles.push({
        sprite: projectile,
        definition,
        activeAgeMs: 0,
      });
    }
    markBossRangedAttack(monster.monsterKind, definition.id, "launched");
    markCombatEvent(`boss-ranged-launched:${definition.id}`);
  }

  private updateBossProjectiles(deltaMs: number): void {
    if (!this.player) return;
    for (const projectile of this.bossProjectiles) {
      if (!projectile.sprite.active) continue;
      projectile.activeAgeMs = advanceProjectileActiveAgeMs(
        projectile.activeAgeMs,
        deltaMs,
        true,
      );
      if (
        projectile.activeAgeMs >= projectile.definition.projectileLifetimeMs
      ) {
        projectile.sprite.destroy();
        markBossRangedAttack(
          projectile.definition.monsterKind,
          projectile.definition.id,
          "expired",
        );
        continue;
      }
      if (!this.physics.overlap(projectile.sprite, this.player)) continue;

      const sourceX = projectile.sprite.x;
      projectile.sprite.destroy();
      const damaged = this.applyPlayerDamage(
        projectile.definition.damage,
        sourceX,
        projectile.definition.instantDefeatOnHit
          ? `boss-ranged-hit:${projectile.definition.id}:instant-defeat`
          : `boss-ranged-hit:${projectile.definition.id}:${projectile.definition.damage}`,
        projectile.definition.impactTint,
        projectile.definition.instantDefeatOnHit,
      );
      markBossRangedAttack(
        projectile.definition.monsterKind,
        projectile.definition.id,
        damaged ? "hit" : "blocked",
      );
    }
    for (let index = this.bossProjectiles.length - 1; index >= 0; index -= 1) {
      if (!this.bossProjectiles[index]?.sprite.active) {
        this.bossProjectiles.splice(index, 1);
      }
    }
  }

  private updateProjectiles(deltaMs: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.sprite.active) {
        continue;
      }
      projectile.activeAgeMs = advanceProjectileActiveAgeMs(
        projectile.activeAgeMs,
        deltaMs,
        true,
      );
      if (projectile.activeAgeMs >= projectile.lifetimeMs) {
        projectile.sprite.destroy();
        continue;
      }
      const elapsedMs = projectile.activeAgeMs;
      const body = projectile.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocityY(
        projectileVerticalVelocity(projectile.presentation, elapsedMs),
      );
      projectile.sprite.setScale(
        projectile.baseScale *
          projectilePulseScale(projectile.presentation, elapsedMs),
      );
      if (elapsedMs >= projectile.nextTrailAtMs) {
        this.createProjectileTrail(projectile);
        projectile.nextTrailAtMs = elapsedMs + PROJECTILE_TRAIL_INTERVAL_MS;
      }
      const monster = this.monsters.find((candidate) => {
        if (
          !candidate.isAlive() ||
          projectile.hitMonsterIds.has(candidate.monsterId)
        ) {
          return false;
        }
        if (this.physics.overlap(projectile.sprite, candidate)) return true;

        return canHitMonsterFromUpperFloor(
          candidate.monsterKind,
          arcadeBodyBounds(
            projectile.sprite.body as Phaser.Physics.Arcade.Body,
          ),
          arcadeBodyBounds(candidate.body as Phaser.Physics.Arcade.Body),
        );
      });
      if (monster) {
        this.resolveProjectileHit(projectile, monster);
      }
    }

    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      if (!this.projectiles[index]?.sprite.active) {
        this.projectiles.splice(index, 1);
      }
    }
  }

  private createProjectileTrail(projectile: ProjectileView): void {
    const source = projectile.sprite;
    const tintIndex = Math.floor(
      projectile.activeAgeMs / PROJECTILE_TRAIL_INTERVAL_MS,
    );
    const trailTint =
      projectile.presentation.trailTints[
        tintIndex % projectile.presentation.trailTints.length
      ] ??
      this.attackTint(projectile.kind) ??
      0xb8ecff;
    const trail = this.add
      .image(source.x, source.y, source.texture.key, source.frame.name)
      .setDepth(13)
      .setScale(source.scaleX * 0.72, source.scaleY * 0.72)
      .setFlipX(source.flipX)
      .setAlpha(
        projectile.presentation.motion === SkillProjectileMotion.SiphonPulse
          ? 0.5
          : projectile.kind === AttackKind.Basic
            ? 0.24
            : 0.34,
      )
      .setTint(trailTint);
    this.mapObjects.push(trail);
    this.scheduleMapTimer(PROJECTILE_TRAIL_LIFETIME_MS, () => {
      trail.destroy();
      const index = this.mapObjects.indexOf(trail);
      if (index >= 0) {
        this.mapObjects.splice(index, 1);
      }
    });
  }

  private createAttackMotionAfterimages(kind: AttackKindType): void {
    if (!this.player) return;
    const definition = ATTACK_AFTERIMAGE_DEFINITIONS[kind];
    markAttackAfterimage(kind, definition.count);

    for (let index = 0; index < definition.count; index += 1) {
      this.scheduleMapTimer(attackAfterimageDelayMs(definition, index), () => {
        const source = this.player;
        if (!source?.active) return;
        const direction = source.facingDirection();
        const ghost = this.add
          .image(
            attackAfterimageX(source.x, direction, definition, index),
            source.y,
            source.texture.key,
            source.frame.name,
          )
          .setOrigin(source.originX, source.originY)
          .setScale(source.scaleX, source.scaleY)
          .setFlipX(source.flipX)
          .setDepth(source.depth - 0.25)
          .setAlpha(definition.alpha * (1 - index / (definition.count * 2)))
          .setTint(definition.tint)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.mapObjects.push(ghost);
        this.tweens.add({
          targets: ghost,
          x: ghost.x - direction * definition.offsetPx * 0.6,
          alpha: 0,
          duration: definition.lifetimeMs,
          ease: "Cubic.Out",
          onComplete: () => {
            ghost.destroy();
            const objectIndex = this.mapObjects.indexOf(ghost);
            if (objectIndex >= 0) this.mapObjects.splice(objectIndex, 1);
          },
        });
      });
    }
  }

  private resolveProjectileHit(
    projectile: ProjectileView,
    monster: PatrolMonster,
  ): void {
    projectile.hitMonsterIds.add(monster.monsterId);
    projectile.remainingTargets -= 1;
    if (projectile.remainingTargets <= 0) {
      projectile.sprite.destroy();
    }
    if (projectile.kind === AttackKind.TailedBeastBomb) {
      this.createHokageEffect(
        monster.x,
        monster.y - 50,
        "tailedBeastBombExplosion",
        1.08,
      );
    } else if (projectile.kind === AttackKind.ThunderOrb) {
      this.createCombatEffect(
        monster.x,
        monster.y - 50,
        "jobAdvancementRing",
        0.82,
        { alpha: 0.92, tint: 0xffd45f },
      );
      this.scheduleMapTimer(55, () => {
        if (monster.active) {
          this.createCombatEffect(
            monster.x,
            monster.y - 50,
            "jobAdvancementRing",
            0.54,
            { alpha: 0.86, tint: 0x70efff },
          );
        }
      });
    }
    this.applyAttackHit(
      projectile.kind,
      projectile.damage,
      projectile.critical,
      monster,
    );
  }

  private applyAttackHit(
    kind: AttackKindType,
    damage: number,
    critical: boolean,
    monster: PatrolMonster,
  ): void {
    const result = monster.takeDamage(damage);
    if (!result.applied) {
      return;
    }
    this.updateBossHud();
    gameAudio().playSfx(AudioAssetKey.Hit);

    if (result.enteredBossPhase === 2) {
      this.showSystemMessage("원펀맨 2페이즈 · 진심 펀치 삼중 충격파");
      this.createCombatEffect(
        monster.x,
        monster.y - 108,
        "jobAdvancementRing",
        1.36,
        { alpha: 0.94, tint: 0xffc85f },
      );
      this.cameras.main.shake(180, 0.0055);
      markCombatEvent("one-punch-man-phase:2");
    }

    this.createDamageNumber(
      monster.x,
      Math.floor(monster.getBounds().top) - 18,
      result.resolvedDamage,
      damagePaletteForMonsterHit(critical, kind !== AttackKind.Basic),
    );
    if (ATTACK_DEFINITIONS[kind].family === "throwing-star") {
      this.createCombatEffect(
        monster.x,
        monster.y - 48,
        kind === AttackKind.Basic ? "playerHurtSpark" : "luckySevenHit",
        critical ? 0.94 : kind === AttackKind.Avenger ? 0.82 : 0.62,
        { tint: this.attackTint(kind) },
      );
    }
    if (critical) {
      this.createCombatEffect(
        monster.x,
        monster.y - 52,
        "jobAdvancementRing",
        0.58,
        { alpha: 0.9, tint: 0xffd56e },
      );
    }
    if (kind === AttackKind.Drain) {
      this.createDrainSiphonImpact(monster);
    } else if (kind === AttackKind.Avenger) {
      this.createCombatEffect(
        monster.x,
        monster.y - 52,
        "jobAdvancementRing",
        0.68,
        { alpha: 0.86, tint: 0xb86cff },
      );
      this.scheduleMapTimer(65, () => {
        if (monster.active) {
          this.createCombatEffect(
            monster.x,
            monster.y - 52,
            "jobAdvancementRing",
            0.44,
            { alpha: 0.82, tint: 0xffd56e },
          );
        }
      });
    } else if (kind === AttackKind.ShadowVolley) {
      this.createShadowVolleyImpact(monster);
    } else if (kind === AttackKind.PhantomStars) {
      this.createPhantomCrossImpact(monster);
    } else if (kind === AttackKind.AbyssRain) {
      this.createCombatEffect(
        monster.x,
        monster.y - 52,
        "jobAdvancementRing",
        0.62,
        { alpha: 0.82, tint: 0x8e6cff },
      );
    }
    this.createTieredSkillImpact(kind, monster);
    if (kind === AttackKind.Drain && this.profile) {
      const recovery = drainRecovery(
        kind,
        this.profile.character.hp,
        this.profile.character.maxHp,
        result.appliedDamage,
      );
      if (recovery.recovered > 0) {
        this.profile.character.hp = recovery.hp;
        localProfileStore().save(this.profile);
        this.updateHud();
        this.showSystemMessage(`드레인으로 HP ${recovery.recovered} 회복`);
      }
    }
    if (critical) {
      markCombatEvent(`critical-hit:${result.appliedDamage}`);
    }
    if (result.defeated && this.profile) {
      this.updateMonsterMarker();
      this.pendingMonsterRewards.add(monster);
      const defeatX = monster.x;
      const defeatY = monster.y;
      monster.onceDefeatAnimationComplete(() => {
        this.completeMonsterDefeat(monster, defeatX, defeatY);
      });
    } else if (!critical) {
      markCombatEvent(`monster-hit:${result.appliedDamage}`);
    }
  }

  private attackTint(kind: AttackKindType): number | undefined {
    if (kind === AttackKind.Drain) {
      return 0x8dffb2;
    }
    if (kind === AttackKind.Avenger) {
      return 0xd9a1ff;
    }
    if (kind === AttackKind.ShadowVolley) {
      return 0x70dcff;
    }
    if (kind === AttackKind.PhantomStars) {
      return 0xff79c8;
    }
    if (kind === AttackKind.AbyssRain) {
      return 0x8e6cff;
    }
    if (kind === AttackKind.LuckySeven) {
      return 0xb8ecff;
    }
    if (kind === AttackKind.TailedBeastBomb) {
      return 0xff6b48;
    }
    if (kind === AttackKind.ThunderOrb) {
      return 0xffd45f;
    }
    return undefined;
  }

  private createShadowVolleyImpact(monster: PatrolMonster): void {
    markSkillImpactStyle("fan-shards");
    for (const [index, angle] of [-38, 0, 38].entries()) {
      const shard = this.add
        .rectangle(
          monster.x,
          monster.y - 48,
          30,
          4,
          index === 1 ? 0xe3fbff : 0x70dcff,
        )
        .setDepth(22)
        .setAngle(angle)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.mapObjects.push(shard);
      this.tweens.add({
        targets: shard,
        x: monster.x + (index - 1) * 24,
        y: monster.y - 62 + Math.abs(index - 1) * 11,
        scaleX: 1.55,
        alpha: 0,
        duration: 165,
        ease: "Quad.Out",
        onComplete: () => this.destroyMapObject(shard),
      });
    }
  }

  private createPhantomCrossImpact(monster: PatrolMonster): void {
    markSkillImpactStyle("phantom-cross");
    for (const [angle, tint] of [
      [45, 0xff79c8],
      [-45, 0x70efff],
    ] as const) {
      const slash = this.add
        .rectangle(monster.x, monster.y - 50, 46, 6, tint, 0.92)
        .setDepth(22)
        .setAngle(angle)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.mapObjects.push(slash);
      this.tweens.add({
        targets: slash,
        scaleX: 1.65,
        scaleY: 0.45,
        alpha: 0,
        duration: 220,
        ease: "Cubic.Out",
        onComplete: () => this.destroyMapObject(slash),
      });
    }
  }

  private createDrainSiphonImpact(monster: PatrolMonster): void {
    markSkillImpactStyle("siphon-tether");
    if (!this.player?.active) return;
    const targetX = this.player.x;
    const targetY = this.player.y - 48;
    const sourceX = monster.x;
    const sourceY = monster.y - 48;
    const tether = this.add
      .graphics()
      .setDepth(21)
      .lineStyle(3, 0x69f2a4, 0.78)
      .lineBetween(sourceX, sourceY, targetX, targetY);
    this.mapObjects.push(tether);
    this.tweens.add({
      targets: tether,
      alpha: 0,
      duration: 260,
      ease: "Quad.In",
      onComplete: () => this.destroyMapObject(tether),
    });
    for (let index = 0; index < 3; index += 1) {
      const mote = this.add
        .circle(
          sourceX,
          sourceY + (index - 1) * 8,
          5 - index,
          index === 1 ? 0xe1ffe8 : 0x69f2a4,
          0.92,
        )
        .setDepth(22)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.mapObjects.push(mote);
      this.tweens.add({
        targets: mote,
        x: targetX,
        y: targetY,
        scale: 0.35,
        alpha: 0,
        delay: index * 45,
        duration: 260,
        ease: "Sine.InOut",
        onComplete: () => this.destroyMapObject(mote),
      });
    }
  }

  private createTieredSkillCastEffect(kind: AttackKindType): void {
    if (!this.player) return;
    const definition = skillSpectacleDefinition(kind);
    markSkillSpectacleTier(kind, definition.advancementTier);
    if (definition.castRingCount === 0) return;
    const tint = this.attackTint(kind) ?? 0xffd45f;
    for (let index = 0; index < definition.castRingCount; index += 1) {
      this.scheduleMapTimer(index * 48, () => {
        if (!this.player?.active) return;
        this.createCombatEffect(
          this.player.x,
          this.player.y - 50,
          "jobAdvancementRing",
          0.26 + definition.advancementTier * 0.045 + index * 0.13,
          { alpha: 0.52 + index * 0.1, tint },
        );
      });
    }
  }

  private createTieredSkillImpact(
    kind: AttackKindType,
    monster: PatrolMonster,
  ): void {
    const definition = skillSpectacleDefinition(kind);
    if (definition.impactRingCount === 0) return;
    const tint = this.attackTint(kind) ?? 0xffd45f;
    for (let index = 0; index < definition.impactRingCount; index += 1) {
      this.scheduleMapTimer(index * 38, () => {
        if (!monster.active) return;
        this.createCombatEffect(
          monster.x,
          monster.y - 50,
          "jobAdvancementRing",
          0.3 + index * 0.16 + definition.advancementTier * 0.035,
          { alpha: 0.48 + index * 0.1, tint },
        );
      });
    }
    for (let index = 0; index < definition.impactRayCount; index += 1) {
      const angle = (360 / definition.impactRayCount) * index;
      const radians = Phaser.Math.DegToRad(angle);
      const ray = this.add
        .rectangle(
          monster.x + Math.cos(radians) * 14,
          monster.y - 50 + Math.sin(radians) * 14,
          24 + definition.advancementTier * 4,
          definition.advancementTier,
          index % 2 === 0 ? tint : 0xffffff,
          0.78,
        )
        .setDepth(21)
        .setAngle(angle)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.mapObjects.push(ray);
      this.tweens.add({
        targets: ray,
        x:
          monster.x + Math.cos(radians) * (42 + definition.advancementTier * 5),
        y:
          monster.y -
          50 +
          Math.sin(radians) * (42 + definition.advancementTier * 5),
        scaleX: 1.45,
        alpha: 0,
        duration: 150 + definition.advancementTier * 22,
        ease: "Quad.Out",
        onComplete: () => this.destroyMapObject(ray),
      });
    }
    if (definition.shakeDurationMs > 0) {
      this.cameras.main.shake(
        definition.shakeDurationMs,
        definition.shakeIntensity,
      );
    }
  }

  private destroyMapObject(object: Phaser.GameObjects.GameObject): void {
    if (object.active) object.destroy();
    const index = this.mapObjects.indexOf(object);
    if (index >= 0) this.mapObjects.splice(index, 1);
  }

  private completeMonsterDefeat(
    monster: PatrolMonster,
    defeatX: number,
    defeatY: number,
  ): void {
    this.pendingMonsterRewards.delete(monster);
    if (!this.profile || !monster.active || !this.monsters.includes(monster)) {
      return;
    }

    const profile = this.profile;
    gameAudio().playSfx(AudioAssetKey.MonsterDefeat);
    const monsterDefinition = MONSTER_CATALOG[monster.monsterKind];
    this.spawnMonsterLoot(monster.monsterKind, defeatX, defeatY);
    const progression = awardExperience(
      profile.character,
      profile.exp,
      monsterDefinition.expReward,
    );
    profile.character = progression.character;
    profile.exp = progression.exp;
    profile.activeJobAdvancementQuest = recordJobAdvancementDefeat(
      profile.activeJobAdvancementQuest,
      monster.monsterKind,
    );
    const previousDungeonQuestStage = profile.dungeonBossQuest.stage;
    profile.dungeonBossQuest = recordDungeonBossDefeat(
      profile.dungeonBossQuest,
      monster.monsterKind,
    );
    const dungeonQuestAdvanced =
      profile.dungeonBossQuest.stage !== previousDungeonQuestStage;
    localProfileStore().save(profile);
    this.updateHud();
    this.updateBossHud();
    this.syncMapBgm();
    if (progression.levelsGained > 0) {
      const allocationMessage = progression.statsAutoAllocated
        ? `AP ${progression.statPointsGained} 자동분배 완료`
        : `AP +${progression.statPointsGained}`;
      this.showSystemMessage(
        `레벨 ${progression.character.level} 달성! ${allocationMessage} · SP +${progression.skillPointsGained} · HP/MP 완전 회복`,
      );
      this.playMilestoneEffect(
        "levelUp",
        "LEVEL UP",
        `LV. ${progression.character.level} · AP +${progression.statPointsGained} · SP +${progression.skillPointsGained}`,
      );
    } else if (dungeonQuestAdvanced) {
      const nextTarget =
        profile.dungeonBossQuest.stage === DungeonBossQuestStage.UpperBoss
          ? DUNGEON_BOSS_QUEST.upperBoss
          : profile.dungeonBossQuest.stage === DungeonBossQuestStage.FinalBoss
            ? DUNGEON_BOSS_QUEST.finalBoss
            : null;
      this.showSystemMessage(
        nextTarget
          ? `퀘스트 갱신 · ${nextTarget.name}를 추적하세요.`
          : "퀘스트 목표 완료 · 원정대장 세라에게 보고하세요.",
      );
    } else {
      this.showSystemMessage(
        `${monsterDefinition.name} 처치 · EXP +${monsterDefinition.expReward}`,
      );
    }
    markCombatEvent(`monster-defeated:${monster.monsterId}`);
    if (shouldShowEndingCredits(monster.monsterKind)) {
      this.openEndingCredits();
    }
  }

  private spawnMonsterLoot(
    monsterKind: keyof typeof MONSTER_CATALOG,
    x: number,
    y: number,
  ): void {
    const rewards = resolveMonsterLoot(monsterKind);
    rewards.forEach((reward, index) => {
      const horizontalOffset = (index - (rewards.length - 1) / 2) * 44;
      const sprite = this.physics.add
        .sprite(x + horizontalOffset, y - 24, "worldEffectsLoot", 0)
        .setOrigin(0.5, 1)
        .setScale(0.5)
        .setDepth(11)
        .play(animationKey("worldEffectsLoot", reward.spriteAnimation));
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setSize(48, 38);
      this.syncAnimatedBody(sprite, body, 48, 38, "grounded");
      body.setBounce(0.28, 0.28);
      body.setDragX(260);
      body.setMaxVelocity(180, 620);
      body.setCollideWorldBounds(true);
      body.setVelocity(horizontalOffset * 2.1, -190);

      const colliders = this.platformViews.map((platform) => {
        const process = platform.definition.oneWay
          ? (): boolean => this.canLandOnOneWay(sprite, platform.definition)
          : undefined;
        return this.physics.add.collider(
          sprite,
          platform.object,
          undefined,
          process,
          this,
        );
      });
      this.lootViews.push({
        reward,
        sprite,
        colliders,
        expiresAt: this.time.now + LOOT_LIFETIME_MS,
        wasGrounded: false,
        previousVelocityY: body.velocity.y,
        landingEffectsShown: 0,
      });
    });
  }

  private updateLoot(): void {
    for (const loot of [...this.lootViews]) {
      const remainingMs = loot.expiresAt - this.time.now;
      if (!loot.sprite.active || remainingMs <= 0) {
        this.removeLoot(loot);
        continue;
      }
      this.updateLootPresentation(loot, remainingMs);
    }

    if (
      !this.player ||
      !this.profile ||
      !this.inputController?.consumePressed(GameAction.Loot)
    ) {
      return;
    }
    const index = nearestLootIndex(
      this.player,
      this.lootViews.map((loot) => loot.sprite),
      LOOT_PICKUP_DISTANCE,
    );
    if (index === undefined) {
      return;
    }

    const loot = this.lootViews[index];
    if (loot) this.collectLoot(loot, "player");
  }

  private updateDuaPet(): void {
    if (
      !this.player ||
      !this.duaPet?.active ||
      !this.profile?.pets.dua.registered
    ) {
      this.duaPetTargetLoot = undefined;
      return;
    }

    const targetIndex = nearestGroundedLootIndexForDua(
      this.player,
      this.duaPet,
      this.lootViews.map((loot) => ({
        x: loot.sprite.x,
        y: loot.sprite.y,
        grounded: loot.wasGrounded && loot.sprite.active,
      })),
    );
    const targetLoot =
      targetIndex === undefined ? undefined : this.lootViews[targetIndex];
    this.duaPetTargetLoot = targetLoot;

    if (!targetLoot) {
      const playerBody = this.player.body as Phaser.Physics.Arcade.Body | null;
      this.duaPet.moveToward(
        duaFollowTarget(this.player, this.player.facingDirection()),
        false,
        playerBody?.velocity.x ?? 0,
      );
      return;
    }

    this.duaPet.moveToward(targetLoot.sprite, true);
    if (
      Phaser.Math.Distance.Between(
        this.duaPet.x,
        this.duaPet.y,
        targetLoot.sprite.x,
        targetLoot.sprite.y,
      ) <= DUA_LOOT_PICKUP_DISTANCE
    ) {
      this.collectLoot(targetLoot, "dua");
    }
  }

  private collectLoot(loot: LootView, collector: "player" | "dua"): void {
    if (!this.profile || !this.lootViews.includes(loot)) return;
    const target = collector === "dua" ? this.duaPet : this.player;
    if (!target?.active) return;

    this.detachLoot(loot);
    const collected = applyLootReward(
      {
        mesos: this.profile.character.mesos,
        inventory: this.profile.inventory,
      },
      loot.reward,
    );
    this.profile.character.mesos = collected.mesos;
    this.profile.inventory = collected.inventory;
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.LootPickup);
    this.updateHud();

    const rewardText =
      loot.reward.kind === "mesos"
        ? `${loot.reward.amount} 메소를 획득했습니다.`
        : `${ITEM_CATALOG[loot.reward.itemId].name} ${loot.reward.amount}개를 획득했습니다.`;
    const message =
      collector === "dua"
        ? `두아가 ${rewardText.replace("획득했습니다.", "주워왔습니다.")}`
        : rewardText;
    const acquisitionSummary =
      loot.reward.kind === "mesos"
        ? `${loot.reward.amount} 메소`
        : `${ITEM_CATALOG[loot.reward.itemId].name} × ${loot.reward.amount}`;
    this.playHud?.showAcquisition(acquisitionSummary);
    this.showSystemMessage(message);
    markCombatEvent(
      loot.reward.kind === "mesos"
        ? `${collector === "dua" ? "pet-" : ""}loot-collected:mesos:${loot.reward.amount}`
        : `${collector === "dua" ? "pet-" : ""}loot-collected:${loot.reward.itemId}:${loot.reward.amount}`,
    );
    if (collector === "dua") this.duaPet?.playPickup();
    this.animateLootPickup(loot, target, collector === "dua" ? 35 : 66);
  }

  private updateLootPresentation(loot: LootView, remainingMs: number): void {
    const body = loot.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) {
      return;
    }

    const isGrounded = body.blocked.down || body.touching.down;
    const presentation = resolveLootLandingPresentation({
      wasGrounded: loot.wasGrounded,
      isGrounded,
      previousVelocityY: loot.previousVelocityY,
      effectsShown: loot.landingEffectsShown,
    });
    if (presentation) {
      if (loot.landingEffectsShown === 0) {
        gameAudio().playSfx(AudioAssetKey.LootLand);
      }
      loot.landingEffectsShown += 1;
      this.createCombatEffect(
        loot.sprite.x,
        loot.sprite.y - 11,
        "playerHurtSpark",
        presentation.effectScale,
        {
          alpha: presentation.effectAlpha,
          tint: lootEffectTint(loot.reward.kind),
        },
      );
      loot.sprite.setTintFill(0xffffff);
      this.scheduleMapTimer(presentation.flashDurationMs, () => {
        if (loot.sprite.active) {
          loot.sprite.clearTint();
        }
      });
    }

    loot.wasGrounded = isGrounded;
    loot.previousVelocityY = body.velocity.y;
    loot.sprite.setAlpha(lootDespawnAlpha(remainingMs));
  }

  private animateLootPickup(
    loot: LootView,
    collector: Phaser.GameObjects.Sprite,
    targetOffsetY: number,
  ): void {
    if (!collector.active) {
      this.removeLoot(loot);
      return;
    }

    const sprite = loot.sprite;
    const tint = lootEffectTint(loot.reward.kind);
    const startX = sprite.x;
    const startY = sprite.y;
    const initialTargetX = collector.x;
    const initialTargetY = collector.y - targetOffsetY;
    const direction = initialTargetX < startX ? -1 : 1;

    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.stop();
      body.enable = false;
    }
    sprite.setAlpha(1).clearTint().setDepth(24);
    this.mapObjects.push(sprite);
    this.createCombatEffect(startX, startY - 10, "playerHurtSpark", 0.3, {
      alpha: 0.76,
      tint,
    });

    this.tweens.add({
      targets: sprite,
      x: (startX + initialTargetX) / 2,
      y: Math.min(startY, initialTargetY) - 28,
      angle: direction * 10,
      scaleX: 0.56,
      scaleY: 0.56,
      duration: LOOT_PRESENTATION.pickupRiseMs,
      ease: "Quad.Out",
      onComplete: () => {
        if (!sprite.active) {
          return;
        }
        const targetX = collector.active ? collector.x : initialTargetX;
        const targetY = collector.active
          ? collector.y - targetOffsetY
          : initialTargetY;
        this.tweens.add({
          targets: sprite,
          x: targetX,
          y: targetY,
          angle: 0,
          scaleX: 0.18,
          scaleY: 0.18,
          alpha: 0.7,
          duration: LOOT_PRESENTATION.pickupConvergeMs,
          ease: "Quad.In",
          onComplete: () => this.finishLootPickup(sprite, tint),
        });
      },
    });
  }

  private finishLootPickup(
    sprite: Phaser.Physics.Arcade.Sprite,
    tint: number,
  ): void {
    if (!sprite.active) {
      return;
    }
    const { x, y } = sprite;
    const mapObjectIndex = this.mapObjects.indexOf(sprite);
    if (mapObjectIndex >= 0) {
      this.mapObjects.splice(mapObjectIndex, 1);
    }
    sprite.destroy();
    this.createCombatEffect(x, y, "playerHurtSpark", 0.34, {
      alpha: 0.9,
      tint,
    });
  }

  private detachLoot(loot: LootView): void {
    for (const collider of loot.colliders) {
      collider.destroy();
    }
    const index = this.lootViews.indexOf(loot);
    if (index >= 0) {
      this.lootViews.splice(index, 1);
    }
  }

  private removeLoot(loot: LootView): void {
    this.detachLoot(loot);
    loot.sprite.destroy();
  }

  private handlePlayerContact(monster: PatrolMonster): void {
    const definition = MONSTER_CATALOG[monster.monsterKind];
    const damage = definition.touchDamage;
    const event = definition.instantDefeatOnHit
      ? `player-hurt:${monster.monsterKind}:instant-defeat`
      : `player-hurt:${damage}`;
    if (
      this.applyPlayerDamage(
        damage,
        monster.x,
        event,
        undefined,
        definition.instantDefeatOnHit,
      )
    ) {
      monster.playContactAttack();
    }
  }

  private applyPlayerDamage(
    damage: number,
    sourceX: number,
    combatEvent: string,
    effectTint?: number,
    instantDefeatOnHit = false,
  ): boolean {
    if (
      !this.player ||
      !this.profile ||
      !canTakeContactDamage(this.time.now, this.invulnerableUntil)
    ) {
      return false;
    }
    this.attackGeneration += 1;
    this.invulnerableUntil = this.time.now + PLAYER_INVULNERABILITY.durationMs;
    this.invulnerabilityVisualStartedAt = this.time.now;
    this.playerInvulnerabilityFlashing = true;
    this.lastDamagedAt = this.time.now;
    const previousHp = this.profile.character.hp;
    const resolvedDamage = resolvedMonsterHitDamage(
      previousHp,
      damage,
      instantDefeatOnHit,
    );
    this.profile.character.hp = applyDamage(previousHp, resolvedDamage);
    const appliedDamage = previousHp - this.profile.character.hp;
    const revival =
      this.profile.character.hp === 0
        ? consumeRevivalCharm({
            character: this.profile.character,
            inventory: this.profile.inventory,
          })
        : undefined;
    if (revival?.success) {
      this.profile.character = revival.state.character;
      this.profile.inventory = revival.state.inventory;
      this.lastRecoveryAt = this.time.now;
    }
    localProfileStore().save(this.profile);
    this.player.playHurt(sourceX);
    gameAudio().playSfx(AudioAssetKey.PlayerHurt);
    this.player.setAlpha(PLAYER_INVULNERABILITY.dimmedAlpha);
    this.createDamageNumber(
      this.player.x,
      this.player.y - 88,
      appliedDamage,
      DamagePalette.Player,
    );
    this.createCombatEffect(
      this.player.x,
      this.player.y - 45,
      "playerHurtSpark",
      0.7,
      {
        tint: effectTint,
      },
    );
    this.updateHud();
    markCombatEvent(combatEvent);

    if (revival?.success) {
      gameAudio().playSfx(AudioAssetKey.Recovery);
      this.createCombatEffect(
        this.player.x,
        this.player.y - 45,
        "jobAdvancementRing",
        0.88,
        { alpha: 0.96, tint: 0xffd86b },
      );
      this.showSystemMessage("부활의 부적이 빛나 HP와 MP를 모두 회복했습니다.");
      markCombatEvent(`player-revived:${REVIVAL_CHARM_ITEM_ID}`);
    } else if (this.profile.character.hp === 0) {
      this.beginPlayerRespawn();
    }
    return true;
  }

  private beginPlayerRespawn(): void {
    if (!this.profile) {
      return;
    }
    this.inputController?.resetState();
    this.playerRespawning = true;
    this.showSystemMessage("기운을 잃었습니다. 커닝시티에서 회복합니다.");
    this.scheduleMapTimer(720, () => {
      if (!this.profile) return;
      this.profile.character.hp = this.profile.character.maxHp;
      localProfileStore().save(this.profile);
      this.playerRespawning = false;
      this.inputController?.resetState();
      this.invulnerableUntil =
        this.time.now + PLAYER_INVULNERABILITY.durationMs;
      this.invulnerabilityVisualStartedAt = this.time.now;
      this.playerInvulnerabilityFlashing = true;
      this.enterMap(MapId.KerningCity, "initial");
      markCombatEvent("player-respawned");
    });
  }

  private createCombatEffect(
    x: number,
    y: number,
    animation: "luckySevenHit" | "playerHurtSpark" | "jobAdvancementRing",
    scale: number,
    options: { alpha?: number; tint?: number } = {},
  ): Phaser.GameObjects.Sprite {
    const effect = this.add
      .sprite(x, y, "combatEffects", 0)
      .setDepth(20)
      .setScale(scale)
      .setAlpha(options.alpha ?? 1)
      .play(animationKey("combatEffects", animation));
    if (options.tint !== undefined) {
      effect.setTint(options.tint);
    }
    this.mapObjects.push(effect);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      effect.destroy();
      const index = this.mapObjects.indexOf(effect);
      if (index >= 0) {
        this.mapObjects.splice(index, 1);
      }
    });
    return effect;
  }

  private createHokageEffect(
    x: number,
    y: number,
    animation: "rasengan" | "tailedBeastBombExplosion",
    scale: number,
    options: { alpha?: number; flipX?: boolean } = {},
  ): Phaser.GameObjects.Sprite {
    const effect = this.add
      .sprite(x, y, "hokageEffects", 0)
      .setDepth(20)
      .setScale(scale)
      .setAlpha(options.alpha ?? 1)
      .setFlipX(options.flipX ?? false)
      .play(animationKey("hokageEffects", animation));
    this.mapObjects.push(effect);
    effect.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      effect.destroy();
      const index = this.mapObjects.indexOf(effect);
      if (index >= 0) this.mapObjects.splice(index, 1);
    });
    return effect;
  }

  private syncPersistentHokageEffects(): void {
    if (!this.player || !this.profile) return;
    const sageActive = this.profile.character.skillLevels[SkillId.SageMode] > 0;
    if (sageActive && !this.sageAuraEffect?.active) {
      this.sageAuraEffect = this.createTrackedHokageAura(
        "sageAura",
        0.88,
        0.78,
      );
    } else if (!sageActive && this.sageAuraEffect) {
      this.removeTrackedHokageEffect(this.sageAuraEffect);
      this.sageAuraEffect = undefined;
    }

    if (
      this.nineTailsTransformationActive &&
      !this.nineTailsAuraEffect?.active
    ) {
      this.nineTailsAuraEffect = this.createTrackedHokageAura(
        "nineTailsAura",
        1.12,
        0.9,
      );
    } else if (
      !this.nineTailsTransformationActive &&
      this.nineTailsAuraEffect
    ) {
      this.removeTrackedHokageEffect(this.nineTailsAuraEffect);
      this.nineTailsAuraEffect = undefined;
    }
  }

  private createTrackedHokageAura(
    animation: "nineTailsAura" | "sageAura",
    scale: number,
    alpha: number,
  ): Phaser.GameObjects.Sprite {
    const effect = this.add
      .sprite(this.player!.x, this.player!.y - 54, "hokageEffects", 0)
      .setDepth(9)
      .setScale(scale)
      .setAlpha(alpha)
      .play(animationKey("hokageEffects", animation));
    this.mapObjects.push(effect);
    this.playerTrackedEffects.push(effect);
    return effect;
  }

  private removeTrackedHokageEffect(effect: Phaser.GameObjects.Sprite): void {
    effect.destroy();
    const trackedIndex = this.playerTrackedEffects.indexOf(effect);
    if (trackedIndex >= 0) this.playerTrackedEffects.splice(trackedIndex, 1);
    const mapIndex = this.mapObjects.indexOf(effect);
    if (mapIndex >= 0) this.mapObjects.splice(mapIndex, 1);
  }

  private createPlayerMilestoneRing(scale: number, tint: number): void {
    if (!this.player) {
      return;
    }
    const ring = this.createCombatEffect(
      this.player.x,
      this.player.y - 54,
      "jobAdvancementRing",
      scale,
      { alpha: 0.96, tint },
    );
    ring.setScale(scale * 0.58).setAlpha(0.2);
    this.playerTrackedEffects.push(ring);
    this.tweens.add({
      targets: ring,
      scaleX: scale,
      scaleY: scale,
      alpha: 0.96,
      duration: 150,
      ease: "Quad.Out",
    });
  }

  private updatePlayerTrackedEffects(): void {
    for (
      let index = this.playerTrackedEffects.length - 1;
      index >= 0;
      index -= 1
    ) {
      const effect = this.playerTrackedEffects[index];
      if (!effect?.active) {
        this.playerTrackedEffects.splice(index, 1);
        continue;
      }
      if (this.player?.active) {
        effect.setPosition(this.player.x, this.player.y - 54);
      }
    }
  }

  private playMilestoneEffect(
    kind: MilestoneEffectKind,
    title: string,
    detail: string,
  ): void {
    if (!this.player) {
      return;
    }

    const definition = MILESTONE_EFFECTS[kind];
    const inputLocked = milestoneInputLocked(kind, 0);
    this.milestoneInputLockActive = inputLocked;
    gameAudio().playSfx(
      kind === "jobAdvancement"
        ? AudioAssetKey.JobAdvancement
        : AudioAssetKey.LevelUp,
    );
    if (inputLocked) {
      this.player.setAcceleration(0, 0).setVelocityX(0);
      this.inputController?.resetState();
    }
    markMilestoneEffect(`${kind}:start`);

    const flash = definition.flashColor;
    this.cameras.main.flash(
      definition.flashDurationMs,
      flash.red,
      flash.green,
      flash.blue,
      true,
    );
    if (definition.cameraShakeDurationMs > 0) {
      this.cameras.main.shake(
        definition.cameraShakeDurationMs,
        definition.cameraShakeIntensity,
        true,
      );
    }
    definition.ringDelaysMs.forEach((delayMs, index) => {
      this.scheduleMapTimer(delayMs, () => {
        const scale = definition.ringScales[index];
        const tint = definition.ringTints[index];
        if (scale !== undefined && tint !== undefined) {
          this.createPlayerMilestoneRing(scale, tint);
        }
      });
    });
    if (definition.burstCount > 0) {
      this.createMilestoneBurst(
        definition.burstCount,
        definition.burstRadius,
        definition.burstDurationMs,
        definition.burstTints,
      );
    }
    this.createMilestoneBanner(title, detail, definition.bannerColor);

    this.scheduleMapTimer(definition.effectDurationMs, () => {
      this.milestoneInputLockActive = false;
      if (inputLocked) {
        this.inputController?.resetState();
      }
      markMilestoneEffect(`${kind}:complete`);
      if (!this.dialogOpen) {
        this.game.canvas.focus({ preventScroll: true });
      }
    });
  }

  private createMilestoneBurst(
    count: number,
    radius: number,
    durationMs: number,
    tints: readonly number[],
  ): void {
    if (!this.player || count <= 0 || durationMs <= 0 || tints.length === 0) {
      return;
    }
    const centerX = this.player.x;
    const centerY = this.player.y - 54;
    for (let index = 0; index < count; index += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
      const distance = radius * (0.72 + (index % 3) * 0.14);
      const spark = this.add
        .image(centerX, centerY, "combatEffects", 9)
        .setDepth(19)
        .setScale(0.18 + (index % 2) * 0.05)
        .setAlpha(0)
        .setTint(tints[index % tints.length] ?? 0xfff3a1)
        .setAngle((angle * 180) / Math.PI + 90);
      this.mapObjects.push(spark);
      this.tweens.add({
        targets: spark,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        scaleX: 0.52,
        scaleY: 0.52,
        alpha: { from: 0.95, to: 0 },
        delay: index * 18,
        duration: durationMs,
        ease: "Cubic.Out",
        onComplete: () => {
          const objectIndex = this.mapObjects.indexOf(spark);
          if (objectIndex >= 0) {
            this.mapObjects.splice(objectIndex, 1);
          }
          spark.destroy();
        },
      });
    }
  }

  private createMilestoneBanner(
    title: string,
    detail: string,
    detailColor: string,
  ): void {
    const panel = addNineSlicePanel(this, "hud", 0, 0, 420, 82, 0);
    const titleText = this.add
      .text(0, -17, title, {
        color: "#f5f2dd",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "14px",
        fontStyle: "bold",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    const detailText = this.add
      .text(0, 15, detail, {
        color: detailColor,
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "24px",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    const banner = this.add
      .container(640, 132, [panel, titleText, detailText])
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 12)
      .setAlpha(0)
      .setScale(0.92);
    this.mapObjects.push(banner);

    this.tweens.add({
      targets: banner,
      y: 162,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: MILESTONE_BANNER.enterMs,
      ease: "Back.Out",
      onComplete: () => {
        this.scheduleMapTimer(MILESTONE_BANNER.holdMs, () => {
          if (!banner.active) {
            return;
          }
          this.tweens.add({
            targets: banner,
            y: 142,
            alpha: 0,
            duration: MILESTONE_BANNER.exitMs,
            ease: "Quad.In",
            onComplete: () => {
              const index = this.mapObjects.indexOf(banner);
              if (index >= 0) {
                this.mapObjects.splice(index, 1);
              }
              banner.destroy();
            },
          });
        });
      },
    });
  }

  private createDamageNumber(
    x: number,
    y: number,
    amount: number,
    palette: DamagePalette,
  ): void {
    markDamageNumber(amount, damagePaletteLabel(palette));
    const sprites = showDamageNumber(this, x, y, amount, palette, (sprite) => {
      const index = this.mapObjects.indexOf(sprite);
      if (index >= 0) {
        this.mapObjects.splice(index, 1);
      }
    });
    this.mapObjects.push(...sprites);
  }

  private syncAnimatedBody(
    sprite: Phaser.Physics.Arcade.Sprite,
    body: Phaser.Physics.Arcade.Body,
    bodyWidth: number,
    bodyHeight: number,
    alignment: "centered" | "grounded",
  ): void {
    const sync = (): void => {
      body.setOffset(
        centeredBodyOffsetX(sprite.displayOriginX, bodyWidth),
        alignment === "grounded"
          ? groundedBodyOffsetY(sprite.displayOriginY, bodyHeight)
          : centeredBodyOffsetY(sprite.displayOriginY, bodyHeight),
      );
    };
    sprite.on(Phaser.Animations.Events.ANIMATION_START, sync);
    sprite.on(Phaser.Animations.Events.ANIMATION_UPDATE, sync);
    sync();
  }

  private updateInteraction(): void {
    if (!this.player || !this.inputController || !this.interactionText) {
      return;
    }

    this.mobileControls?.setInteractionAction("none");

    if (this.player.isClimbing()) {
      this.mobileControls?.setInteractionAction("climb");
      this.showInteractionMessage("↑/↓ 줄타기 · ←/→ 또는 Alt로 이탈");
      this.inputController.consumePressed(GameAction.Interact);
      return;
    }

    const portal = this.portalViews.find(
      (view) =>
        Phaser.Math.Distance.Between(
          this.player?.x ?? 0,
          this.player?.y ?? 0,
          view.sprite.x,
          view.sprite.y,
        ) <= INTERACTION_DISTANCE,
    );

    if (portal) {
      this.mobileControls?.setInteractionAction("portal");
      const accessible = this.canUsePortal(portal.definition);
      this.showInteractionMessage(
        accessible
          ? `↑ ${portal.definition.label} 이동`
          : `↑ ${portal.definition.label} · 시험 필요`,
      );
      if (this.inputController.consumePressed(GameAction.Interact)) {
        if (accessible) {
          this.beginPortalTransition(portal);
        } else {
          this.showSystemMessage("다크로드에게 전직 시험을 먼저 받으세요.");
          markCombatEvent(`portal-blocked:${portal.definition.id}`);
        }
      }
      return;
    }

    const npc = this.npcViews
      .map((view) => ({
        view,
        distance: Phaser.Math.Distance.Between(
          this.player?.x ?? 0,
          this.player?.y ?? 0,
          view.sprite.x,
          view.sprite.y,
        ),
      }))
      .filter(({ distance }) => distance <= INTERACTION_DISTANCE)
      .sort((left, right) => left.distance - right.distance)[0]?.view;
    if (npc) {
      this.mobileControls?.setInteractionAction("dialog");
      const interactionLabel =
        npc.definition.interaction === "fullRecovery"
          ? "HP/MP 회복"
          : npc.definition.interaction === "shop"
            ? "상점"
            : npc.definition.interaction === "bossQuest"
              ? "원정 퀘스트"
              : npc.definition.interaction === "developerPromo"
                ? "채널 안내"
                : npc.definition.interaction === "petAdoption"
                  ? "멍푸치노 선물"
                  : "대화";
      this.showInteractionMessage(
        `↑ ${npc.definition.label} · ${interactionLabel}`,
      );
      if (this.inputController.consumePressed(GameAction.Interact)) {
        if (npc.definition.interaction === "fullRecovery") {
          this.recoverAtNpc(npc);
        } else if (npc.definition.interaction === "shop") {
          this.openShopDialog();
        } else if (npc.definition.interaction === "bossQuest") {
          this.openDungeonBossQuestDialog(npc);
        } else if (npc.definition.interaction === "developerPromo") {
          this.openDeveloperPromoDialog(npc);
        } else if (npc.definition.interaction === "petAdoption") {
          this.openDuaAdoptionDialog(npc);
        } else {
          this.openJobDialog(npc);
        }
      }
      return;
    }

    if (this.player.canStartClimbing()) {
      this.mobileControls?.setInteractionAction("climb");
    }
    this.hideInteractionMessage();
    this.inputController.consumePressed(GameAction.Interact);
  }

  private beginPortalTransition(portal: PortalView): void {
    if (
      !this.player ||
      this.portalTransitionActive ||
      this.milestoneInputLockActive
    ) {
      return;
    }

    const destination = MAP_DEFINITIONS[portal.definition.targetMap];
    const rewardClaimed =
      portal.definition.id === "patience-forest-summit" &&
      this.claimPatienceForestSummitReward();
    const effect = PORTAL_TRANSITION_EFFECT;
    this.portalTransitionActive = true;
    gameAudio().playSfx(AudioAssetKey.Portal);
    this.player.setAcceleration(0, 0).setVelocity(0, 0);
    this.inputController?.resetState();
    this.hideInteractionMessage();
    markMilestoneEffect(`portal:${portal.definition.id}:source`);

    this.createPlayerMilestoneRing(effect.sourceRingScale, effect.ringTint);
    this.tweens.add({
      targets: portal.sprite,
      scaleX: 0.94,
      scaleY: 0.94,
      alpha: 0.72,
      duration: effect.exitDelayMs / 2,
      yoyo: true,
      ease: "Sine.InOut",
    });
    this.cameras.main.flash(
      100,
      effect.flashColor.red,
      effect.flashColor.green,
      effect.flashColor.blue,
      true,
    );

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        if (!this.player || !this.portalTransitionActive) {
          return;
        }
        this.enterMap(
          portal.definition.targetMap,
          portal.definition.targetSpawn,
        );
        this.createPlayerMilestoneRing(
          effect.arrivalRingScale,
          effect.ringTint,
        );
        this.showSystemMessage(
          rewardClaimed
            ? "인내의 숲 완주! 1,000,000 메소와 초대형 고드름을 획득했습니다."
            : `${destination.name} 도착`,
        );
        markMilestoneEffect(`portal:${portal.definition.id}:arrival`);
        this.scheduleMapTimer(effect.arrivalLockMs, () => {
          this.portalTransitionActive = false;
          this.inputController?.resetState();
          markMilestoneEffect(`portal:${portal.definition.id}:complete`);
          this.game.canvas.focus({ preventScroll: true });
        });
      },
    );
    this.cameras.main.fadeOut(effect.exitDelayMs, 0, 0, 0);
  }

  private canUsePortal(portal: PortalDefinition): boolean {
    if (!portal.access) return true;
    const questId = this.profile?.activeJobAdvancementQuest?.id;
    return Boolean(questId && portal.access.questIds.includes(questId));
  }

  private claimPatienceForestSummitReward(): boolean {
    if (!this.profile) return false;
    const result = claimPatienceForestReward({
      mesos: this.profile.character.mesos,
      throwingStars: this.profile.throwingStars,
    });
    if (!result.claimed) return false;
    this.profile.character.mesos = result.state.mesos;
    this.profile.throwingStars = result.state.throwingStars;
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.LevelUp);
    this.updateHud();
    markCombatEvent("patience-forest-reward-claimed");
    return true;
  }

  private recoverAtNpc(npc: NpcView): void {
    if (!this.profile) {
      return;
    }
    const alreadyFull = hasFullVitals(this.profile.character);
    this.profile.character = restoreVitals(this.profile.character);
    localProfileStore().save(this.profile);
    gameAudio().playSfx(
      alreadyFull ? AudioAssetKey.UiConfirm : AudioAssetKey.Recovery,
    );
    this.updateHud();

    npc.sprite.play(animationKey(npc.definition.spriteSheet, "cast"), true);
    npc.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (npc.sprite.active) {
        npc.sprite.play(animationKey(npc.definition.spriteSheet, "idle"), true);
      }
    });
    this.showSystemMessage(
      alreadyFull
        ? "HP와 MP가 이미 가득 차 있습니다."
        : "HP와 MP를 모두 회복했습니다.",
    );
    markCombatEvent(
      alreadyFull ? "recovery-npc-full" : "recovery-npc-restored",
    );
  }

  private readonly handleDialogEscape = (event: KeyboardEvent): void => {
    if (event.code !== "Escape" || event.repeat || !this.dialogOpen) {
      return;
    }
    event.preventDefault();
    if (this.menuDialog) {
      this.closeGameMenuDialog();
    } else if (this.settingsDialog) {
      this.closeSettingsDialog();
    } else if (this.skillHotkeyDialog) {
      this.closeSkillHotkeyDialog();
    } else if (this.statsDialog) {
      this.closeStatsDialog();
    } else if (this.skillDialog) {
      this.closeSkillDialog();
    } else if (this.inventoryDialog) {
      this.closeInventoryDialog();
    } else if (this.shopDialog) {
      this.closeShopDialog();
    } else if (this.endingCreditsDialog) {
      this.closeEndingCredits("continue");
    } else if (this.dialog) {
      this.closeGenericDialog();
    }
  };

  private openEndingCredits(): void {
    if (!this.player || this.dialogOpen || this.endingCreditsDialog) {
      return;
    }
    for (const projectile of this.bossProjectiles.splice(0)) {
      projectile.sprite.destroy();
    }
    markBossRangedAttack();
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    this.endingCreditsDialog = showEndingCreditsOverlay((reason) =>
      this.closeEndingCredits(reason),
    );
    markEndingCreditsState("playing");
    announceGameStatus(
      "원펀맨 처치 완료. 게임 크레딧이 재생됩니다. 닫은 뒤 계속 플레이할 수 있습니다.",
    );
    markCombatEvent("ending-credits-started");
  }

  private closeEndingCredits(reason: EndingCreditsCloseReason): void {
    if (!this.endingCreditsDialog) return;
    this.endingCreditsDialog.destroy();
    this.endingCreditsDialog = undefined;
    this.dialogOpen = false;
    this.inputController?.resetState();
    markEndingCreditsState("closed", reason);
    announceGameStatus("크레딧 종료. 게임 플레이를 계속합니다.");
    markCombatEvent(`ending-credits-closed:${reason}`);
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private openGameMenuDialog(): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    const openDestination = (open: () => void): void => {
      this.menuDialog?.destroy();
      this.menuDialog = undefined;
      this.dialogOpen = false;
      open();
    };
    this.menuDialog = showGameMenuOverlay(this.profile, {
      openSettings: () => openDestination(() => this.openSettingsDialog()),
      openStats: () => openDestination(() => this.openStatsDialog()),
      openSkills: () => openDestination(() => this.openSkillDialog()),
      openInventory: () => openDestination(() => this.openInventoryDialog()),
      openSkillHotkeys: () =>
        openDestination(() => this.openSkillHotkeyDialog()),
      close: () => this.closeGameMenuDialog(),
    });
    markCombatEvent("game-menu-opened");
  }

  private closeGameMenuDialog(): void {
    this.menuDialog?.destroy();
    this.menuDialog = undefined;
    this.finishClosingMenuDialog("game-menu-closed");
  }

  private openSettingsDialog(): void {
    if (!this.player || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    this.settingsDialog = showSettingsOverlay(() => this.closeSettingsDialog());
    markCombatEvent("settings-opened");
  }

  private closeSettingsDialog(): void {
    this.settingsDialog?.destroy();
    this.settingsDialog = undefined;
    this.finishClosingMenuDialog("settings-closed");
  }

  private openSkillHotkeyDialog(): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    const mobileSkills = mobileSkillsForHotbar(
      this.profile.character.job,
      this.profile.skillHotbar,
    );
    const hotkeyProfile =
      document.documentElement.dataset.inputMode === "touch"
        ? {
            ...this.profile,
            skillHotbar: [
              ...mobileSkills,
              ...this.profile.skillHotbar.filter(
                (skillId) => !mobileSkills.includes(skillId),
              ),
            ],
          }
        : this.profile;
    this.skillHotkeyDialog = showSkillHotkeyOverlay(
      hotkeyProfile,
      (skillHotbar, skillHotkeyAliases) => {
        if (!this.profile) return;
        this.profile.skillHotbar = normalizeSkillHotbar(skillHotbar);
        this.profile.skillHotkeyAliases = skillHotkeyAliases;
        this.inputController?.setBindings(
          inputBindingsForSkillHotbar(
            this.profile.skillHotbar,
            this.profile.skillHotkeyAliases,
          ),
        );
        this.persistSkillChange("skill-hotbar-reordered");
      },
      () => this.closeSkillHotkeyDialog(),
    );
    markCombatEvent("skill-hotkeys-opened");
  }

  private closeSkillHotkeyDialog(): void {
    this.skillHotkeyDialog?.destroy();
    this.skillHotkeyDialog = undefined;
    this.finishClosingMenuDialog("skill-hotkeys-closed");
  }

  private finishClosingMenuDialog(combatEvent: string): void {
    this.dialogOpen = false;
    this.inputController?.resetState();
    markCombatEvent(combatEvent);
    window.setTimeout(() => this.game.canvas.focus({ preventScroll: true }), 0);
  }

  private closeGenericDialog(): void {
    this.dialog?.destroy();
    this.dialog = undefined;
    this.dialogOpen = false;
    if (this.dialogNpc?.sprite.active) {
      this.dialogNpc.sprite.play(
        animationKey(this.dialogNpc.definition.spriteSheet, "idle"),
        true,
      );
    }
    this.dialogNpc = undefined;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private openStatsDialog(): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    this.statsDialog = showStatsOverlay(
      this.profile,
      (stat: PlayerStat) => {
        if (!this.profile) return;
        this.profile.character = allocateStatPoint(
          this.profile.character,
          stat,
        );
        this.persistStatsChange();
      },
      () => {
        if (!this.profile) return;
        this.profile.character = autoAllocateStatPoints(this.profile.character);
        this.persistStatsChange();
      },
      (enabled) => {
        if (!this.profile) return;
        this.profile.character = {
          ...this.profile.character,
          autoAllocateStats: enabled,
        };
        if (enabled) {
          this.profile.character = autoAllocateStatPoints(
            this.profile.character,
          );
        }
        this.persistStatsChange();
      },
      (tier) => this.equipThrowingStar(tier),
      () => this.closeStatsDialog(),
    );
  }

  private openShopDialog(): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    this.shopDialog = showShopOverlay(
      this.profile,
      () => this.purchaseExperienceBook(),
      () => this.consumeExperienceBook(),
      () => this.purchasePuppuccino(),
      () => this.purchaseRevivalCharm(),
      (tier) => this.purchaseThrowingStar(tier),
      () => this.closeShopDialog(),
    );
  }

  private purchaseThrowingStar(tier: PurchasableThrowingStarTier): void {
    if (!this.profile) return;
    const result = purchaseThrowingStarItem(
      {
        mesos: this.profile.character.mesos,
        ...this.profile.throwingStars,
      },
      tier,
    );
    if (!result.success) {
      this.showSystemMessage(
        result.reason === "already-owned"
          ? "이미 보유한 표창입니다."
          : "메소가 부족합니다.",
      );
      markCombatEvent(`throwing-star-purchase-blocked:${result.reason}`);
      return;
    }
    this.profile.character.mesos = result.state.mesos;
    this.profile.throwingStars = {
      owned: result.state.owned,
      equipped: result.state.equipped,
    };
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.UiConfirm);
    this.updateHud();
    this.shopDialog?.update(this.profile);
    this.showSystemMessage(`${result.item.name}을 구매했습니다.`);
    markCombatEvent(`throwing-star-purchased:${tier}`);
  }

  private purchaseExperienceBook(): void {
    if (!this.profile) return;
    const result = purchaseShopItem(
      {
        mesos: this.profile.character.mesos,
        inventory: this.profile.inventory,
      },
      ShopItemId.ExperienceBook,
    );
    if (!result.success) {
      this.showSystemMessage("메소가 부족합니다.");
      markCombatEvent("shop-purchase-blocked-mesos");
      return;
    }
    this.profile.character.mesos = result.state.mesos;
    this.profile.inventory = result.state.inventory;
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.UiConfirm);
    this.updateHud();
    this.shopDialog?.update(this.profile);
    this.showSystemMessage("경험의 서를 구매했습니다.");
    markCombatEvent("shop-purchased:experienceBook");
  }

  private purchasePuppuccino(): void {
    if (!this.profile) return;
    if (this.profile.pets.dua.registered) {
      this.showSystemMessage("두아는 이미 등록된 펫입니다.");
      markCombatEvent("puppuccino-purchase-blocked:dua-registered");
      return;
    }
    if ((this.profile.inventory.puppuccino ?? 0) > 0) {
      this.showSystemMessage("이미 멍푸치노를 가지고 있습니다.");
      markCombatEvent("puppuccino-purchase-blocked:already-owned");
      return;
    }
    const result = purchaseShopItem(
      {
        mesos: this.profile.character.mesos,
        inventory: this.profile.inventory,
      },
      ShopItemId.Puppuccino,
    );
    if (!result.success) {
      this.showSystemMessage("멍푸치노를 사려면 50,000 메소가 필요합니다.");
      markCombatEvent("puppuccino-purchase-blocked:mesos");
      return;
    }
    this.profile.character.mesos = result.state.mesos;
    this.profile.inventory = result.state.inventory;
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.UiConfirm);
    this.updateHud();
    this.shopDialog?.update(this.profile);
    this.inventoryDialog?.update(this.profile);
    this.showSystemMessage("멍푸치노를 구매했습니다. 두아에게 가져가 보세요.");
    markCombatEvent("shop-purchased:puppuccino");
  }

  private purchaseRevivalCharm(): void {
    if (!this.profile) return;
    const result = purchaseShopItem(
      {
        mesos: this.profile.character.mesos,
        inventory: this.profile.inventory,
      },
      ShopItemId.RevivalCharm,
    );
    if (!result.success) {
      this.showSystemMessage(
        result.reason === "maximum-owned"
          ? "부활의 부적은 1개만 보유할 수 있습니다."
          : "부활의 부적을 사려면 1,000,000 메소가 필요합니다.",
      );
      markCombatEvent(`revival-charm-purchase-blocked:${result.reason}`);
      return;
    }
    this.profile.character.mesos = result.state.mesos;
    this.profile.inventory = result.state.inventory;
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.UiConfirm);
    this.updateHud();
    this.shopDialog?.update(this.profile);
    this.inventoryDialog?.update(this.profile);
    this.showSystemMessage(
      "부활의 부적을 구매했습니다. 사망하면 자동으로 사용됩니다.",
    );
    markCombatEvent("shop-purchased:revivalCharm");
  }

  private consumeExperienceBook(): void {
    if (!this.profile) return;
    const result = useExperienceBook({
      character: this.profile.character,
      exp: this.profile.exp,
      inventory: this.profile.inventory,
    });
    if (!result.success) {
      this.showSystemMessage(
        result.reason === "max-level"
          ? "이미 최고 레벨입니다."
          : "경험의 서가 없습니다.",
      );
      markCombatEvent(`experience-book-blocked:${result.reason}`);
      return;
    }
    this.profile.character = result.state.character;
    this.profile.exp = result.state.exp;
    this.profile.inventory = result.state.inventory;
    localProfileStore().save(this.profile);
    this.updateHud();
    this.shopDialog?.update(this.profile);
    this.inventoryDialog?.update(this.profile);
    this.showSystemMessage(
      `경험의 서 사용 · 레벨 ${this.profile.character.level} · AP +${result.progression.statPointsGained} · SP +${result.progression.skillPointsGained}`,
    );
    this.playMilestoneEffect(
      "levelUp",
      "LEVEL UP",
      `LV. ${this.profile.character.level} · 경험의 서`,
    );
    markCombatEvent(`experience-book-used:${result.progression.levelsGained}`);
  }

  private useInventoryItem(itemId: UsableInventoryItemId): void {
    if (!this.profile) return;
    if (itemId === ShopItemId.ExperienceBook) {
      this.consumeExperienceBook();
      return;
    }

    const result = useRecoveryBottle({
      character: this.profile.character,
      inventory: this.profile.inventory,
    });
    if (!result.success) {
      this.showSystemMessage(
        result.reason === "already-full"
          ? "HP와 MP가 이미 가득 찼습니다."
          : "회복 물약이 없습니다.",
      );
      markCombatEvent(
        `inventory-item-use-blocked:${RECOVERY_BOTTLE_ITEM_ID}:${result.reason}`,
      );
      return;
    }

    this.profile.character = result.state.character;
    this.profile.inventory = result.state.inventory;
    this.lastRecoveryAt = this.time.now;
    localProfileStore().save(this.profile);
    this.updateHud();
    this.inventoryDialog?.update(this.profile);
    gameAudio().playSfx(AudioAssetKey.Recovery);
    this.showSystemMessage(
      `회복 물약 사용 · HP +${result.hpRecovered} · MP +${result.mpRecovered}`,
    );
    markCombatEvent(
      `inventory-item-used:${RECOVERY_BOTTLE_ITEM_ID}:${result.hpRecovered}:${result.mpRecovered}`,
    );
  }

  private closeShopDialog(): void {
    this.shopDialog?.destroy();
    this.shopDialog = undefined;
    this.dialogOpen = false;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private equipThrowingStar(tier: ThrowingStarTier): void {
    if (!this.profile) return;
    const result = equipThrowingStarItem(this.profile.throwingStars, tier);
    if (!result.success) {
      this.showSystemMessage(
        result.reason === "already-equipped"
          ? "이미 장착 중인 표창입니다."
          : "먼저 상점에서 표창을 구매하세요.",
      );
      markCombatEvent(`throwing-star-equip-blocked:${result.reason}`);
      return;
    }
    this.profile.throwingStars = result.state;
    localProfileStore().save(this.profile);
    gameAudio().playSfx(AudioAssetKey.UiConfirm);
    this.updateHud();
    this.statsDialog?.update(this.profile);
    this.showSystemMessage(`${result.item.name}을 장착했습니다.`);
    markCombatEvent(`throwing-star-equipped:${tier}`);
  }

  private openInventoryDialog(): void {
    if (!this.player || !this.profile || this.dialogOpen) return;
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    this.inventoryDialog = showInventoryOverlay(
      this.profile,
      (itemId) => this.useInventoryItem(itemId),
      () => this.closeInventoryDialog(),
    );
  }

  private closeInventoryDialog(): void {
    this.inventoryDialog?.destroy();
    this.inventoryDialog = undefined;
    this.dialogOpen = false;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private openSkillDialog(): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.player.stopForDialog();
    this.inputController?.resetState();
    this.skillDialog = showSkillOverlay(
      this.profile,
      (skillId: SkillId) => {
        if (!this.profile) return;
        this.profile.character = allocateSkillPoint(
          this.profile.character,
          skillId,
        );
        this.persistSkillChange();
      },
      () => this.closeSkillDialog(),
    );
  }

  private persistSkillChange(combatEvent = "skills-updated"): void {
    if (!this.profile) {
      return;
    }
    localProfileStore().save(this.profile);
    this.syncPersistentHokageEffects();
    this.updateHud();
    this.skillDialog?.update(this.profile);
    this.skillHotkeyDialog?.update(this.profile);
    markCombatEvent(combatEvent);
  }

  private closeSkillDialog(): void {
    this.skillDialog?.destroy();
    this.skillDialog = undefined;
    this.dialogOpen = false;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private persistStatsChange(): void {
    if (!this.profile) {
      return;
    }
    localProfileStore().save(this.profile);
    this.updateHud();
    this.statsDialog?.update(this.profile);
    markCombatEvent("stats-updated");
  }

  private closeStatsDialog(): void {
    this.statsDialog?.destroy();
    this.statsDialog = undefined;
    this.dialogOpen = false;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private openJobDialog(npc: NpcView): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.dialogNpc = npc;
    this.player.stopForDialog();
    this.inputController?.resetState();
    npc.sprite.play(animationKey(npc.definition.spriteSheet, "talk"), true);
    const state = jobAdvancementQuestState(
      this.profile.character,
      this.profile.activeJobAdvancementQuest,
    );
    this.dialog = showJobAdvancementOverlay(
      state,
      () => {
        if (!this.profile || state.status !== "offer") return;
        this.profile.activeJobAdvancementQuest = acceptJobAdvancementQuest(
          this.profile.character,
          this.profile.activeJobAdvancementQuest,
        );
        localProfileStore().save(this.profile);
        this.updateHud();
        this.showSystemMessage(
          `${state.quest.title} 시작 · ${state.quest.destination}에서 ${state.quest.targetLabel} ${state.quest.requiredDefeats}마리 처치`,
        );
        markCombatEvent(`job-quest-accepted:${state.quest.id}`);
        this.closeJobDialog();
      },
      () => {
        if (!this.profile || state.status !== "ready-to-advance") return;
        const targetJob = state.quest.advancement.to;
        const unlockedSkills = state.quest.advancement.unlockedSkills
          .map((skillId) => SKILL_DEFINITIONS[skillId].label)
          .join(" · ");
        const claim = claimJobAdvancementQuest(
          this.profile.character,
          this.profile.activeJobAdvancementQuest,
        );
        if (!claim.advanced) return;
        this.profile.character = claim.character;
        this.profile.activeJobAdvancementQuest = claim.activeQuest;
        this.player?.setJobAppearance(targetJob);
        localProfileStore().save(this.profile);
        this.syncPersistentHokageEffects();
        this.updateHud();
        this.showSystemMessage(
          `${playerJobLabel(targetJob)}로 전직했습니다. ${unlockedSkills} 해금!`,
        );
        markCombatEvent(`job-advanced-${targetJob}`);
        this.closeJobDialog(false);
        this.playJobAdvancementCeremony(npc, playerJobLabel(targetJob));
      },
      () => this.closeJobDialog(),
    );
  }

  private openDungeonBossQuestDialog(npc: NpcView): void {
    if (!this.player || !this.profile || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.dialogNpc = npc;
    this.player.stopForDialog();
    this.inputController?.resetState();
    npc.sprite.play(animationKey(npc.definition.spriteSheet, "talk"), true);
    const progress = this.profile.dungeonBossQuest;
    this.dialog = showDungeonBossQuestOverlay(
      progress,
      () => {
        if (!this.profile || progress.stage !== DungeonBossQuestStage.Offer)
          return;
        this.profile.dungeonBossQuest = acceptDungeonBossQuest(progress);
        localProfileStore().save(this.profile);
        this.updateHud();
        this.showSystemMessage(
          `퀘스트 시작 · ${DUNGEON_BOSS_QUEST.midBoss.destination}에서 ${DUNGEON_BOSS_QUEST.midBoss.name} 처치`,
        );
        markCombatEvent("dungeon-boss-quest-accepted");
        this.closeDungeonBossQuestDialog(false);
        this.playDungeonQuestNpcAnimation(npc, "brief");
      },
      () => {
        if (!this.profile || progress.stage !== DungeonBossQuestStage.TurnIn)
          return;
        const claim = claimDungeonBossQuest(progress);
        if (!claim.claimed) return;
        this.profile.dungeonBossQuest = claim.progress;
        this.profile.character.mesos += claim.reward.mesos;
        this.profile.inventory.experienceBook =
          (this.profile.inventory.experienceBook ?? 0) +
          claim.reward.experienceBooks;
        localProfileStore().save(this.profile);
        this.updateHud();
        this.showSystemMessage(
          `원정 완료 · ${claim.reward.mesos.toLocaleString("ko-KR")} 메소 · 경험의 서 ${claim.reward.experienceBooks}권`,
        );
        markCombatEvent("dungeon-boss-quest-completed");
        this.closeDungeonBossQuestDialog(false);
        this.playDungeonQuestNpcAnimation(npc, "approve");
      },
      () => this.closeDungeonBossQuestDialog(),
    );
  }

  private openDeveloperPromoDialog(npc: NpcView): void {
    if (!this.player || this.dialogOpen) {
      return;
    }
    this.dialogOpen = true;
    this.dialogNpc = npc;
    this.player.stopForDialog();
    this.inputController?.resetState();
    npc.sprite.play(animationKey(npc.definition.spriteSheet, "talk"), true);
    this.dialog = showDeveloperPromoOverlay(
      () => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        markCombatEvent("developer-channel-opened");
        npc.sprite.play(
          animationKey(npc.definition.spriteSheet, "thanks"),
          true,
        );
        npc.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          if (!npc.sprite.active) return;
          npc.sprite.play(
            animationKey(
              npc.definition.spriteSheet,
              this.dialogOpen && this.dialogNpc === npc ? "talk" : "idle",
            ),
            true,
          );
        });
      },
      () => this.closeDeveloperPromoDialog(),
    );
  }

  private openDuaAdoptionDialog(npc: NpcView): void {
    if (!this.player || !this.profile || this.dialogOpen) return;
    this.dialogOpen = true;
    this.dialogNpc = npc;
    this.player.stopForDialog();
    this.inputController?.resetState();
    npc.sprite.play(animationKey("duaPet", "idle"), true);
    this.dialog = showDuaAdoptionOverlay(
      this.profile,
      () => {
        if (!this.profile) return;
        const result = registerDuaWithPuppuccino({
          pets: this.profile.pets,
          inventory: this.profile.inventory,
        });
        if (!result.success) {
          this.showSystemMessage(
            result.reason === "already-registered"
              ? "두아는 이미 등록된 펫입니다."
              : "먼저 상점에서 멍푸치노를 구매하세요.",
          );
          markCombatEvent(`dua-registration-blocked:${result.reason}`);
          return;
        }

        const adoptionPosition = { x: npc.sprite.x, y: npc.sprite.y };
        this.profile.pets = result.state.pets;
        this.profile.inventory = result.state.inventory;
        localProfileStore().save(this.profile);
        this.closeDuaAdoptionDialog(false);
        this.removeNpc(npc);
        this.createDuaPet(adoptionPosition.x, adoptionPosition.y, true);
        this.drawMiniMap(MAP_DEFINITIONS[this.profile.location]);
        this.updateHud();
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        this.showSystemMessage(
          "두아가 펫으로 등록되었습니다! 이제 함께 다니며 아이템을 주워줍니다.",
        );
        markCombatEvent("dua-registered");
      },
      () => this.closeDuaAdoptionDialog(),
    );
  }

  private closeDuaAdoptionDialog(resetNpc = true): void {
    this.dialog?.destroy();
    this.dialog = undefined;
    this.dialogOpen = false;
    if (resetNpc && this.dialogNpc?.sprite.active) {
      this.dialogNpc.sprite.play(animationKey("duaPet", "idle"), true);
    }
    this.dialogNpc = undefined;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private closeDeveloperPromoDialog(): void {
    this.dialog?.destroy();
    this.dialog = undefined;
    this.dialogOpen = false;
    if (this.dialogNpc?.sprite.active) {
      this.dialogNpc.sprite.play(
        animationKey(this.dialogNpc.definition.spriteSheet, "idle"),
        true,
      );
    }
    this.dialogNpc = undefined;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private playDungeonQuestNpcAnimation(
    npc: NpcView,
    animation: "brief" | "approve",
  ): void {
    if (!npc.sprite.active) return;
    npc.sprite.play(animationKey(npc.definition.spriteSheet, animation), true);
    npc.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (npc.sprite.active) {
        npc.sprite.play(animationKey(npc.definition.spriteSheet, "idle"), true);
      }
    });
  }

  private closeDungeonBossQuestDialog(resetNpc = true): void {
    this.dialog?.destroy();
    this.dialog = undefined;
    this.dialogOpen = false;
    if (resetNpc && this.dialogNpc?.sprite.active) {
      this.dialogNpc.sprite.play(
        animationKey(this.dialogNpc.definition.spriteSheet, "idle"),
        true,
      );
    }
    this.dialogNpc = undefined;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private playJobAdvancementCeremony(npc: NpcView, jobLabel: string): void {
    npc.sprite.play(animationKey(npc.definition.spriteSheet, "cast"), true);
    npc.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!npc.sprite.active) {
        return;
      }
      npc.sprite.play(
        animationKey(npc.definition.spriteSheet, "approve"),
        true,
      );
      npc.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (npc.sprite.active) {
          npc.sprite.play(
            animationKey(npc.definition.spriteSheet, "idle"),
            true,
          );
        }
      });
    });
    this.playMilestoneEffect("jobAdvancement", "JOB ADVANCEMENT", jobLabel);
  }

  private closeJobDialog(resetNpc = true): void {
    this.dialog?.destroy();
    this.dialog = undefined;
    this.dialogOpen = false;
    if (resetNpc && this.dialogNpc?.sprite.active) {
      this.dialogNpc.sprite.play(
        animationKey(this.dialogNpc.definition.spriteSheet, "idle"),
        true,
      );
    }
    this.dialogNpc = undefined;
    this.inputController?.resetState();
    queueMicrotask(() => this.game.canvas.focus({ preventScroll: true }));
  }

  private createHud(): void {
    this.playHud = new PlayHud(this);

    const miniMapCenter = hudPanelCenter(HUD_PANEL_BOUNDS.miniMap);
    this.miniMapPanel = addNineSlicePanel(
      this,
      "hud",
      miniMapCenter.x,
      miniMapCenter.y,
      HUD_PANEL_BOUNDS.miniMap.width,
      HUD_PANEL_BOUNDS.miniMap.height,
      UI_DEPTH,
    ).setAlpha(HUD_PANEL_ALPHA.floating);
    const miniMapHeader = HUD_CONTENT_BOUNDS.miniMapHeader;
    const miniMapInfo = HUD_CONTENT_BOUNDS.miniMapInfo;
    const miniMapContent = HUD_CONTENT_BOUNDS.miniMapBody;
    const miniMapBody = addHudSurface(
      this,
      miniMapContent.x + miniMapContent.width / 2,
      miniMapContent.y + miniMapContent.height / 2,
      miniMapContent.width,
      miniMapContent.height,
      UI_DEPTH + 1,
    )
      .setTint(0xb8cad0)
      .setAlpha(0.46);
    const miniMapBodyBorder = this.add
      .rectangle(
        miniMapContent.x + miniMapContent.width / 2,
        miniMapContent.y + miniMapContent.height / 2,
        miniMapContent.width,
        miniMapContent.height,
        0x000000,
        0,
      )
      .setStrokeStyle(1, 0xd3ded8, 0.78)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    const miniMapInfoSurface = addHudSurface(
      this,
      miniMapInfo.x + miniMapInfo.width / 2,
      miniMapInfo.y + miniMapInfo.height / 2,
      miniMapInfo.width,
      miniMapInfo.height,
      UI_DEPTH + 1,
    )
      .setTint(0x71878a)
      .setAlpha(0.62);
    const miniMapHeaderSurface = addHudSurface(
      this,
      miniMapHeader.x + miniMapHeader.width / 2,
      miniMapHeader.y + miniMapHeader.height / 2,
      miniMapHeader.width,
      miniMapHeader.height,
      UI_DEPTH + 1,
    )
      .setTint(0x789092)
      .setAlpha(0.82);
    const miniMapHeaderBorder = this.add
      .rectangle(
        miniMapHeader.x + miniMapHeader.width / 2,
        miniMapHeader.y + miniMapHeader.height / 2,
        miniMapHeader.width,
        miniMapHeader.height,
        0x000000,
        0,
      )
      .setStrokeStyle(1, 0xb8c6c2, 0.58)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    const miniMapHeaderIndicator = this.add
      .rectangle(
        miniMapHeader.x + 9,
        miniMapHeader.y + miniMapHeader.height / 2,
        5,
        5,
        0x70d5e8,
        0.95,
      )
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    const miniMapTitle = this.add
      .text(
        miniMapHeader.x + 20,
        miniMapHeader.y + miniMapHeader.height / 2,
        "MINI MAP",
        {
          color: "#eaf4ef",
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: "11px",
          fontStyle: "bold",
        },
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    const miniMapPlayerLegendDot = this.add
      .circle(
        miniMapHeader.x + miniMapHeader.width - 133,
        miniMapHeader.y + miniMapHeader.height / 2,
        3,
        0xffd65c,
        1,
      )
      .setStrokeStyle(1, 0xf7fff9, 0.95)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 3);
    const miniMapPlayerLegend = this.add
      .text(
        miniMapHeader.x + miniMapHeader.width - 126,
        miniMapHeader.y + miniMapHeader.height / 2,
        "나",
        {
          color: "#fff0aa",
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: "9px",
          fontStyle: "bold",
        },
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    const miniMapNpcLegendDot = this.add
      .circle(
        miniMapHeader.x + miniMapHeader.width - 98,
        miniMapHeader.y + miniMapHeader.height / 2,
        3,
        0x55e879,
        1,
      )
      .setStrokeStyle(1, 0xf7fff9, 0.95)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 3);
    const miniMapNpcLegend = this.add
      .text(
        miniMapHeader.x + miniMapHeader.width - 91,
        miniMapHeader.y + miniMapHeader.height / 2,
        "NPC",
        {
          color: "#c9f8d7",
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: "9px",
          fontStyle: "bold",
        },
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    const miniMapPortalLegendDot = this.add
      .rectangle(
        miniMapHeader.x + miniMapHeader.width - 56,
        miniMapHeader.y + miniMapHeader.height / 2,
        6,
        6,
        0x68e7ff,
        1,
      )
      .setAngle(45)
      .setStrokeStyle(1, 0xf2ffff, 0.96)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 3);
    const miniMapPortalLegend = this.add
      .text(
        miniMapHeader.x + miniMapHeader.width - 47,
        miniMapHeader.y + miniMapHeader.height / 2,
        "포탈",
        {
          color: "#bff7ff",
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: "9px",
          fontStyle: "bold",
        },
      )
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    this.mapNameText = this.add
      .text(miniMapInfo.x + 8, miniMapInfo.y + 3, "", {
        color: "#fff0aa",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "13px",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    this.mapLevelText = this.add
      .text(miniMapInfo.x + 8, miniMapInfo.y + 31, "현재 지역", {
        color: "#c0cfcc",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "9px",
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2);
    this.miniMapTerrain = this.add
      .graphics()
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 3);
    this.miniMapPlayerMarker = this.add
      .circle(0, 0, 5, 0xffd65c, 1)
      .setStrokeStyle(2, 0xf7fff9, 1)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 5)
      .setVisible(false);
    this.miniMapTexts = [
      miniMapTitle,
      miniMapPlayerLegend,
      miniMapNpcLegend,
      miniMapPortalLegend,
      this.mapNameText,
      this.mapLevelText,
    ];
    this.miniMapHeaderObjects = [
      miniMapHeaderSurface,
      miniMapHeaderBorder,
      miniMapHeaderIndicator,
      miniMapTitle,
      miniMapPlayerLegendDot,
      miniMapPlayerLegend,
      miniMapNpcLegendDot,
      miniMapNpcLegend,
      miniMapPortalLegendDot,
      miniMapPortalLegend,
    ];
    this.miniMapBodyObjects = [
      miniMapInfoSurface,
      miniMapBody,
      miniMapBodyBorder,
      this.miniMapTerrain,
      this.mapNameText,
      this.mapLevelText,
    ];
    this.systemPanel = addNineSlicePanel(
      this,
      "hud",
      640,
      216,
      240,
      46,
      UI_DEPTH + 1,
    )
      .setAlpha(0.9)
      .setVisible(false);
    this.systemText = this.add
      .text(640, 216, "", {
        color: "#fff0a6",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "17px",
        align: "center",
        wordWrap: { width: 680 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2)
      .setVisible(false);
    this.interactionPanel = addNineSlicePanel(
      this,
      "hud",
      640,
      568,
      260,
      48,
      UI_DEPTH + 1,
    )
      .setAlpha(0.92)
      .setVisible(false);
    this.interactionText = this.add
      .text(640, 568, "", {
        color: "#fff3b5",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "18px",
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(UI_DEPTH + 2)
      .setVisible(false);
  }

  private updateHud(): void {
    if (!this.profile) {
      return;
    }
    const { character } = this.profile;
    this.mobileControls?.update(character.job, this.profile.skillHotbar);
    this.playHud?.update(this.profile, this.nineTailsTransformationActive);
    markPlayerState(
      character.job,
      character.level,
      character.hp,
      character.mp,
      character.stats,
      character.statPoints,
      character.autoAllocateStats,
      character.name,
    );
    markProgressState(
      this.profile.exp,
      character.mesos,
      this.profile.inventory,
    );
    markSkillState(
      character.skillPoints,
      character.skillLevels,
      this.profile.skillHotbar,
      this.profile.skillHotkeyAliases,
    );
    markHokageState(
      this.nineTailsTransformationActive,
      character.skillLevels[SkillId.SageMode] > 0,
    );
    markEquipmentState(this.profile.throwingStars.equipped);
    markDungeonBossQuestState(this.profile.dungeonBossQuest.stage);
    const questState = jobAdvancementQuestState(
      character,
      this.profile.activeJobAdvancementQuest,
    );
    if ("quest" in questState) {
      markJobQuestState(
        this.profile.activeJobAdvancementQuest?.id ?? null,
        questState.defeated,
        questState.quest.requiredDefeats,
        questState.status,
      );
    } else {
      markJobQuestState(null, 0, 0, questState.status);
    }
    markPlayerAppearance(PLAYER_SHEET_BY_JOB[character.job]);
    this.markHudPaddingState();
  }

  private drawMiniMap(definition: MapDefinition): void {
    if (!this.miniMapTerrain || !this.miniMapPlayerMarker) {
      return;
    }
    this.miniMapProjection = miniMapProjection(
      definition.width,
      definition.height,
      HUD_CONTENT_BOUNDS.miniMapBody,
    );
    const projection = this.miniMapProjection;
    this.miniMapTerrain.clear();

    for (const platform of definition.platforms) {
      const left = projectMiniMapPoint(
        {
          x: platform.x - platform.width / 2,
          y: platform.y - platform.height / 2,
        },
        projection,
      );
      const right = projectMiniMapPoint(
        {
          x: platform.x + platform.width / 2,
          y: platform.y - platform.height / 2,
        },
        projection,
      );
      this.miniMapTerrain
        .lineStyle(
          platform.oneWay ? 2 : 4,
          platform.oneWay ? 0x95b8ad : 0xc5d4cb,
          0.94,
        )
        .lineBetween(left.x, left.y, right.x, right.y);
    }
    for (const climbable of definition.climbables ?? []) {
      const top = projectMiniMapPoint(
        { x: climbable.x, y: climbable.top },
        projection,
      );
      const bottom = projectMiniMapPoint(
        { x: climbable.x, y: climbable.bottom },
        projection,
      );
      this.miniMapTerrain
        .lineStyle(1, 0xd5b86c, 0.88)
        .lineBetween(top.x, top.y, bottom.x, bottom.y);
    }

    this.miniMapPortalCount = this.portalViews.length;
    for (const { definition: portal } of this.portalViews) {
      const point = projectMiniMapPoint(portal, projection);
      this.miniMapTerrain
        .fillStyle(0x68e7ff, 0.98)
        .fillCircle(point.x, point.y - 5, 4.5)
        .lineStyle(1, 0xf2ffff, 1)
        .strokeCircle(point.x, point.y - 5, 4.5)
        .fillStyle(0xffffff, 1)
        .fillCircle(point.x, point.y - 5, 1.5);
    }

    this.miniMapNpcCount = this.npcViews.length;
    for (const { definition: npc } of this.npcViews) {
      const point = projectMiniMapPoint(npc, projection);
      this.miniMapTerrain
        .fillStyle(0x55e879, 1)
        .fillCircle(point.x, point.y - 5, 4)
        .lineStyle(1, 0xf7fff9, 0.96)
        .strokeCircle(point.x, point.y - 5, 4);
    }
    this.updateMiniMapPlayerMarker();
    this.markMiniMapMarkerState();
  }

  private updateMiniMapPlayerMarker(): void {
    if (!this.player || !this.miniMapProjection || !this.miniMapPlayerMarker) {
      return;
    }
    const point = projectMiniMapPoint(this.player, this.miniMapProjection);
    this.miniMapPlayerMarker
      .setPosition(point.x, point.y - 5)
      .setVisible(!this.miniMapCollapsed);
  }

  private markMiniMapMarkerState(): void {
    markMiniMapState(
      !this.miniMapCollapsed,
      this.miniMapPlayerMarker?.visible
        ? { x: this.miniMapPlayerMarker.x, y: this.miniMapPlayerMarker.y }
        : null,
      this.miniMapNpcCount,
      this.miniMapPortalCount,
    );
  }

  private markHudPaddingState(): void {
    const violations = this.playHud?.paddingViolations() ?? [];
    const miniMapAuditBounds = hudFloatingPanelBounds(
      HUD_PANEL_BOUNDS.miniMap,
      this.miniMapCollapsed,
    );
    for (const [index, text] of this.miniMapTexts.entries()) {
      if (!text.visible) continue;
      const bounds = text.getBounds();
      if (
        !hudTextFitsPanel(
          {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
          },
          miniMapAuditBounds,
          this.miniMapCollapsed ? HUD_COLLAPSED_SAFE_PADDING : undefined,
        )
      ) {
        violations.push(`miniMap:${index}`);
      }
    }
    markHudPaddingViolations(violations.length, violations);
  }

  private readonly handleHudPanelToggle = (event: Event): void => {
    const { panel, collapsed } = (
      event as CustomEvent<{ panel: HudFloatingPanel; collapsed: boolean }>
    ).detail;
    this.game.canvas.setAttribute(
      `data-hud-${panel}-collapsed`,
      String(collapsed),
    );
    if (panel === "miniMap") {
      this.miniMapCollapsed = collapsed;
      const bounds = HUD_PANEL_BOUNDS.miniMap;
      const layout = hudFloatingPanelLayout(bounds, collapsed);
      const headerCenterY =
        HUD_CONTENT_BOUNDS.miniMapHeader.y +
        HUD_CONTENT_BOUNDS.miniMapHeader.height / 2 +
        layout.headerShiftY;
      this.miniMapPanel
        ?.setSize(bounds.width, layout.height)
        .setPosition(bounds.x + bounds.width / 2, layout.centerY);
      for (const object of this.miniMapHeaderObjects) {
        object.setY(headerCenterY);
      }
      for (const object of this.miniMapBodyObjects)
        object.setVisible(!collapsed);
      this.miniMapPlayerMarker?.setVisible(!collapsed);
      this.markMiniMapMarkerState();
      this.markHudPaddingState();
      return;
    }
    this.playHud?.setFloatingPanelCollapsed(panel, collapsed);
    this.markHudPaddingState();
  };

  private updateRuntimeTelemetry(): void {
    if (!this.player || this.time.now < this.nextRuntimeTelemetryAt) {
      return;
    }
    this.nextRuntimeTelemetryAt = this.time.now + RUNTIME_TELEMETRY_INTERVAL_MS;
    const nameplate = this.player.nameplateState();
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    markRuntimeTelemetry({
      playerX: this.player.x,
      playerY: this.player.y,
      playerVelocityX: playerBody.velocity.x,
      playerMaxVelocityX: playerBody.maxVelocity.x,
      playerNameplateX: nameplate.x,
      playerNameplateY: nameplate.y,
      playerNameplateVisible: nameplate.visible,
      petActive: Boolean(this.duaPet?.active),
      petX: this.duaPet?.x ?? 0,
      petY: this.duaPet?.y ?? 0,
      petBehavior: this.duaPet?.behaviorState() ?? "none",
      petTargetLoot: Boolean(this.duaPetTargetLoot?.sprite.active),
      cameraScrollY: this.cameras.main.scrollY,
      mapObjects: this.mapObjects.length,
      mapColliders: this.mapColliders.length,
      mapTimers: this.mapTimers.length,
      projectiles: this.projectiles.length + this.bossProjectiles.length,
      projectileStates: [
        ...this.projectiles.map((projectile) => ({
          kind: projectile.kind,
          activeAgeMs: projectile.activeAgeMs,
          lifetimeMs: projectile.lifetimeMs,
          x: projectile.sprite.x,
        })),
        ...this.bossProjectiles.map((projectile) => ({
          kind: projectile.definition.id,
          activeAgeMs: projectile.activeAgeMs,
          lifetimeMs: projectile.definition.projectileLifetimeMs,
          x: projectile.sprite.x,
        })),
      ],
      bossProjectiles: this.bossProjectiles.length,
      loot: this.lootViews.length,
      lootPositions: this.lootViews.map((loot) => loot.sprite.x),
      pendingRewards: this.pendingMonsterRewards.size,
      trackedEffects: this.playerTrackedEffects.length,
      cinematicObjects: this.hokageCinematicObjects.length,
      fps: this.game.loop.actualFps,
    });
    this.markMiniMapMarkerState();
  }

  private updateNaturalRecovery(): void {
    if (
      !this.profile ||
      !canApplyRecoveryTick(
        this.time.now,
        this.lastRecoveryAt,
        this.lastDamagedAt,
        recoveryIntervalMs(this.profile.character.skillLevels),
      )
    ) {
      return;
    }

    this.lastRecoveryAt = this.time.now;
    const recovery = recoverCharacter(
      this.profile.character,
      !this.nineTailsTransformationActive,
    );
    if (recovery.hpRecovered === 0 && recovery.mpRecovered === 0) {
      return;
    }

    this.profile.character = recovery.character;
    localProfileStore().save(this.profile);
    this.updateHud();
  }

  private updateNineTailsTransformationMpDrain(): void {
    if (
      !this.profile ||
      !this.nineTailsTransformationActive ||
      this.time.now < this.nextNineTailsMpDrainAt
    ) {
      return;
    }

    const tickCount =
      Math.floor(
        (this.time.now - this.nextNineTailsMpDrainAt) /
          NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS,
      ) + 1;
    const result = drainNineTailsTransformationMp(
      true,
      this.profile.character,
      tickCount,
    );
    this.profile.character.mp = result.remainingMp;
    this.nineTailsMpDrainTicks += tickCount;
    markNineTailsDrainState(
      this.nineTailsMpDrainTicks,
      result.drainedMp,
      result.remainingMp,
    );
    this.nextNineTailsMpDrainAt +=
      tickCount * NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS;
    if (!result.active) {
      this.deactivateNineTailsTransformation(
        "MP가 모두 소모되어 구미호 변신이 해제되었습니다.",
      );
      markCombatEvent("nine-tails-depleted");
    }
    localProfileStore().save(this.profile);
    this.updateHud();
  }

  private deactivateNineTailsTransformation(message: string): void {
    if (!this.nineTailsTransformationActive) return;
    this.nineTailsTransformationActive = false;
    this.nextNineTailsMpDrainAt = Number.POSITIVE_INFINITY;
    this.player?.setNineTailsTransformationActive(false);
    this.syncPersistentHokageEffects();
    this.showSystemMessage(message);
  }

  private updatePlayerInvulnerabilityFlash(): void {
    if (!this.player) {
      return;
    }
    if (this.time.now >= this.invulnerableUntil) {
      if (this.playerInvulnerabilityFlashing) {
        this.player.setAlpha(1);
        this.playerInvulnerabilityFlashing = false;
      }
      return;
    }

    this.playerInvulnerabilityFlashing = true;
    this.player.setAlpha(
      playerInvulnerabilityAlpha(
        this.time.now,
        this.invulnerabilityVisualStartedAt,
        this.invulnerableUntil,
      ),
    );
  }

  private showSystemMessage(message: string): void {
    this.systemTimer?.remove(false);
    if (this.systemText && this.systemPanel) {
      this.systemText.setText(message).setVisible(true);
      this.systemPanel
        .setSize(
          Math.min(720, Math.max(220, Math.ceil(this.systemText.width + 40))),
          Math.max(46, Math.ceil(this.systemText.height + 24)),
        )
        .setVisible(true);
    }
    announceGameStatus(message);
    this.systemTimer = this.time.delayedCall(1900, () => {
      this.systemPanel?.setVisible(false);
      this.systemText?.setVisible(false);
    });
  }

  private showInteractionMessage(message: string): void {
    if (!this.interactionText || !this.interactionPanel) return;
    this.interactionText.setText(message).setVisible(true);
    this.interactionPanel
      .setSize(
        Math.min(
          644,
          Math.max(240, Math.ceil(this.interactionText.width + 44)),
        ),
        Math.max(48, Math.ceil(this.interactionText.height + 24)),
      )
      .setVisible(true);
  }

  private hideInteractionMessage(): void {
    this.interactionPanel?.setVisible(false);
    this.interactionText?.setVisible(false);
  }

  private scheduleMapTimer(delayMs: number, callback: () => void): void {
    let timer!: Phaser.Time.TimerEvent;
    timer = this.time.delayedCall(delayMs, () => {
      const index = this.mapTimers.indexOf(timer);
      if (index >= 0) {
        this.mapTimers.splice(index, 1);
      }
      callback();
    });
    this.mapTimers.push(timer);
  }

  private updateMonsterMarker(): void {
    markMonstersAlive(
      this.monsters.filter((monster) => monster.isAlive()).length,
    );
  }

  private syncMapBgm(definition?: MapDefinition): void {
    const currentDefinition =
      definition ??
      (this.profile ? MAP_DEFINITIONS[this.profile.location] : undefined);
    if (!currentDefinition) return;
    const hasLivingBoss = this.monsters.some(
      (monster) =>
        monster.isAlive() &&
        MONSTER_CATALOG[monster.monsterKind].bossRank !== "normal",
    );
    const desiredBgm = bgmForBossPresence(
      currentDefinition.bgm,
      hasLivingBoss,
    );
    this.desiredMapBgm = desiredBgm;
    if (
      desiredBgm !== AudioAssetKey.BossTheme ||
      this.cache.audio.exists(desiredBgm)
    ) {
      gameAudio().playBgm(desiredBgm);
      return;
    }
    this.deferredAudioLoader?.ensureLoaded(
      desiredBgm,
      this.handleDeferredBossBgmReady,
    );
  }

  private readonly handleDeferredBossBgmReady = (): void => {
    if (this.desiredMapBgm === AudioAssetKey.BossTheme) {
      gameAudio().playBgm(AudioAssetKey.BossTheme);
    }
  };

  private updateBossHud(): void {
    const boss = this.monsters.find(
      (monster) => MONSTER_CATALOG[monster.monsterKind].bossRank !== "normal",
    );
    if (!boss) {
      this.playHud?.updateBoss();
      markBossState();
      this.markHudPaddingState();
      return;
    }
    const definition = MONSTER_CATALOG[boss.monsterKind];
    if (definition.bossRank === "normal") {
      this.playHud?.updateBoss();
      markBossState();
      this.markHudPaddingState();
      return;
    }
    const health = boss.healthSnapshot();
    const state = {
      kind: boss.monsterKind,
      name: definition.name,
      rank: definition.bossRank,
      currentHp: health.current,
      maxHp: health.maximum,
      alive: boss.isAlive(),
      phase:
        boss.monsterKind === "onePunchMan"
          ? onePunchManPhaseFor(health.current, health.maximum)
          : undefined,
    } as const;
    this.playHud?.updateBoss(state);
    markBossState(
      state.kind,
      state.rank,
      state.currentHp,
      state.maxHp,
      state.alive ? "alive" : "defeated",
      state.phase,
      monsterKnockbackImmune(boss.monsterKind),
    );
    this.markHudPaddingState();
  }

  private persistRegion(definition: MapDefinition): void {
    if (!this.profile) {
      return;
    }
    this.profile.location = definition.id;
    localProfileStore().save(this.profile);
  }

  private clearMap(): void {
    this.finishHokageCinematic();
    this.player?.cancelClimb();
    this.playerDropThrough = undefined;
    this.attackGeneration += 1;
    for (const collider of this.mapColliders.splice(0)) collider.destroy();
    for (const timer of this.mapTimers.splice(0)) timer.remove(false);
    for (const projectile of this.projectiles.splice(0))
      projectile.sprite.destroy();
    for (const projectile of this.bossProjectiles.splice(0)) {
      projectile.sprite.destroy();
    }
    this.pendingBossRangedAttacks = 0;
    for (const loot of [...this.lootViews]) this.removeLoot(loot);
    for (const monster of this.monsters.splice(0)) monster.destroy();
    this.pendingMonsterRewards.clear();
    this.playerTrackedEffects.splice(0);
    this.sageAuraEffect = undefined;
    this.nineTailsAuraEffect = undefined;
    for (const object of this.mapObjects.splice(0)) {
      this.tweens.killTweensOf(object);
      object.destroy();
    }
    this.duaPet = undefined;
    this.duaPetTargetLoot = undefined;
    this.platformViews.splice(0);
    this.climbables.splice(0);
    this.hazardViews.splice(0);
    this.portalViews.splice(0);
    this.npcViews.splice(0);
    this.miniMapProjection = undefined;
    this.miniMapTerrain?.clear();
    this.miniMapPlayerMarker?.setVisible(false);
    this.miniMapNpcCount = 0;
    this.miniMapPortalCount = 0;
    this.markMiniMapMarkerState();
    markPortalEffectState();
    markMonstersAlive(0);
    this.playHud?.updateBoss();
    markBossState();
    markBossRangedAttack();
    markAttackAfterimage();
    markClimbState(false);
  }
}

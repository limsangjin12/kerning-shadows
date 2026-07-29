import Phaser from "phaser";
import { ACTIVE_SKILL_ICON_KEYS } from "../assets/skill-icon-assets";
import {
  ATTACK_DEFINITIONS,
  AttackKind,
  unlockedAttacks,
} from "../combat/combat-rules";
import {
  playerJobLabel,
  type MonsterBossRank,
  type MonsterKind,
} from "../data/catalog";
import { expRequiredForLevel } from "../progression/progression-rules";
import type { LocalProfile } from "../profile/local-profile";
import { THROWING_STAR_CATALOG } from "../equipment/throwing-star-rules";
import { jobQuestTrackerText } from "../quests/job-advancement-quests";
import { bossProgressionGuideText } from "../quests/boss-progression-guide";
import {
  SKILL_DEFINITIONS,
  SkillId,
  isSkillUnlocked,
  skillHotkeyAssignments,
  type ActiveSkillId,
  type SkillHotkey,
  type SkillId as SkillIdType,
} from "../skills/skill-rules";
import {
  HUD_PANEL_ALPHA,
  PIXEL_FONT_FAMILY,
  UI_DEPTH,
  addHudSurface,
  addNineSlicePanel,
} from "./ui-theme";
import {
  HUD_CONTENT_BOUNDS,
  HUD_COLLAPSED_SAFE_PADDING,
  HUD_INNER_CELL_PADDING,
  HUD_METER_CELL_PADDING,
  HUD_PANEL_BOUNDS,
  countHudPaddingViolations,
  formatHudCompactInteger,
  formatHudMeterValue,
  hudFloatingPanelBounds,
  hudFloatingPanelLayout,
  hudPanelCenter,
  hudTextBoundsConflict,
  sumHudIntegerValues,
  type HudPadding,
  type HudRectangle,
  type HudTextAudit,
} from "./hud-layout-rules";
import {
  setHudWindowControlVisible,
  type HudFloatingPanel,
} from "./hud-window-controls";

interface HudMeter {
  fill: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  width: number;
}

interface HudSkillSlot {
  skillId: ActiveSkillId;
  hotkey: SkillHotkey;
  background: Phaser.GameObjects.NineSlice;
  frame: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  hotkeySurface: Phaser.GameObjects.Image;
  hotkeyBack: Phaser.GameObjects.Rectangle;
  hotkeyText: Phaser.GameObjects.Text;
}

type HudDecoration = Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

const HUD_DEPTH = UI_DEPTH;

export interface BossHudState {
  kind: MonsterKind;
  name: string;
  rank: Exclude<MonsterBossRank, "normal">;
  currentHp: number;
  maxHp: number;
  alive: boolean;
  phase?: 1 | 2;
}

export class PlayHud {
  private readonly controlTexts: Phaser.GameObjects.Text[];
  private readonly controlsPanel: Phaser.GameObjects.NineSlice;
  private readonly controlsHeaderDecorations: HudDecoration[];
  private readonly controlsBodyDecorations: HudDecoration[];
  private readonly levelLabelText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly jobText: Phaser.GameObjects.Text;
  private readonly mesosText: Phaser.GameObjects.Text;
  private readonly inventoryText: Phaser.GameObjects.Text;
  private readonly skillText: Phaser.GameObjects.Text;
  private readonly acquisitionText: Phaser.GameObjects.Text;
  private readonly questText: Phaser.GameObjects.Text;
  private readonly questHeaderText: Phaser.GameObjects.Text;
  private readonly questPanel: Phaser.GameObjects.NineSlice;
  private readonly questDecorations: HudDecoration[];
  private readonly bossPanel: Phaser.GameObjects.NineSlice;
  private readonly bossTitleText: Phaser.GameObjects.Text;
  private readonly bossHpText: Phaser.GameObjects.Text;
  private readonly bossBarBack: Phaser.GameObjects.Image;
  private readonly bossBarBorder: Phaser.GameObjects.Rectangle;
  private readonly bossBarFill: Phaser.GameObjects.Rectangle;
  private readonly hpMeter: HudMeter;
  private readonly mpMeter: HudMeter;
  private readonly expMeter: HudMeter;
  private readonly skillSlots: HudSkillSlot[];
  private controlsCollapsed = false;
  private questCollapsed = false;
  private questHasContent = false;

  constructor(private readonly scene: Phaser.Scene) {
    const frame = this.createFrame();
    this.controlTexts = frame.controlTexts;
    this.controlsPanel = frame.controlsPanel;
    this.controlsHeaderDecorations = frame.controlsHeaderDecorations;
    this.controlsBodyDecorations = frame.controlsBodyDecorations;
    this.levelLabelText = frame.levelLabelText;

    const levelCenter = hudPanelCenter(HUD_PANEL_BOUNDS.level);
    this.levelText = this.scene.add
      .text(levelCenter.x, levelCenter.y + 8, "", {
        color: "#fff5b7",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH + 3);

    this.nameText = this.createText(84, 624, "", "#fff8dc", "16px", "bold");
    this.jobText = this.createText(84, 674, "", "#b9c8c8", "12px", "bold");

    this.hpMeter = this.createMeter(
      HUD_PANEL_BOUNDS.hp,
      "HP",
      0xd74444,
      0x8e2027,
    );
    this.mpMeter = this.createMeter(
      HUD_PANEL_BOUNDS.mp,
      "MP",
      0x3f83d9,
      0x174d91,
    );
    this.expMeter = this.createMeter(
      HUD_PANEL_BOUNDS.exp,
      "EXP",
      0xe2c446,
      0x99791c,
    );
    this.skillSlots = this.createSkillActionBar();

    this.mesosText = this.createText(830, 624, "", "#ffe57b", "12px", "bold");
    this.inventoryText = this.createText(830, 653, "", "#d7e0dc", "11px", "bold")
      .setLineSpacing(4);
    this.skillText = this.createText(1014, 624, "", "#d9e3df", "12px", "bold")
      .setLineSpacing(6);

    const controlsFooter = HUD_CONTENT_BOUNDS.controlsFooter;
    this.acquisitionText = this.createText(
      controlsFooter.x + 12,
      controlsFooter.y + controlsFooter.height / 2,
      "최근 획득  없음",
      "#f4df9a",
      "11px",
    )
      .setOrigin(0, 0.5)
      .setWordWrapWidth(controlsFooter.width - 24);
    const questCenter = hudPanelCenter(HUD_PANEL_BOUNDS.quest);
    this.questPanel = addNineSlicePanel(
      this.scene,
      "hud",
      questCenter.x,
      questCenter.y,
      HUD_PANEL_BOUNDS.quest.width,
      HUD_PANEL_BOUNDS.quest.height,
      HUD_DEPTH,
    )
      .setAlpha(HUD_PANEL_ALPHA.floating)
      .setVisible(false);
    const questHeader = HUD_CONTENT_BOUNDS.questHeader;
    const questBody = HUD_CONTENT_BOUNDS.questBody;
    this.questDecorations = [
      this.createHudSurface(questHeader, 0.82, 0x789092).setVisible(false),
      this.createHudSurface(questBody, 0.46, 0xb8cad0).setVisible(false),
      this.addRectangle(
        questHeader.x + 11,
        questHeader.y + questHeader.height / 2,
        5,
        5,
        0xffd65c,
        0.95,
      )
        .setDepth(HUD_DEPTH + 2)
        .setVisible(false),
    ];
    this.questHeaderText = this.createText(
      questHeader.x + 20,
      questHeader.y + questHeader.height / 2,
      "QUEST · 퀘스트 알림",
      "#fff0aa",
      "11px",
      "bold",
    )
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.questText = this.createText(
      questBody.x + 12,
      questBody.y + 7,
      "",
      "#c8fff4",
      "11px",
      "bold",
    )
      .setWordWrapWidth(questBody.width - 24)
      .setLineSpacing(4)
      .setVisible(false);

    const bossCenter = hudPanelCenter(HUD_PANEL_BOUNDS.boss);
    const bossBar = HUD_CONTENT_BOUNDS.bossBar;
    this.bossPanel = addNineSlicePanel(
      this.scene,
      "hud",
      bossCenter.x,
      bossCenter.y,
      HUD_PANEL_BOUNDS.boss.width,
      HUD_PANEL_BOUNDS.boss.height,
      HUD_DEPTH,
    )
      .setAlpha(HUD_PANEL_ALPHA.boss)
      .setVisible(false);
    this.bossTitleText = this.createText(
      bossCenter.x,
      108,
      "",
      "#ffe09a",
      "13px",
      "bold",
    )
      .setOrigin(0.5)
      .setVisible(false);
    this.bossHpText = this.createText(
      bossCenter.x,
      bossBar.y + bossBar.height / 2,
      "",
      "#f6eee0",
      "11px",
      "bold",
    )
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 4)
      .setVisible(false);
    this.bossBarBack = this.createHudSurface(bossBar, 0.96, 0x89989a)
      .setDepth(HUD_DEPTH + 1)
      .setVisible(false);
    this.bossBarBorder = this.addHudBorder(bossBar, 0x8e8a7c, 2)
      .setDepth(HUD_DEPTH + 2)
      .setVisible(false);
    this.bossBarFill = this.addRectangle(
      bossBar.x + 3,
      bossBar.y + bossBar.height / 2,
      bossBar.width - 6,
      bossBar.height - 6,
      0xe06a32,
    )
      .setOrigin(0, 0.5)
      .setDepth(HUD_DEPTH + 2)
      .setVisible(false);
  }

  update(profile: LocalProfile, nineTailsTransformationActive = false): void {
    const { character } = profile;
    const jobLabel = playerJobLabel(character.job);
    const requiredExp = expRequiredForLevel(character.level);
    const mushroomCaps = profile.inventory.mushroomCap ?? 0;
    const experienceBooks = profile.inventory.experienceBook ?? 0;
    const revivalCharms = profile.inventory.revivalCharm ?? 0;
    const ownedItemCount = sumHudIntegerValues(Object.values(profile.inventory));
    const questTracker = jobQuestTrackerText(
      character,
      profile.activeJobAdvancementQuest,
    );
    const dungeonQuestTracker = bossProgressionGuideText(
      character,
      profile.dungeonBossQuest,
    );
    const equippedStar = THROWING_STAR_CATALOG[profile.throwingStars.equipped];

    this.levelText.setText(String(character.level));
    this.setFittedText(this.nameText, character.name, 116, 16, 11);
    this.jobText.setText(jobLabel);
    this.mesosText.setText(
      `메소 ${formatHudCompactInteger(Math.floor(character.mesos))}`,
    );
    this.inventoryText.setText(
      `I 소지품 ${formatHudCompactInteger(ownedItemCount)}개\n표창 ${equippedStar.grade}등급`,
    );
    const available = new Set(unlockedAttacks(character.job));
    const skillStatus = (kind: AttackKind): string =>
      available.has(kind) && kind !== AttackKind.Basic
        ? `LV.${character.skillLevels[kind as keyof typeof character.skillLevels] ?? 0}`
        : available.has(kind)
          ? "ON"
          : "--";
    const passiveStatus = (skillId: SkillIdType): string =>
      isSkillUnlocked(skillId, character.job)
        ? `LV.${character.skillLevels[skillId]}`
        : "--";
    this.skillText.setText(
      `성장 AP ${character.statPoints} · SP ${character.skillPoints}\nK 스킬 관리`,
    );
    this.skillText.setColor(
      character.statPoints > 0 || character.skillPoints > 0
        ? "#ffe47b"
        : "#bff1a3",
    );
    const hotbarAssignments = skillHotkeyAssignments(profile.skillHotbar);
    for (const [index, slot] of this.skillSlots.entries()) {
      const assignment = hotbarAssignments[index];
      if (assignment && assignment.skillId !== slot.skillId) {
        slot.skillId = assignment.skillId;
        slot.icon.setTexture(ACTIVE_SKILL_ICON_KEYS[assignment.skillId]);
      }
      const unlocked = isSkillUnlocked(slot.skillId, character.job);
      const transformationActive =
        slot.skillId === SkillId.NineTailsTransformation &&
        nineTailsTransformationActive;
      slot.icon.clearTint().setAlpha(unlocked ? 1 : 0.26);
      if (!unlocked) slot.icon.setTint(0x566268);
      slot.background
        .clearTint()
        .setTint(
          transformationActive ? 0xd9b657 : unlocked ? 0x91aaa9 : 0x46565c,
        )
        .setAlpha(unlocked ? 0.98 : 0.76);
      slot.frame
        .setFillStyle(0x000000, 0)
        .setStrokeStyle(
          2,
          transformationActive ? 0xffd35b : unlocked ? 0x91aaa9 : 0x354248,
        );
      slot.hotkeySurface
        .clearTint()
        .setTint(
          transformationActive ? 0xcaa451 : unlocked ? 0x8ea3a6 : 0x47575c,
        )
        .setAlpha(unlocked ? 0.98 : 0.74);
      slot.hotkeyBack.setFillStyle(0x000000, 0);
      slot.hotkeyText.setColor(unlocked ? "#fff5bd" : "#6c7779");
    }
    const questNotices = [dungeonQuestTracker, questTracker].filter(
      (notice): notice is string => Boolean(notice),
    );
    const questVisible = questNotices.length > 0;
    this.questHasContent = questVisible;
    setHudWindowControlVisible("quest", questVisible);
    this.questPanel.setVisible(questVisible);
    this.questDecorations[0]?.setVisible(questVisible);
    this.questDecorations[1]?.setVisible(questVisible && !this.questCollapsed);
    this.questDecorations[2]?.setVisible(questVisible);
    this.questHeaderText.setVisible(questVisible);
    this.questText
      .setText(questNotices.join("\n"))
      .setVisible(questVisible && !this.questCollapsed);

    this.updateMeter(this.hpMeter, character.hp, character.maxHp);
    this.updateMeter(this.mpMeter, character.mp, character.maxMp);
    this.updateMeter(this.expMeter, profile.exp, requiredExp);

    const assignedSkillSummary = this.skillSlots
      .map(
        ({ hotkey, skillId }) =>
          `${hotkey} ${SKILL_DEFINITIONS[skillId].label} ${
            isSkillUnlocked(skillId, character.job)
              ? `LV.${character.skillLevels[skillId]}`
              : "잠김"
          }`,
      )
      .join(", ");
    this.scene.game.canvas.setAttribute(
      "data-hud-skill-slots",
      this.skillSlots.map(({ hotkey, skillId }) => `${hotkey}:${skillId}`).join(","),
    );
    this.scene.game.canvas.setAttribute(
      "data-hud-skill-icon-count",
      String(this.skillSlots.length),
    );
    this.scene.game.canvas.setAttribute(
      "aria-label",
      `${character.name}, 레벨 ${character.level} ${jobLabel}, HP ${character.hp}/${character.maxHp}, MP ${character.mp}/${character.maxMp}, 경험치 ${profile.exp}/${requiredExp}, STR ${character.stats.str}, DEX ${character.stats.dex}, INT ${character.stats.int}, LUK ${character.stats.luk}, 남은 AP ${character.statPoints}, 남은 SP ${character.skillPoints}, 자동분배 ${character.autoAllocateStats ? "켜짐" : "꺼짐"}, 메소 ${character.mesos}, 소지품 총수량 ${ownedItemCount}개, 초록버섯의 갓 ${mushroomCaps}개, 경험의 서 ${experienceBooks}개, 부활의 부적 ${revivalCharms}개, 장착 표창 ${equippedStar.name} ${equippedStar.grade}등급, 던전 원정 ${dungeonQuestTracker ?? "없음"}, 전직 시험 ${questTracker ?? "없음"}, 스킬 슬롯 ${assignedSkillSummary}, ${ATTACK_DEFINITIONS[AttackKind.LuckySeven].label} ${skillStatus(AttackKind.LuckySeven)}, ${ATTACK_DEFINITIONS[AttackKind.ShadowVolley].label} ${skillStatus(AttackKind.ShadowVolley)}, ${ATTACK_DEFINITIONS[AttackKind.Drain].label} ${skillStatus(AttackKind.Drain)}, ${ATTACK_DEFINITIONS[AttackKind.PhantomStars].label} ${skillStatus(AttackKind.PhantomStars)}, ${ATTACK_DEFINITIONS[AttackKind.Avenger].label} ${skillStatus(AttackKind.Avenger)}, ${ATTACK_DEFINITIONS[AttackKind.AbyssRain].label} ${skillStatus(AttackKind.AbyssRain)}, 나선환 LV.${character.skillLevels.rasengan}, 구미호 변신 LV.${character.skillLevels.nineTailsTransformation} ${nineTailsTransformationActive ? "켜짐" : "꺼짐"}, 미수옥 LV.${character.skillLevels.tailedBeastBomb}, 삼인 협공 LV.${character.skillLevels.teamAssault}, ${ATTACK_DEFINITIONS[AttackKind.ThunderOrb].label} ${skillStatus(AttackKind.ThunderOrb)}, 예리한 시야 ${passiveStatus(SkillId.KeenSight)}, 치명 투척 ${passiveStatus(SkillId.CriticalThrow)}, 그림자 호흡 ${passiveStatus(SkillId.ShadowBreathing)}, 선인모드 ${passiveStatus(SkillId.SageMode)}`,
    );
  }

  updateBoss(state?: BossHudState): void {
    const visible = Boolean(state);
    this.bossPanel.setVisible(visible);
    this.bossTitleText.setVisible(visible);
    this.bossHpText.setVisible(visible);
    this.bossBarBack.setVisible(visible);
    this.bossBarBorder.setVisible(visible);
    this.bossBarFill.setVisible(visible);
    if (!state) return;

    const rankLabel =
      state.rank === "finalboss"
        ? "최종보스"
        : state.rank === "upperboss"
          ? "상위보스"
          : "중간보스";
    const currentHp = Math.max(0, Math.min(state.currentHp, state.maxHp));
    const ratio = currentHp / Math.max(1, state.maxHp);
    this.bossTitleText.setText(
      `${rankLabel} · ${state.name}${state.phase ? ` · ${state.phase}페이즈` : ""}`,
    );
    this.bossHpText.setText(
      state.alive
        ? `${currentHp.toLocaleString("ko-KR")} / ${state.maxHp.toLocaleString("ko-KR")}`
        : "처치 완료",
    );
    this.bossBarFill
      .setFillStyle(
        state.rank === "finalboss"
          ? 0xd94b3d
          : state.rank === "upperboss"
            ? 0x8c61d8
            : 0xe06a32,
      )
      .setDisplaySize((HUD_CONTENT_BOUNDS.bossBar.width - 6) * ratio, 10)
      .setVisible(state.alive && ratio > 0);
  }

  showAcquisition(summary: string): void {
    this.acquisitionText.setText(`최근 획득  ${summary}`);
  }

  setFloatingPanelCollapsed(
    panel: Extract<HudFloatingPanel, "controls" | "quest">,
    collapsed: boolean,
  ): void {
    if (panel === "controls") {
      this.controlsCollapsed = collapsed;
      const bounds = HUD_PANEL_BOUNDS.controls;
      const layout = hudFloatingPanelLayout(bounds, collapsed);
      const headerCenterY =
        HUD_CONTENT_BOUNDS.controlsHeader.y +
        HUD_CONTENT_BOUNDS.controlsHeader.height / 2 +
        layout.headerShiftY;
      this.controlsPanel
        .setSize(bounds.width, layout.height)
        .setPosition(bounds.x + bounds.width / 2, layout.centerY);
      for (const decoration of this.controlsHeaderDecorations) {
        decoration.setY(headerCenterY);
      }
      this.controlTexts[0]?.setY(headerCenterY);
      for (const decoration of this.controlsBodyDecorations) {
        decoration.setVisible(!collapsed);
      }
      this.acquisitionText.setVisible(!collapsed);
      for (const text of this.controlTexts.slice(1)) text.setVisible(!collapsed);
      return;
    }

    this.questCollapsed = collapsed;
    const bounds = HUD_PANEL_BOUNDS.quest;
    const layout = hudFloatingPanelLayout(bounds, collapsed);
    const headerCenterY =
      HUD_CONTENT_BOUNDS.questHeader.y +
      HUD_CONTENT_BOUNDS.questHeader.height / 2 +
      layout.headerShiftY;
    this.questPanel
      .setSize(bounds.width, layout.height)
      .setPosition(bounds.x + bounds.width / 2, layout.centerY);
    this.questDecorations[0]?.setY(headerCenterY);
    this.questDecorations[2]?.setY(headerCenterY);
    this.questHeaderText.setY(headerCenterY);
    this.questDecorations[1]?.setVisible(this.questHasContent && !collapsed);
    this.questText.setVisible(this.questHasContent && !collapsed);
  }

  paddingViolations(): string[] {
    const violations: string[] = [];
    const audit = (
      group: string,
      panel: HudRectangle,
      texts: readonly Phaser.GameObjects.Text[],
      padding?: HudPadding,
    ): void => {
      for (const [index, text] of texts.entries()) {
        if (!text.visible) continue;
        const bounds = text.getBounds();
        const item: HudTextAudit = {
          panel,
          padding,
          text: {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
          },
        };
        if (countHudPaddingViolations([item]) > 0) {
          violations.push(`${group}:${index}`);
        }
      }
    };

    audit(
      "controls",
      hudFloatingPanelBounds(HUD_PANEL_BOUNDS.controls, this.controlsCollapsed),
      [...this.controlTexts, this.acquisitionText],
      this.controlsCollapsed ? HUD_COLLAPSED_SAFE_PADDING : undefined,
    );
    audit(
      "quest",
      hudFloatingPanelBounds(HUD_PANEL_BOUNDS.quest, this.questCollapsed),
      [this.questHeaderText, this.questText],
      this.questCollapsed ? HUD_COLLAPSED_SAFE_PADDING : undefined,
    );
    audit("boss", HUD_PANEL_BOUNDS.boss, [this.bossTitleText, this.bossHpText]);
    if (
      this.bossTitleText.visible &&
      this.bossHpText.visible &&
      hudTextBoundsConflict(
        this.bossTitleText.getBounds(),
        this.bossHpText.getBounds(),
        8,
      )
    ) {
      violations.push("boss:label-gap");
    }
    audit("bottom", HUD_PANEL_BOUNDS.bottom, [this.levelLabelText]);
    audit(
      "identity",
      HUD_PANEL_BOUNDS.identity,
      [this.nameText, this.jobText],
      HUD_INNER_CELL_PADDING,
    );
    audit(
      "hp",
      HUD_PANEL_BOUNDS.hp,
      [this.hpMeter.label, this.hpMeter.value],
      HUD_METER_CELL_PADDING,
    );
    audit(
      "mp",
      HUD_PANEL_BOUNDS.mp,
      [this.mpMeter.label, this.mpMeter.value],
      HUD_METER_CELL_PADDING,
    );
    audit(
      "exp",
      HUD_PANEL_BOUNDS.exp,
      [this.expMeter.label, this.expMeter.value],
      HUD_METER_CELL_PADDING,
    );
    audit(
      "currency",
      HUD_PANEL_BOUNDS.currency,
      [this.mesosText, this.inventoryText],
      HUD_INNER_CELL_PADDING,
    );
    audit(
      "growth",
      HUD_PANEL_BOUNDS.growth,
      [this.skillText],
      HUD_INNER_CELL_PADDING,
    );
    audit(
      "action-bar",
      HUD_PANEL_BOUNDS.actionBar,
      this.skillSlots.map(({ hotkeyText }) => hotkeyText),
      { x: 0, y: 0 },
    );
    audit(
      "level",
      HUD_PANEL_BOUNDS.level,
      [this.levelText],
      { x: 6, y: 8 },
    );

    return violations;
  }

  private createFrame(): {
    controlTexts: Phaser.GameObjects.Text[];
    controlsPanel: Phaser.GameObjects.NineSlice;
    controlsHeaderDecorations: HudDecoration[];
    controlsBodyDecorations: HudDecoration[];
    levelLabelText: Phaser.GameObjects.Text;
  } {
    const bottomBounds = HUD_PANEL_BOUNDS.bottom;
    const bottomCenter = hudPanelCenter(bottomBounds);
    addNineSlicePanel(
      this.scene,
      "hud",
      bottomCenter.x,
      bottomCenter.y,
      bottomBounds.width,
      bottomBounds.height,
      HUD_DEPTH,
    ).setAlpha(HUD_PANEL_ALPHA.bottom);
    this.addRectangle(
      bottomCenter.x,
      bottomBounds.y + 3,
      bottomBounds.width,
      4,
      0xc8d3ce,
      0.9,
    ).setDepth(HUD_DEPTH + 1);
    this.addRectangle(
      bottomCenter.x,
      bottomBounds.y + 7,
      bottomBounds.width,
      2,
      0x324852,
      0.96,
    ).setDepth(HUD_DEPTH + 1);

    const controlsCenter = hudPanelCenter(HUD_PANEL_BOUNDS.controls);
    const controlsPanel = addNineSlicePanel(
      this.scene,
      "hud",
      controlsCenter.x,
      controlsCenter.y,
      HUD_PANEL_BOUNDS.controls.width,
      HUD_PANEL_BOUNDS.controls.height,
      HUD_DEPTH,
    ).setAlpha(HUD_PANEL_ALPHA.floating);
    const controlsHeaderBounds = HUD_CONTENT_BOUNDS.controlsHeader;
    const controlsBodyBounds = HUD_CONTENT_BOUNDS.controlsBody;
    const controlsFooterBounds = HUD_CONTENT_BOUNDS.controlsFooter;
    const controlsHeader = this.createHudSurface(
      controlsHeaderBounds,
      0.82,
      0x789092,
    );
    const controlsHeaderBorder = this.addHudBorder(
      controlsHeaderBounds,
      0xb8c6c2,
      1,
      0.58,
    ).setDepth(HUD_DEPTH + 2);
    const controlsBody = this.createHudSurface(
      controlsBodyBounds,
      0.42,
      0xb8cad0,
    );
    const controlsFooter = this.createHudSurface(
      controlsFooterBounds,
      0.54,
      0xc2d0d2,
    );
    const controlsHeaderIndicator = this.addRectangle(
      controlsHeaderBounds.x + 13,
      controlsHeaderBounds.y + controlsHeaderBounds.height / 2,
      5,
      5,
      0x70d5e8,
      0.95,
    ).setDepth(HUD_DEPTH + 2);
    const controlTexts = [
      this.createText(
        controlsHeaderBounds.x + 24,
        controlsHeaderBounds.y + controlsHeaderBounds.height / 2,
        "GUIDE · 조작 안내",
        "#eaf4ef",
        "11px",
        "bold",
      ).setOrigin(0, 0.5),
      this.createText(838, 52, "[← →] 이동   [ALT] 점프   [↓+ALT] 하강", "#f2f7f3", "11px", "bold"),
      this.createText(838, 75, "[CTRL] 공격   [↑] 포탈/대화   [Z] 줍기   [I] 가방", "#f2f7f3", "11px", "bold"),
      this.createText(838, 98, "[1~0/-] 스킬   [Shift/QWER/ASDF/XCV] 배치   [ESC] 메뉴", "#f2f7f3", "11px", "bold"),
    ];
    const controlsDivider = this.addRectangle(
      controlsFooterBounds.x + controlsFooterBounds.width / 2,
      controlsFooterBounds.y - 4,
      controlsFooterBounds.width,
      1,
      0x9fb4b3,
      0.72,
    ).setDepth(HUD_DEPTH + 1);

    this.addHudCell(HUD_PANEL_BOUNDS.identity);
    this.addHudCell(HUD_PANEL_BOUNDS.hp);
    this.addHudCell(HUD_PANEL_BOUNDS.mp);
    this.addHudCell(HUD_PANEL_BOUNDS.exp);
    this.addHudCell(HUD_PANEL_BOUNDS.currency);
    this.addHudCell(HUD_PANEL_BOUNDS.growth);
    const levelCenter = hudPanelCenter(HUD_PANEL_BOUNDS.level);
    this.createHudSurface(HUD_PANEL_BOUNDS.level, 0.98, 0x789092).setDepth(
      HUD_DEPTH + 2,
    );
    this.addHudBorder(HUD_PANEL_BOUNDS.level, 0xc9c6aa, 2).setDepth(
      HUD_DEPTH + 3,
    );
    const levelLabelText = this.createText(
      levelCenter.x,
      HUD_PANEL_BOUNDS.level.y + 10,
      "LV",
      "#d7d7c7",
      "10px",
      "bold",
    ).setOrigin(0.5);
    return {
      controlTexts,
      controlsPanel,
      controlsHeaderDecorations: [
        controlsHeader,
        controlsHeaderBorder,
        controlsHeaderIndicator,
      ],
      controlsBodyDecorations: [controlsBody, controlsFooter, controlsDivider],
      levelLabelText,
    };
  }

  private createMeter(
    bounds: HudRectangle,
    label: string,
    brightColor: number,
    darkColor: number,
  ): HudMeter {
    const left = bounds.x + HUD_METER_CELL_PADDING.x;
    const width = bounds.width - HUD_METER_CELL_PADDING.x * 2;
    const y = bounds.y + 28;
    const labelText = this.createText(
      left,
      bounds.y + HUD_METER_CELL_PADDING.y,
      label,
      "#e9e9da",
      "10px",
      "bold",
    );
    const meterTrack = {
      x: left,
      y: y - 8,
      width,
      height: 16,
    };
    this.createHudSurface(meterTrack, 0.98, 0x68787c).setDepth(HUD_DEPTH + 2);
    this.addHudBorder(meterTrack, 0x9b9f94, 2).setDepth(HUD_DEPTH + 3);
    const fill = this.addRectangle(left + 3, y, width - 6, 10, darkColor)
      .setOrigin(0, 0.5)
      .setDepth(HUD_DEPTH + 4);
    const highlight = this.addRectangle(left + 3, y - 3, width - 6, 2, brightColor, 0.8)
      .setOrigin(0, 0.5)
      .setDepth(HUD_DEPTH + 5);
    const value = this.createText(left + width / 2, y, "", "#ffffff", "11px", "bold")
      .setOrigin(0.5)
      .setDepth(HUD_DEPTH + 6);

    return { fill, highlight, label: labelText, value, width: width - 6 };
  }

  private createSkillActionBar(): HudSkillSlot[] {
    const bounds = HUD_PANEL_BOUNDS.actionBar;
    const slotSize = 38;
    const gap = 3;
    const assignments = skillHotkeyAssignments();
    const totalWidth = assignments.length * slotSize + (assignments.length - 1) * gap;
    const startX = bounds.x + (bounds.width - totalWidth) / 2 + slotSize / 2;
    const centerY = bounds.y + bounds.height / 2;

    this.createHudSurface(bounds, 0.96, 0x7f9295).setDepth(HUD_DEPTH + 2);
    this.addHudBorder(bounds, 0x9aabaa, 2, 0.9).setDepth(HUD_DEPTH + 3);

    return assignments.map(({ hotkey, skillId }, index) => {
      const x = startX + index * (slotSize + gap);
      const slotBounds = {
        x: x - slotSize / 2,
        y: centerY - slotSize / 2,
        width: slotSize,
        height: slotSize,
      };
      const background = addNineSlicePanel(
        this.scene,
        "hud",
        x,
        centerY,
        slotSize,
        slotSize,
        HUD_DEPTH + 4,
      );
      const frame = this.addRectangle(x, centerY, slotSize, slotSize, 0x000000, 0)
        .setStrokeStyle(2, 0x91aaa9)
        .setDepth(HUD_DEPTH + 5);
      const icon = this.scene.add
        .image(x, centerY, ACTIVE_SKILL_ICON_KEYS[skillId])
        .setDisplaySize(34, 34)
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH + 6);
      const hotkeyBounds = {
        x: slotBounds.x,
        y: slotBounds.y,
        width: 14,
        height: 13,
      };
      const hotkeySurface = this.createHudSurface(
        hotkeyBounds,
        0.98,
        0xb4c5c7,
      ).setDepth(HUD_DEPTH + 7);
      const hotkeyBack = this.addRectangle(
        hotkeyBounds.x + hotkeyBounds.width / 2,
        hotkeyBounds.y + hotkeyBounds.height / 2,
        hotkeyBounds.width,
        hotkeyBounds.height,
        0x000000,
        0,
      )
        .setStrokeStyle(1, 0xb5c5bd)
        .setDepth(HUD_DEPTH + 8);
      const hotkeyText = this.createText(
        hotkeyBounds.x + hotkeyBounds.width / 2,
        hotkeyBounds.y + hotkeyBounds.height / 2,
        hotkey,
        "#fff5bd",
        "10px",
        "bold",
      )
        .setOrigin(0.5)
        .setDepth(HUD_DEPTH + 9);

      return {
        skillId,
        hotkey,
        background,
        frame,
        icon,
        hotkeySurface,
        hotkeyBack,
        hotkeyText,
      };
    });
  }

  private updateMeter(meter: HudMeter, current: number, maximum: number): void {
    const safeMaximum = Math.max(1, maximum);
    const safeCurrent = Math.max(0, Math.min(current, safeMaximum));
    const ratio = safeCurrent / safeMaximum;
    meter.fill.setDisplaySize(meter.width * ratio, 10).setVisible(ratio > 0);
    meter.highlight.setDisplaySize(meter.width * ratio, 2).setVisible(ratio > 0);
    meter.value.setText(
      formatHudMeterValue(Math.floor(safeCurrent), Math.floor(safeMaximum)),
    );
  }

  private createText(
    x: number,
    y: number,
    text: string,
    color: string,
    fontSize: string,
    fontStyle?: string,
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, {
        color,
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize,
        fontStyle,
      })
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH + 2);
  }

  private setFittedText(
    text: Phaser.GameObjects.Text,
    value: string,
    maximumWidth: number,
    maximumFontSize: number,
    minimumFontSize: number,
  ): void {
    text.setText(value).setFontSize(maximumFontSize);
    if (text.width <= maximumWidth) return;
    const fittedSize = Math.max(
      minimumFontSize,
      Math.floor(maximumFontSize * (maximumWidth / text.width)),
    );
    text.setFontSize(fittedSize);
  }

  private createHudSurface(
    bounds: HudRectangle,
    alpha: number,
    tint: number,
  ): Phaser.GameObjects.Image {
    const center = hudPanelCenter(bounds);
    return addHudSurface(
      this.scene,
      center.x,
      center.y,
      bounds.width,
      bounds.height,
      HUD_DEPTH + 1,
    )
      .setTint(tint)
      .setAlpha(alpha);
  }

  private addHudBorder(
    bounds: HudRectangle,
    color: number,
    lineWidth: number,
    alpha = 1,
  ): Phaser.GameObjects.Rectangle {
    const center = hudPanelCenter(bounds);
    return this.addRectangle(
      center.x,
      center.y,
      bounds.width,
      bounds.height,
      0x000000,
      0,
    ).setStrokeStyle(lineWidth, color, alpha);
  }

  private addHudCell(bounds: HudRectangle): Phaser.GameObjects.Image {
    const surface = this.createHudSurface(bounds, 0.86, 0x718488);
    this.addHudBorder(bounds, 0x6f8587, 2, 0.9).setDepth(HUD_DEPTH + 2);
    return surface;
  }

  private addRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    alpha = 1,
  ): Phaser.GameObjects.Rectangle {
    return this.scene.add
      .rectangle(x, y, width, height, color, alpha)
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH);
  }
}

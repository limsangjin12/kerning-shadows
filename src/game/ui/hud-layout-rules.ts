export interface HudRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HudPadding {
  x: number;
  y: number;
}

export interface HudTextBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface HudTextAudit {
  panel: HudRectangle;
  text: HudTextBounds;
  padding?: HudPadding;
}

export interface MiniMapProjection {
  scale: number;
  offsetX: number;
  offsetY: number;
  worldWidth: number;
  worldHeight: number;
}

export const HUD_SAFE_PADDING: HudPadding = {
  x: 18,
  y: 16,
};

export const HUD_INNER_CELL_PADDING: HudPadding = {
  x: 12,
  y: 8,
};

export const HUD_METER_CELL_PADDING: HudPadding = {
  x: 12,
  y: 6,
};

export const HUD_PANEL_BOUNDS = {
  miniMap: { x: 12, y: 6, width: 320, height: 218 },
  controls: { x: 808, y: 6, width: 460, height: 158 },
  quest: { x: 18, y: 232, width: 404, height: 124 },
  boss: { x: 435, y: 82, width: 370, height: 82 },
  bottom: { x: 0, y: 596, width: 1280, height: 124 },
  identity: { x: 18, y: 612, width: 194, height: 92 },
  hp: { x: 220, y: 662, width: 190, height: 42 },
  mp: { x: 420, y: 662, width: 190, height: 42 },
  exp: { x: 620, y: 662, width: 190, height: 42 },
  actionBar: { x: 281, y: 612, width: 468, height: 44 },
  currency: { x: 818, y: 612, width: 176, height: 92 },
  growth: { x: 1002, y: 612, width: 260, height: 92 },
  level: { x: 26, y: 626, width: 48, height: 64 },
} as const satisfies Record<string, HudRectangle>;

export const HUD_COLLAPSED_PANEL_HEIGHT = 36;
export const HUD_COLLAPSED_HEADER_SHIFT_Y = -8;
export const HUD_COLLAPSED_SAFE_PADDING: HudPadding = { x: 18, y: 8 };

export const HUD_CONTENT_BOUNDS = {
  miniMapHeader: { x: 28, y: 22, width: 288, height: 20 },
  miniMapInfo: { x: 28, y: 46, width: 288, height: 40 },
  miniMapBody: { x: 28, y: 90, width: 288, height: 116 },
  controlsHeader: { x: 826, y: 22, width: 424, height: 20 },
  controlsBody: { x: 826, y: 46, width: 424, height: 72 },
  controlsFooter: { x: 826, y: 126, width: 424, height: 22 },
  questHeader: { x: 36, y: 248, width: 368, height: 20 },
  questBody: { x: 36, y: 272, width: 368, height: 68 },
  bossBar: { x: 453, y: 126, width: 334, height: 16 },
} as const satisfies Record<string, HudRectangle>;

export const GAMEPLAY_WORLD_LIFT = 48;

const HUD_COMPACT_INTEGER_UNITS = [
  { threshold: 10_000_000_000_000_000n, label: "경" },
  { threshold: 1_000_000_000_000n, label: "조" },
  { threshold: 100_000_000n, label: "억" },
  { threshold: 10_000n, label: "만" },
] as const;

export function gameplayCameraBoundsHeight(worldHeight: number): number {
  return worldHeight + GAMEPLAY_WORLD_LIFT;
}

export function sumHudIntegerValues(values: readonly number[]): bigint {
  return values.reduce(
    (total, value) =>
      total + (Number.isSafeInteger(value) ? BigInt(value) : 0n),
    0n,
  );
}

export function formatHudCompactInteger(value: number | bigint): string {
  const integer =
    typeof value === "bigint"
      ? value
      : Number.isSafeInteger(value)
        ? BigInt(value)
        : 0n;
  const sign = integer < 0n ? "-" : "";
  const magnitude = integer < 0n ? -integer : integer;
  const unit = HUD_COMPACT_INTEGER_UNITS.find(
    ({ threshold }) => magnitude >= threshold,
  );
  if (!unit) {
    return integer.toLocaleString("ko-KR");
  }

  const whole = magnitude / unit.threshold;
  const decimal = ((magnitude % unit.threshold) * 10n) / unit.threshold;
  return `${sign}${whole.toLocaleString("ko-KR")}${decimal > 0n ? `.${decimal}` : ""}${unit.label}`;
}

export function formatHudMeterValue(current: number, maximum: number): string {
  return `${formatHudCompactInteger(current)} / ${formatHudCompactInteger(maximum)}`;
}

export function hudPanelCenter(panel: HudRectangle): { x: number; y: number } {
  return {
    x: panel.x + panel.width / 2,
    y: panel.y + panel.height / 2,
  };
}

export function hudFloatingPanelLayout(
  panel: HudRectangle,
  collapsed: boolean,
): { height: number; centerY: number; headerShiftY: number } {
  const height = collapsed ? HUD_COLLAPSED_PANEL_HEIGHT : panel.height;
  return {
    height,
    centerY: panel.y + height / 2,
    headerShiftY: collapsed ? HUD_COLLAPSED_HEADER_SHIFT_Y : 0,
  };
}

export function hudFloatingPanelBounds(
  panel: HudRectangle,
  collapsed: boolean,
): HudRectangle {
  return {
    ...panel,
    height: hudFloatingPanelLayout(panel, collapsed).height,
  };
}

export function miniMapProjection(
  worldWidth: number,
  worldHeight: number,
  viewport: HudRectangle,
  padding = 8,
): MiniMapProjection {
  const safeWorldWidth = Math.max(1, worldWidth);
  const safeWorldHeight = Math.max(1, worldHeight);
  const safePadding = Math.max(0, padding);
  const availableWidth = Math.max(1, viewport.width - safePadding * 2);
  const availableHeight = Math.max(1, viewport.height - safePadding * 2);
  const scale = Math.min(
    availableWidth / safeWorldWidth,
    availableHeight / safeWorldHeight,
  );
  const contentWidth = safeWorldWidth * scale;
  const contentHeight = safeWorldHeight * scale;
  return {
    scale,
    offsetX: viewport.x + (viewport.width - contentWidth) / 2,
    offsetY: viewport.y + (viewport.height - contentHeight) / 2,
    worldWidth: safeWorldWidth,
    worldHeight: safeWorldHeight,
  };
}

export function projectMiniMapPoint(
  point: { x: number; y: number },
  projection: MiniMapProjection,
): { x: number; y: number } {
  const x = Math.max(0, Math.min(projection.worldWidth, point.x));
  const y = Math.max(0, Math.min(projection.worldHeight, point.y));
  return {
    x: projection.offsetX + x * projection.scale,
    y: projection.offsetY + y * projection.scale,
  };
}

export function hudRectangleFitsPanel(
  rectangle: HudRectangle,
  panel: HudRectangle,
  padding: HudPadding = { x: 0, y: 0 },
): boolean {
  return (
    rectangle.x >= panel.x + padding.x &&
    rectangle.y >= panel.y + padding.y &&
    rectangle.x + rectangle.width <= panel.x + panel.width - padding.x &&
    rectangle.y + rectangle.height <= panel.y + panel.height - padding.y
  );
}

export function hudRectanglesConflict(
  first: HudRectangle,
  second: HudRectangle,
  minimumGap = 0,
): boolean {
  const gap = Math.max(0, minimumGap);
  return (
    first.x < second.x + second.width + gap &&
    first.x + first.width + gap > second.x &&
    first.y < second.y + second.height + gap &&
    first.y + first.height + gap > second.y
  );
}

export function hudTextFitsPanel(
  text: HudTextBounds,
  panel: HudRectangle,
  padding: HudPadding = HUD_SAFE_PADDING,
): boolean {
  const safeLeft = panel.x + padding.x;
  const safeTop = panel.y + padding.y;
  const safeRight = panel.x + panel.width - padding.x;
  const safeBottom = panel.y + panel.height - padding.y;

  return (
    text.left >= safeLeft &&
    text.top >= safeTop &&
    text.right <= safeRight &&
    text.bottom <= safeBottom
  );
}

export function hudTextBoundsConflict(
  first: HudTextBounds,
  second: HudTextBounds,
  minimumGap = 0,
): boolean {
  const gap = Math.max(0, minimumGap);
  return (
    first.left < second.right + gap &&
    first.right + gap > second.left &&
    first.top < second.bottom + gap &&
    first.bottom + gap > second.top
  );
}

export function countHudPaddingViolations(audits: readonly HudTextAudit[]): number {
  return audits.filter(
    ({ panel, text, padding }) => !hudTextFitsPanel(text, panel, padding),
  ).length;
}

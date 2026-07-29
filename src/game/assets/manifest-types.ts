export interface SpriteAnimationDefinition {
  frames: number[];
  frameDurationMs: number;
  repeat: number;
}

export interface SpriteSheetDefinition {
  image: string;
  sourceImage: string;
  facing?: "left" | "right";
  flipForLeft?: boolean;
  origin: {
    x: number;
    y: number;
  };
  frameOrigins: Record<
    string,
    {
      x: number;
      y: number;
    }
  >;
  animations: Record<string, SpriteAnimationDefinition>;
}

export interface SpriteManifest {
  schemaVersion: number;
  sheetDefaults: {
    width: number;
    height: number;
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
    indexOrder: "row-major";
    filter: "nearest";
    trimmed: boolean;
    rotated: boolean;
  };
  sheets: Record<string, SpriteSheetDefinition>;
}

export interface RuntimeSpriteSheet {
  key: string;
  url: string;
  definition: SpriteSheetDefinition;
}

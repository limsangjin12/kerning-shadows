import { readdirSync, readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import manifestJson from "../../../assets/sprites/sprite-manifest.json";
import { describe, expect, it } from "vitest";
import { validateSpriteManifest } from "./manifest-validation";

interface DecodedPng {
  width: number;
  height: number;
  pixels: Uint8Array;
}

interface LosslessWebpHeader {
  width: number;
  height: number;
  alphaUsed: boolean;
}

interface FramePixelStats {
  opaquePixels: number;
  maxY: number;
  weightedCenterX: number;
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const VISIBLE_ALPHA_THRESHOLD = 16;
const PLAYER_SHEETS = [
  "player",
  "playerRogue",
  "playerAssassin",
  "playerHermit",
  "playerHokage",
] as const;
const MONSTER_SHEETS = [
  "greenMushroom",
  "shadowSentinel",
  "abyssGolem",
  "plagueZombie",
  "moonWolf",
  "ancientTreant",
  "emberWarden",
  "eclipseArchivist",
  "onePunchMan",
] as const;
const GROUNDED_SHEETS = [
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
  "duaPet",
] as const;

function parseLosslessWebpHeader(file: URL): LosslessWebpHeader {
  const webp = readFileSync(file);
  if (
    webp.length < 25 ||
    webp.toString("ascii", 0, 4) !== "RIFF" ||
    webp.toString("ascii", 8, 12) !== "WEBP" ||
    webp.toString("ascii", 12, 16) !== "VP8L" ||
    webp[20] !== 0x2f
  ) {
    throw new Error(`Runtime sprite is not a lossless WebP: ${file.pathname}`);
  }

  const bits = webp.readUInt32LE(21);
  if (bits >>> 29 !== 0) {
    throw new Error(`Runtime sprite uses an unsupported WebP version: ${file.pathname}`);
  }

  return {
    width: (bits & 0x3fff) + 1,
    height: ((bits >>> 14) & 0x3fff) + 1,
    alphaUsed: ((bits >>> 28) & 1) === 1,
  };
}

function paethPredictor(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function decodePng(file: URL): DecodedPng {
  const png = readFileSync(file);
  expect(png.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = Buffer.alloc(0);
  let paletteAlpha = Buffer.alloc(0);
  const imageData: Buffer[] = [];

  for (let offset = PNG_SIGNATURE.length; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8] ?? 0;
      colorType = data[9] ?? 0;
      interlace = data[12] ?? 0;
    } else if (type === "PLTE") {
      palette = data;
    } else if (type === "tRNS") {
      paletteAlpha = data;
    } else if (type === "IDAT") {
      imageData.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (
    width <= 0 ||
    height <= 0 ||
    interlace !== 0 ||
    (colorType !== 3 && colorType !== 6) ||
    (bitDepth !== 4 && bitDepth !== 8)
  ) {
    throw new Error(
      `Unsupported runtime PNG contract: ${width}x${height}, depth=${bitDepth}, ` +
        `colorType=${colorType}, interlace=${interlace}.`,
    );
  }
  if (colorType === 6 && bitDepth !== 8) {
    throw new Error("RGBA runtime sprites must use 8-bit channels.");
  }

  const scanlineBytes =
    colorType === 6 ? width * 4 : Math.ceil((width * bitDepth) / 8);
  const filterBytesPerPixel = colorType === 6 ? 4 : 1;
  const inflated = inflateSync(Buffer.concat(imageData));
  const rows: Uint8Array[] = [];
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset] ?? -1;
    sourceOffset += 1;
    const row = new Uint8Array(scanlineBytes);
    const previous = rows[y - 1];
    for (let x = 0; x < scanlineBytes; x += 1) {
      const encoded = inflated[sourceOffset] ?? 0;
      sourceOffset += 1;
      const left = x >= filterBytesPerPixel ? (row[x - filterBytesPerPixel] ?? 0) : 0;
      const up = previous?.[x] ?? 0;
      const upperLeft =
        x >= filterBytesPerPixel
          ? (previous?.[x - filterBytesPerPixel] ?? 0)
          : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? Math.floor((left + up) / 2)
                : filter === 4
                  ? paethPredictor(left, up, upperLeft)
                  : Number.NaN;
      if (!Number.isFinite(predictor)) {
        throw new Error(`Unsupported PNG scanline filter: ${filter}.`);
      }
      row[x] = (encoded + predictor) & 0xff;
    }
    rows.push(row);
  }

  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const row = rows[y]!;
    for (let x = 0; x < width; x += 1) {
      const destination = (y * width + x) * 4;
      if (colorType === 6) {
        const source = x * 4;
        pixels[destination] = row[source] ?? 0;
        pixels[destination + 1] = row[source + 1] ?? 0;
        pixels[destination + 2] = row[source + 2] ?? 0;
        pixels[destination + 3] = row[source + 3] ?? 0;
        continue;
      }

      const packed = row[Math.floor((x * bitDepth) / 8)] ?? 0;
      const paletteIndex =
        bitDepth === 8 ? packed : x % 2 === 0 ? packed >> 4 : packed & 0x0f;
      pixels[destination] = palette[paletteIndex * 3] ?? 0;
      pixels[destination + 1] = palette[paletteIndex * 3 + 1] ?? 0;
      pixels[destination + 2] = palette[paletteIndex * 3 + 2] ?? 0;
      pixels[destination + 3] = paletteAlpha[paletteIndex] ?? 255;
    }
  }

  return { width, height, pixels };
}

function pixelOffset(image: DecodedPng, x: number, y: number): number {
  return (y * image.width + x) * 4;
}

function alphaAt(image: DecodedPng, x: number, y: number): number {
  return image.pixels[pixelOffset(image, x, y) + 3] ?? 0;
}

function framePixelStats(
  image: DecodedPng,
  frame: number,
  frameWidth: number,
  frameHeight: number,
): FramePixelStats {
  const frameX = (frame % 4) * frameWidth;
  const frameY = Math.floor(frame / 4) * frameHeight;
  let opaquePixels = 0;
  let maxY = -1;
  let weightedX = 0;
  let totalAlpha = 0;

  for (let y = 0; y < frameHeight; y += 1) {
    for (let x = 0; x < frameWidth; x += 1) {
      const alpha = alphaAt(image, frameX + x, frameY + y);
      if (alpha <= VISIBLE_ALPHA_THRESHOLD) continue;
      opaquePixels += 1;
      maxY = Math.max(maxY, y);
      weightedX += x * alpha;
      totalAlpha += alpha;
    }
  }

  return {
    opaquePixels,
    maxY,
    weightedCenterX: weightedX / Math.max(1, totalAlpha),
  };
}

function visibleMagentaPixels(image: DecodedPng): number {
  let count = 0;
  for (let offset = 0; offset < image.pixels.length; offset += 4) {
    const red = image.pixels[offset] ?? 0;
    const green = image.pixels[offset + 1] ?? 0;
    const blue = image.pixels[offset + 2] ?? 0;
    const alpha = image.pixels[offset + 3] ?? 0;
    if (
      alpha > VISIBLE_ALPHA_THRESHOLD &&
      red > 240 &&
      green < 30 &&
      blue > 240
    ) {
      count += 1;
    }
  }
  return count;
}

function frameBoundaryConnections(
  image: DecodedPng,
  frameWidth: number,
  frameHeight: number,
): string[] {
  const connections: string[] = [];
  for (
    let boundaryX = frameWidth;
    boundaryX < image.width;
    boundaryX += frameWidth
  ) {
    for (let y = 0; y < image.height; y += 1) {
      if (
        alphaAt(image, boundaryX - 1, y) > VISIBLE_ALPHA_THRESHOLD &&
        alphaAt(image, boundaryX, y) > VISIBLE_ALPHA_THRESHOLD
      ) {
        connections.push(`vertical:${boundaryX}:${y}`);
      }
    }
  }
  for (
    let boundaryY = frameHeight;
    boundaryY < image.height;
    boundaryY += frameHeight
  ) {
    for (let x = 0; x < image.width; x += 1) {
      if (
        alphaAt(image, x, boundaryY - 1) > VISIBLE_ALPHA_THRESHOLD &&
        alphaAt(image, x, boundaryY) > VISIBLE_ALPHA_THRESHOLD
      ) {
        connections.push(`horizontal:${x}:${boundaryY}`);
      }
    }
  }
  return connections;
}

describe("runtime sprite pixel alignment", () => {
  const manifest = validateSpriteManifest(manifestJson);
  const { frameWidth, frameHeight, width, height } = manifest.sheetDefaults;
  const runtimeWebpFiles = new Map(
    Object.entries(manifest.sheets).map(([key, sheet]) => [
      key,
      new URL(`../../../assets/sprites/${sheet.image}`, import.meta.url),
    ]),
  );
  const skillIconDirectory = new URL(
    "../../../assets/ui/skills/",
    import.meta.url,
  );
  const runtimeSkillIconFiles = readdirSync(skillIconDirectory)
    .filter((filename) => filename.endsWith(".webp"))
    .map((filename) => new URL(filename, skillIconDirectory));
  const decodedSheets = new Map(
    Object.entries(manifest.sheets).map(([key, sheet]) => [
      key,
      decodePng(
        new URL(
          `../../../assets/sprites/${sheet.image.replace(/\.webp$/, ".png")}`,
          import.meta.url,
        ),
      ),
    ]),
  );

  it("keeps every bundled sprite sheet in the lossless WebP contract", () => {
    for (const [sheetKey, file] of runtimeWebpFiles) {
      expect(parseLosslessWebpHeader(file), sheetKey).toEqual({
        width,
        height,
        alphaUsed: true,
      });
    }
  });

  it("keeps every bundled skill icon in the lossless WebP contract", () => {
    expect(runtimeSkillIconFiles).toHaveLength(15);
    for (const file of runtimeSkillIconFiles) {
      expect(parseLosslessWebpHeader(file), file.pathname).toEqual({
        width: 128,
        height: 128,
        alphaUsed: true,
      });
    }
  });

  it("keeps all 384 runtime cells occupied, corner-clean, and free of chroma pixels", () => {
    for (const [sheetKey, image] of decodedSheets) {
      expect(
        { width: image.width, height: image.height },
        sheetKey,
      ).toEqual({ width, height });
      expect(visibleMagentaPixels(image), `${sheetKey} chroma residue`).toBe(0);

      for (let frame = 0; frame < 16; frame += 1) {
        const stats = framePixelStats(image, frame, frameWidth, frameHeight);
        expect(stats.opaquePixels, `${sheetKey}:${frame} visible pixels`).toBeGreaterThan(
          50,
        );
        const frameX = (frame % 4) * frameWidth;
        const frameY = Math.floor(frame / 4) * frameHeight;
        const cornerAlpha = [
          alphaAt(image, frameX, frameY),
          alphaAt(image, frameX + frameWidth - 1, frameY),
          alphaAt(image, frameX, frameY + frameHeight - 1),
          alphaAt(
            image,
            frameX + frameWidth - 1,
            frameY + frameHeight - 1,
          ),
        ];
        expect(
          Math.max(...cornerAlpha),
          `${sheetKey}:${frame} cell-corner bleed`,
        ).toBeLessThanOrEqual(VISIBLE_ALPHA_THRESHOLD);
      }
    }
  });

  it("matches every player idle and walk pixel baseline to its frame origin", () => {
    const baselineViolations: string[] = [];
    for (const sheetKey of PLAYER_SHEETS) {
      const sheet = manifest.sheets[sheetKey]!;
      const image = decodedSheets.get(sheetKey)!;
      const centerOffsets: number[] = [];

      for (const frame of [0, 1, 2, 3, 4, 5, 6, 7]) {
        const stats = framePixelStats(image, frame, frameWidth, frameHeight);
        const origin = sheet.frameOrigins[String(frame)]!;
        const artworkBottomFromAnchor = stats.maxY - origin.y * frameHeight;
        if (artworkBottomFromAnchor < -29 || artworkBottomFromAnchor > -23) {
          baselineViolations.push(
            `${sheetKey}:${frame}=${artworkBottomFromAnchor}px`,
          );
        }
        centerOffsets.push(stats.weightedCenterX - origin.x * frameWidth);
      }

      expect(
        Math.max(...centerOffsets) - Math.min(...centerOffsets),
        `${sheetKey} idle/walk visual-center drift`,
      ).toBeLessThanOrEqual(8);
    }
    expect(baselineViolations, "player grounded pixel baselines").toEqual([]);
  });

  it("keeps all monster artwork disconnected across 128px frame boundaries", () => {
    for (const sheetKey of MONSTER_SHEETS) {
      const image = decodedSheets.get(sheetKey)!;
      expect(
        frameBoundaryConnections(image, frameWidth, frameHeight),
        `${sheetKey} cross-frame pixels`,
      ).toEqual([]);
    }
  });

  it("keeps plague zombie walk frames free of leaked pixels above the artwork", () => {
    const image = decodedSheets.get("plagueZombie")!;
    for (const frame of [4, 5, 6, 7]) {
      const frameX = (frame % 4) * frameWidth;
      const frameY = Math.floor(frame / 4) * frameHeight;
      for (let y = 0; y < 12; y += 1) {
        for (let x = 0; x < frameWidth; x += 1) {
          expect(
            alphaAt(image, frameX + x, frameY + y),
            `plagueZombie:${frame} leaked pixel at ${x},${y}`,
          ).toBe(0);
        }
      }
    }
  });

  it("keeps every monster and NPC frame grounded across its animation", () => {
    for (const sheetKey of GROUNDED_SHEETS) {
      const sheet = manifest.sheets[sheetKey]!;
      const image = decodedSheets.get(sheetKey)!;

      for (let frame = 0; frame < 16; frame += 1) {
        const stats = framePixelStats(image, frame, frameWidth, frameHeight);
        const origin = sheet.frameOrigins[String(frame)]!;
        const artworkBottomFromAnchor = stats.maxY - origin.y * frameHeight;
        expect(
          artworkBottomFromAnchor,
          `${sheetKey}:${frame} grounded pixel baseline`,
        ).toBeGreaterThanOrEqual(-2);
        expect(
          artworkBottomFromAnchor,
          `${sheetKey}:${frame} grounded pixel baseline`,
        ).toBeLessThanOrEqual(-1);
      }

      for (const [animationName, animation] of Object.entries(sheet.animations)) {
        const centerOffsets = animation.frames.map((frame) => {
          const stats = framePixelStats(image, frame, frameWidth, frameHeight);
          const origin = sheet.frameOrigins[String(frame)]!;
          return stats.weightedCenterX - origin.x * frameWidth;
        });
        expect(
          Math.max(...centerOffsets) - Math.min(...centerOffsets),
          `${sheetKey}:${animationName} visual-center drift`,
        ).toBeLessThanOrEqual(16);
      }
    }
  });
});

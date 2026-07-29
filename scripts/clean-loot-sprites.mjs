import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FRAME_SIZE = 128;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const inputPath = resolve(
  projectRoot,
  "assets/sprites/core/world-effects-loot-v1.png",
);
const outputPath = resolve(
  projectRoot,
  "assets/sprites/core/world-effects-loot-v2.png",
);
const workingDirectory = mkdtempSync(join(tmpdir(), "maple-loot-cleanup-"));

const targetBottoms = {
  4: 116,
  5: 98,
  6: 116,
  7: 116,
  8: 116,
  9: 97,
  10: 116,
  11: 116,
  12: 116,
  13: 96,
  14: 116,
  15: 116,
};

function runMagick(args, capture = false) {
  return execFileSync("magick", args, {
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

function framePath(index, suffix = "frame") {
  return join(workingDirectory, `${suffix}-${String(index).padStart(2, "0")}.png`);
}

function removeLandingDebris(index, maskPath) {
  const rectangles =
    index === 10
      ? "rectangle 0,94 34,127 rectangle 75,94 127,127"
      : index === 14
        ? "rectangle 0,88 35,127 rectangle 70,88 127,127"
        : undefined;
  if (!rectangles) return;

  const clippedMaskPath = framePath(index, "clipped-mask");
  runMagick([
    maskPath,
    "-fill",
    "black",
    "-draw",
    rectangles,
    clippedMaskPath,
  ]);
  runMagick([clippedMaskPath, maskPath]);
}

function validateItemFrame(index, imagePath) {
  const [width, height, x, y] = runMagick(
    [imagePath, "-trim", "-format", "%w %h %X %Y", "info:"],
    true,
  )
    .trim()
    .replaceAll("+", "")
    .split(" ")
    .map(Number);
  const targetBottom = targetBottoms[index];

  if (Math.abs(x * 2 + width - FRAME_SIZE) > 1) {
    throw new Error(`Frame ${index} is not horizontally centered.`);
  }
  if (y + height !== targetBottom) {
    throw new Error(
      `Frame ${index} ends at ${y + height}, expected ${targetBottom}.`,
    );
  }
}

try {
  mkdirSync(dirname(outputPath), { recursive: true });

  for (let index = 0; index < 16; index += 1) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const sourceFramePath = framePath(index, "source");
    const finalFramePath = framePath(index);
    runMagick([
      inputPath,
      "-crop",
      `${FRAME_SIZE}x${FRAME_SIZE}+${column * FRAME_SIZE}+${row * FRAME_SIZE}`,
      "+repage",
      sourceFramePath,
    ]);

    if (index < 4) {
      runMagick([sourceFramePath, finalFramePath]);
      continue;
    }

    const maskPath = framePath(index, "mask");
    const cleanedPath = framePath(index, "cleaned");
    const objectPath = framePath(index, "object");
    runMagick([
      sourceFramePath,
      "-alpha",
      "extract",
      "-threshold",
      "0",
      "-define",
      "connected-components:area-threshold=500",
      "-define",
      "connected-components:mean-color=true",
      "-connected-components",
      "8",
      "-threshold",
      "50%",
      maskPath,
    ]);
    removeLandingDebris(index, maskPath);
    runMagick([
      sourceFramePath,
      maskPath,
      "-alpha",
      "off",
      "-compose",
      "CopyOpacity",
      "-composite",
      cleanedPath,
    ]);
    runMagick([cleanedPath, "-trim", "+repage", objectPath]);

    const [width, height] = runMagick(
      [objectPath, "-format", "%w %h", "info:"],
      true,
    )
      .trim()
      .split(" ")
      .map(Number);
    const targetBottom = targetBottoms[index];
    const x = Math.round((FRAME_SIZE - width) / 2);
    const y = targetBottom - height;
    runMagick([
      "-size",
      `${FRAME_SIZE}x${FRAME_SIZE}`,
      "canvas:none",
      objectPath,
      "-geometry",
      `+${x}+${y}`,
      "-composite",
      finalFramePath,
    ]);
    validateItemFrame(index, finalFramePath);
  }

  const rowPaths = [];
  for (let row = 0; row < 4; row += 1) {
    const rowPath = join(workingDirectory, `row-${row}.png`);
    runMagick([
      ...Array.from({ length: 4 }, (_, column) => framePath(row * 4 + column)),
      "+append",
      rowPath,
    ]);
    rowPaths.push(rowPath);
  }
  runMagick([...rowPaths, "-append", "PNG32:" + outputPath]);
  console.log(`Generated ${outputPath}`);
} finally {
  rmSync(workingDirectory, { recursive: true, force: true });
}

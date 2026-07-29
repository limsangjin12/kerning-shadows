import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DIGITS = [
  ["111", "101", "101", "101", "111"],
  ["010", "110", "010", "010", "111"],
  ["111", "001", "111", "100", "111"],
  ["111", "001", "111", "001", "111"],
  ["101", "101", "111", "001", "001"],
  ["111", "100", "111", "001", "111"],
  ["111", "100", "111", "101", "111"],
  ["111", "001", "010", "010", "010"],
  ["111", "101", "111", "101", "111"],
  ["111", "101", "111", "001", "111"],
];

const PALETTES = [
  { face: "#ffe469", shadow: "#24140f" },
  { face: "#ff9e3d", shadow: "#24140f" },
  { face: "#ff625c", shadow: "#24140f" },
  { face: "#fff6b0", shadow: "#ff3c78" },
];
const CELL = 32;
const PIXEL = 4;
const OFFSET_X = 10;
const OFFSET_Y = 5;

const rectangles = (palette, digit, column, row) => {
  const shadow = [];
  const face = [];
  for (let y = 0; y < digit.length; y += 1) {
    for (let x = 0; x < digit[y].length; x += 1) {
      if (digit[y][x] !== "1") continue;
      const pixelX = column * CELL + OFFSET_X + x * PIXEL;
      const pixelY = row * CELL + OFFSET_Y + y * PIXEL;
      shadow.push(`<rect x="${pixelX + 2}" y="${pixelY + 2}" width="${PIXEL}" height="${PIXEL}" fill="${palette.shadow}"/>`);
      face.push(`<rect x="${pixelX}" y="${pixelY}" width="${PIXEL}" height="${PIXEL}" fill="${palette.face}"/>`);
    }
  }
  return [...shadow, ...face].join("");
};

const body = PALETTES.flatMap((palette, row) =>
  DIGITS.map((digit, column) => rectangles(palette, digit, column, row)),
).join("");

const height = PALETTES.length * CELL;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${height}" viewBox="0 0 320 ${height}" shape-rendering="crispEdges"><title>Damage number atlas: normal, strong attack, player damage, critical hit</title>${body}</svg>\n`;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../assets/ui/combat/damage-numbers-v1.svg");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, svg, "utf8");
console.log(`Generated ${outputPath}`);

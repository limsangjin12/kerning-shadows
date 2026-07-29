import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 96;
const SLICE = 16;

const themes = {
  book: {
    title: "Book and parchment pixel UI nine-slice panel",
    outer: "#2b160c",
    shadow: "#4b2813",
    edge: "#8d5728",
    highlight: "#e0b65c",
    inner: "#b9843c",
    surface: "#ead9a8",
    surfaceLight: "#f9edc7",
    detail: "#9b713c",
    corner: "#d8a844",
  },
  wood: {
    title: "Wood and brass pixel UI nine-slice panel",
    outer: "#1d1009",
    shadow: "#3b2113",
    edge: "#74401f",
    highlight: "#bd7a36",
    inner: "#8b5227",
    surface: "#5c321d",
    surfaceLight: "#754426",
    detail: "#351b10",
    corner: "#c89a42",
  },
  metal: {
    title: "Industrial metal pixel UI nine-slice panel",
    outer: "#070b0d",
    shadow: "#11191d",
    edge: "#42555b",
    highlight: "#a7b5b1",
    inner: "#65777a",
    surface: "#172127",
    surfaceLight: "#223139",
    detail: "#0b1114",
    corner: "#c3a35a",
  },
};

function rect(x, y, width, height, fill) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"/>`;
}

function panelSvg(theme) {
  const layers = [
    rect(0, 0, SIZE, SIZE, theme.outer),
    rect(2, 2, SIZE - 4, SIZE - 4, theme.shadow),
    rect(4, 4, SIZE - 8, SIZE - 8, theme.edge),
    rect(6, 6, SIZE - 12, SIZE - 12, theme.highlight),
    rect(8, 8, SIZE - 16, SIZE - 16, theme.inner),
    rect(12, 12, SIZE - 24, SIZE - 24, theme.shadow),
    rect(SLICE, SLICE, SIZE - SLICE * 2, SIZE - SLICE * 2, theme.surface),
  ];

  for (const [x, y] of [
    [7, 7],
    [SIZE - 11, 7],
    [7, SIZE - 11],
    [SIZE - 11, SIZE - 11],
  ]) {
    layers.push(rect(x, y, 4, 4, theme.corner));
    layers.push(rect(x + 1, y + 1, 2, 2, theme.outer));
  }

  for (let offset = 24; offset <= 72; offset += 16) {
    layers.push(rect(offset, 9, 8, 2, theme.detail));
    layers.push(rect(offset, SIZE - 11, 8, 2, theme.detail));
    layers.push(rect(9, offset, 2, 8, theme.detail));
    layers.push(rect(SIZE - 11, offset, 2, 8, theme.detail));
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges"><title>${theme.title}</title>${layers.join("")}</svg>\n`;
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/ui/panels");
mkdirSync(outputDirectory, { recursive: true });

for (const [name, theme] of Object.entries(themes)) {
  const outputPath = resolve(outputDirectory, `${name}-panel-v1.svg`);
  writeFileSync(outputPath, panelSvg(theme), "utf8");
  console.log(`Generated ${outputPath}`);
}

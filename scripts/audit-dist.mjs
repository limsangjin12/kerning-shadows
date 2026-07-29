import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const requiredFiles = [
  "index.html",
  "ASSET_CREDITS.md",
  "THIRD_PARTY_NOTICES.txt",
  "licenses/Galmuri-OFL.txt",
  "licenses/Phaser-MIT.txt",
];
const forbiddenPatterns = [
  /(^|\/)reference[-_ ]?images(\/|$)/i,
  /(^|\/)source(\/|$)/i,
  /PROMPTS\.md$/i,
  /\.map$/i,
  /\.png$/i,
  /world-effects-loot-v1/i,
];
const totalBudgetExclusions = [
  /^assets\/boss-theme-v\d+-[^/]+\.mp3$/i,
  /^assets\/game-theme-v\d+-[^/]+\.mp3$/i,
];
const budgets = {
  totalBytes: 8_000_000,
  javascriptBytes: 1_500_000,
  javascriptGzipBytes: 450_000,
};

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(absolute) : [absolute];
    }),
  );
  return nested.flat();
}

const files = await listFiles(dist);
const paths = files.map((file) => relative(dist, file));
for (const required of requiredFiles) {
  if (!paths.includes(required)) {
    throw new Error(`Release artifact is missing ${required}.`);
  }
}
for (const path of paths) {
  const forbidden = forbiddenPatterns.find((pattern) => pattern.test(path));
  if (forbidden) throw new Error(`Release artifact contains forbidden file: ${path}`);
}

const sizes = await Promise.all(files.map(async (file) => (await stat(file)).size));
const totalBytes = sizes.reduce((sum, size) => sum + size, 0);
const excludedTotalBytes = paths.reduce(
  (sum, path, index) => totalBudgetExclusions.some((pattern) => pattern.test(path))
    ? sum + sizes[index]
    : sum,
  0,
);
const budgetedTotalBytes = totalBytes - excludedTotalBytes;
const javascriptFiles = files.filter((file) => file.endsWith(".js"));
const javascriptBuffers = await Promise.all(javascriptFiles.map((file) => readFile(file)));
const javascriptBytes = javascriptBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
const javascriptGzipBytes = javascriptBuffers.reduce(
  (sum, buffer) => sum + gzipSync(buffer).length,
  0,
);

for (const [budget, limit] of Object.entries(budgets)) {
  const actual = { totalBytes: budgetedTotalBytes, javascriptBytes, javascriptGzipBytes }[budget];
  if (actual > limit) {
    throw new Error(`${budget} ${actual} exceeds release budget ${limit}.`);
  }
}

const indexHtml = await readFile(resolve(dist, "index.html"), "utf8");
if (/src="\/(?!\/)|href="\/(?!\/)/.test(indexHtml)) {
  throw new Error("index.html contains an origin-absolute asset URL.");
}

console.log(
  `dist audit passed: ${paths.length} files, ${budgetedTotalBytes} budgeted bytes ` +
    `(${totalBytes} total, ${excludedTotalBytes} BGM bytes excluded), ` +
    `${javascriptBytes} JS bytes, ${javascriptGzipBytes} JS gzip bytes.`,
);

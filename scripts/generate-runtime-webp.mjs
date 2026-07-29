import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import manifest from "../assets/sprites/sprite-manifest.json" with { type: "json" };

const root = resolve(import.meta.dirname, "..");
const skillIconDirectory = resolve(root, "assets/ui/skills");

function encodeLosslessWebp(source, destination) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn(
      "cwebp",
      ["-quiet", "-lossless", "-z", "9", source, "-o", destination],
      { stdio: "inherit" },
    );
    process.once("error", reject);
    process.once("exit", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`cwebp exited with code ${code} for ${source}`));
      }
    });
  });
}

const spritePairs = Object.values(manifest.sheets).map(({ image }) => {
  const destination = resolve(root, "assets/sprites", image);
  return {
    source: destination.replace(/\.webp$/, ".png"),
    destination,
  };
});
const skillIconPairs = (await readdir(skillIconDirectory))
  .filter((filename) => filename.endsWith(".png"))
  .sort()
  .map((filename) => ({
    source: resolve(skillIconDirectory, filename),
    destination: resolve(
      skillIconDirectory,
      filename.replace(/\.png$/, ".webp"),
    ),
  }));

for (const { source, destination } of [...spritePairs, ...skillIconPairs]) {
  await encodeLosslessWebp(source, destination);
}

console.log(
  `Generated ${spritePairs.length + skillIconPairs.length} lossless runtime WebP assets.`,
);

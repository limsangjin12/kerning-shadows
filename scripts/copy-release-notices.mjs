import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const licenses = resolve(dist, "licenses");

await mkdir(licenses, { recursive: true });
await Promise.all([
  copyFile(resolve(root, "ASSET_CREDITS.md"), resolve(dist, "ASSET_CREDITS.md")),
  copyFile(
    resolve(root, "assets/ui/fonts/Galmuri-LICENSE.txt"),
    resolve(licenses, "Galmuri-OFL.txt"),
  ),
  copyFile(
    resolve(root, "node_modules/phaser/LICENSE.md"),
    resolve(licenses, "Phaser-MIT.txt"),
  ),
]);

await writeFile(
  resolve(dist, "THIRD_PARTY_NOTICES.txt"),
  [
    "Kerning Shadows local demo — third-party notices",
    "",
    "Phaser 3.90.0",
    "Copyright (c) Richard Davey, Photon Storm Ltd.",
    "License: MIT. Full text: licenses/Phaser-MIT.txt",
    "",
    "Galmuri11 2.40.3",
    "Copyright (c) 2019-2025 Lee Minseo (quiple@quiple.dev)",
    "License: SIL Open Font License 1.1. Full text: licenses/Galmuri-OFL.txt",
    "",
    "Project-made asset provenance and release terms: ASSET_CREDITS.md",
    "",
  ].join("\n"),
  "utf8",
);

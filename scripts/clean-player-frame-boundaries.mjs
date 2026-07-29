import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const FRAME_SIZE = 128;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");

const sheets = [
  {
    input: "player-rogue-v3.png",
    output: "player-rogue-v4.png",
    removals: [
      { frame: 5, components: [[36, 61, 124, 17, 4]] },
      {
        frame: 14,
        components: [
          [5, 125, 40, 3, 3],
          [4, 126, 67, 2, 3],
          [3, 127, 46, 1, 3],
        ],
      },
    ],
  },
  {
    input: "player-assassin-v3.png",
    output: "player-assassin-v4.png",
    removals: [
      { frame: 5, components: [[21, 62, 125, 15, 3]] },
      {
        frame: 14,
        components: [
          [100, 118, 37, 10, 18],
          [28, 122, 61, 6, 8],
          [3, 127, 70, 1, 3],
        ],
      },
    ],
  },
  {
    input: "player-hermit-v3.png",
    output: "player-hermit-v4.png",
    removals: [
      {
        frame: 5,
        components: [
          [53, 60, 124, 20, 4],
          [6, 53, 127, 6, 1],
        ],
      },
      { frame: 6, components: [[91, 117, 56, 11, 12]] },
      {
        frame: 10,
        components: [
          [35, 118, 49, 10, 7],
          [18, 124, 77, 4, 8],
          [13, 122, 59, 6, 4],
          [6, 125, 72, 3, 4],
        ],
      },
      {
        frame: 14,
        components: [
          [326, 111, 42, 17, 37],
          [6, 0, 36, 4, 3],
          [3, 127, 82, 1, 3],
        ],
      },
    ],
  },
  {
    input: "player-hokage-v4.png",
    output: "player-hokage-v5.png",
    removals: [
      {
        frame: 8,
        components: [
          [32, 37, 118, 4, 10],
          [20, 45, 121, 4, 7],
          [14, 31, 122, 3, 6],
          [5, 76, 126, 4, 2],
        ],
      },
      { frame: 9, components: [[1, 65, 127, 1, 1]] },
      {
        frame: 14,
        components: [
          [32, 0, 28, 11, 4],
          [21, 0, 34, 8, 3],
          [20, 0, 21, 7, 4],
        ],
      },
    ],
  },
  {
    input: "abyss-golem-v1.png",
    output: "abyss-golem-v3.png",
    removals: [
      { frame: 4, components: [[542, 27, 0, 86, 10]] },
      { frame: 5, components: [[423, 26, 0, 77, 10]] },
      {
        frame: 6,
        components: [
          [453, 21, 0, 78, 10],
          [14, 20, 0, 14, 1],
        ],
      },
      { frame: 7, components: [[579, 17, 0, 82, 10]] },
      {
        frame: 8,
        components: [
          [461, 23, 0, 78, 9],
          [6, 29, 0, 3, 2],
        ],
      },
      {
        frame: 9,
        components: [
          [522, 21, 0, 79, 11],
          [10, 127, 77, 1, 10],
        ],
      },
      {
        frame: 10,
        components: [
          [587, 19, 0, 80, 11],
          [18, 124, 53, 4, 8],
          [2, 127, 83, 1, 2],
          [1, 127, 121, 1, 1],
        ],
      },
      { frame: 11, components: [[558, 17, 0, 82, 11]] },
    ],
  },
  {
    input: "plague-zombie-v1.png",
    output: "plague-zombie-v2.png",
    removals: [
      {
        frame: 4,
        components: [
          [107, 35, 4, 24, 6],
          [107, 62, 4, 24, 5],
          [51, 93, 4, 17, 4],
          [3, 87, 4, 1, 3],
          [2, 60, 4, 1, 2],
        ],
      },
      {
        frame: 5,
        components: [
          [105, 27, 4, 23, 6],
          [103, 54, 4, 23, 5],
          [51, 83, 4, 18, 4],
          [3, 25, 4, 1, 3],
          [1, 78, 4, 1, 1],
          [1, 29, 8, 1, 1],
        ],
      },
      {
        frame: 6,
        components: [
          [110, 44, 4, 26, 5],
          [103, 16, 4, 23, 6],
          [53, 75, 4, 17, 4],
          [2, 40, 4, 2, 2],
        ],
      },
      {
        frame: 7,
        components: [
          [105, 34, 4, 24, 5],
          [101, 8, 4, 23, 6],
          [51, 64, 4, 16, 4],
          [2, 59, 4, 1, 2],
        ],
      },
    ],
  },
  {
    input: "ember-warden-v1.png",
    output: "ember-warden-v2.png",
    removals: [
      { frame: 12, components: [[4, 127, 93, 1, 4]] },
      { frame: 13, components: [[13, 126, 90, 2, 8]] },
      { frame: 14, components: [[67, 121, 79, 7, 19]] },
    ],
  },
  {
    input: "eclipse-archivist-v1.png",
    output: "eclipse-archivist-v2.png",
    removals: [
      {
        frame: 2,
        components: [
          [2, 127, 122, 1, 2],
          [1, 127, 120, 1, 1],
        ],
      },
      { frame: 6, components: [[26, 123, 112, 5, 9]] },
      { frame: 9, components: [[9, 125, 108, 3, 4]] },
      { frame: 10, components: [[69, 117, 102, 11, 11]] },
      { frame: 12, components: [[6, 125, 107, 3, 3]] },
      { frame: 13, components: [[17, 124, 106, 4, 6]] },
      { frame: 14, components: [[87, 115, 103, 13, 10]] },
    ],
  },
];

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function predictorFor(filterType, left, above, upperLeft) {
  if (filterType === 0) return 0;
  if (filterType === 1) return left;
  if (filterType === 2) return above;
  if (filterType === 3) return Math.floor((left + above) / 2);
  if (filterType === 4) return paethPredictor(left, above, upperLeft);
  throw new Error(`Unsupported PNG filter: ${filterType}`);
}

function parsePng(path) {
  const png = readFileSync(path);
  if (!png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(`Invalid PNG signature: ${path}`);
  }

  const chunks = [];
  const idatParts = [];
  let width;
  let height;
  let colorType;
  let transparentPalette;
  for (let offset = PNG_SIGNATURE.length; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = Buffer.from(png.subarray(dataStart, dataEnd));
    chunks.push({ type, data });

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (
        bitDepth !== 8 ||
        (colorType !== 3 && colorType !== 6) ||
        interlace !== 0
      ) {
        throw new Error(
          `Expected a non-interlaced 8-bit indexed/RGBA PNG, got depth=${bitDepth}, type=${colorType}, interlace=${interlace}: ${path}`,
        );
      }
    } else if (type === "tRNS") {
      transparentPalette = data;
    } else if (type === "IDAT") {
      idatParts.push(data);
    }

    offset = dataEnd + 4;
  }

  if (width !== 512 || height !== 512 || colorType === undefined) {
    throw new Error(`Unexpected player/monster sprite sheet contract: ${path}`);
  }
  const bytesPerPixel = colorType === 3 ? 1 : 4;
  const rowBytes = width * bytesPerPixel;
  const transparentIndex =
    colorType === 3
      ? transparentPalette?.findIndex((alpha) => alpha === 0)
      : undefined;
  if (colorType === 3 && (transparentIndex ?? -1) < 0) {
    throw new Error(`Indexed sprite has no transparent palette entry: ${path}`);
  }

  const encodedRows = inflateSync(Buffer.concat(idatParts));
  const expectedLength = height * (rowBytes + 1);
  if (encodedRows.length !== expectedLength) {
    throw new Error(
      `Unexpected decompressed PNG size ${encodedRows.length}, expected ${expectedLength}: ${path}`,
    );
  }

  const samples = Buffer.alloc(rowBytes * height);
  const filterTypes = Buffer.alloc(height);
  for (let y = 0; y < height; y += 1) {
    const encodedRowStart = y * (rowBytes + 1);
    const rowStart = y * rowBytes;
    const filterType = encodedRows[encodedRowStart];
    filterTypes[y] = filterType;

    for (let x = 0; x < rowBytes; x += 1) {
      const encoded = encodedRows[encodedRowStart + x + 1];
      const left = x >= bytesPerPixel ? samples[rowStart + x - bytesPerPixel] : 0;
      const above = y > 0 ? samples[rowStart + x - rowBytes] : 0;
      const upperLeft =
        x >= bytesPerPixel && y > 0
          ? samples[rowStart + x - rowBytes - bytesPerPixel]
          : 0;
      samples[rowStart + x] =
        (encoded + predictorFor(filterType, left, above, upperLeft)) & 0xff;
    }
  }

  return {
    bytesPerPixel,
    chunks,
    colorType,
    filterTypes,
    height,
    path,
    rowBytes,
    samples,
    transparentIndex,
    transparentPalette,
    width,
  };
}

function alphaAt(parsed, pixelIndex) {
  if (parsed.colorType === 6) return parsed.samples[pixelIndex * 4 + 3];
  const paletteIndex = parsed.samples[pixelIndex];
  return parsed.transparentPalette?.[paletteIndex] ?? 255;
}

function clearPixel(parsed, pixelIndex) {
  if (parsed.colorType === 6) {
    parsed.samples.fill(0, pixelIndex * 4, pixelIndex * 4 + 4);
  } else {
    parsed.samples[pixelIndex] = parsed.transparentIndex;
  }
}

function frameComponents(parsed, frame) {
  const frameX = (frame % 4) * FRAME_SIZE;
  const frameY = Math.floor(frame / 4) * FRAME_SIZE;
  const visited = new Uint8Array(FRAME_SIZE * FRAME_SIZE);
  const components = [];

  for (let y = 0; y < FRAME_SIZE; y += 1) {
    for (let x = 0; x < FRAME_SIZE; x += 1) {
      const localIndex = y * FRAME_SIZE + x;
      const sheetIndex = (frameY + y) * parsed.width + frameX + x;
      if (visited[localIndex] || alphaAt(parsed, sheetIndex) === 0) continue;

      const pixels = [];
      const queue = [[x, y]];
      visited[localIndex] = 1;
      for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const [currentX, currentY] = queue[cursor];
        pixels.push({
          sheetIndex:
            (frameY + currentY) * parsed.width + frameX + currentX,
          x: currentX,
          y: currentY,
        });
        for (
          let nextY = Math.max(0, currentY - 1);
          nextY <= Math.min(FRAME_SIZE - 1, currentY + 1);
          nextY += 1
        ) {
          for (
            let nextX = Math.max(0, currentX - 1);
            nextX <= Math.min(FRAME_SIZE - 1, currentX + 1);
            nextX += 1
          ) {
            const nextLocalIndex = nextY * FRAME_SIZE + nextX;
            const nextSheetIndex =
              (frameY + nextY) * parsed.width + frameX + nextX;
            if (
              !visited[nextLocalIndex] &&
              alphaAt(parsed, nextSheetIndex) > 0
            ) {
              visited[nextLocalIndex] = 1;
              queue.push([nextX, nextY]);
            }
          }
        }
      }
      const xs = pixels.map((pixel) => pixel.x);
      const ys = pixels.map((pixel) => pixel.y);
      components.push({
        bounds: [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs) - Math.min(...xs) + 1,
          Math.max(...ys) - Math.min(...ys) + 1,
        ],
        pixels,
      });
    }
  }
  return components.sort((left, right) => right.pixels.length - left.pixels.length);
}

function removeConfiguredComponents(parsed, removal) {
  const components = frameComponents(parsed, removal.frame);
  for (const expected of removal.components) {
    const [expectedSize, ...expectedBounds] = expected;
    const componentIndex = components.findIndex(
      (component) =>
        component.pixels.length === expectedSize &&
        component.bounds.every((value, index) => value === expectedBounds[index]),
    );
    if (componentIndex < 0) {
      throw new Error(
        `Missing expected component ${JSON.stringify(expected)} in frame ${removal.frame}: ${parsed.path}`,
      );
    }
    const [component] = components.splice(componentIndex, 1);
    for (const pixel of component.pixels) clearPixel(parsed, pixel.sheetIndex);
  }
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function writePng(parsed, outputPath) {
  const encodedRows = Buffer.alloc(parsed.height * (parsed.rowBytes + 1));
  for (let y = 0; y < parsed.height; y += 1) {
    const encodedRowStart = y * (parsed.rowBytes + 1);
    const rowStart = y * parsed.rowBytes;
    const filterType = parsed.filterTypes[y];
    encodedRows[encodedRowStart] = filterType;

    for (let x = 0; x < parsed.rowBytes; x += 1) {
      const value = parsed.samples[rowStart + x];
      const left =
        x >= parsed.bytesPerPixel
          ? parsed.samples[rowStart + x - parsed.bytesPerPixel]
          : 0;
      const above = y > 0 ? parsed.samples[rowStart + x - parsed.rowBytes] : 0;
      const upperLeft =
        x >= parsed.bytesPerPixel && y > 0
          ? parsed.samples[
              rowStart + x - parsed.rowBytes - parsed.bytesPerPixel
            ]
          : 0;
      const predictor = predictorFor(filterType, left, above, upperLeft);
      encodedRows[encodedRowStart + x + 1] = (value - predictor) & 0xff;
    }
  }

  const idat = deflateSync(encodedRows, { level: 9 });
  const outputChunks = [];
  let wroteIdat = false;
  for (const chunk of parsed.chunks) {
    if (chunk.type === "IDAT") {
      if (!wroteIdat) {
        outputChunks.push(createChunk("IDAT", idat));
        wroteIdat = true;
      }
    } else {
      outputChunks.push(createChunk(chunk.type, chunk.data));
    }
  }
  writeFileSync(outputPath, Buffer.concat([PNG_SIGNATURE, ...outputChunks]));
}

for (const sheet of sheets) {
  const inputPath = resolve(projectRoot, "assets/sprites/core", sheet.input);
  const outputPath = resolve(projectRoot, "assets/sprites/core", sheet.output);
  const parsed = parsePng(inputPath);
  for (const removal of sheet.removals) {
    removeConfiguredComponents(parsed, removal);
  }
  writePng(parsed, outputPath);
  const removedPixels = sheet.removals.reduce(
    (total, removal) =>
      total + removal.components.reduce((sum, [size]) => sum + size, 0),
    0,
  );
  console.log(`Generated ${outputPath} (removed ${removedPixels} pixels)`);
}

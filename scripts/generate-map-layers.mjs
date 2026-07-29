import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 1920;
const HEIGHT = 720;

const glyphs = {
  A: ["01110", "10001", "11111", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "11110", "10000", "11111"],
  G: ["01111", "10000", "10111", "10001", "01111"],
  H: ["10001", "10001", "11111", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "11111"],
  U: ["10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "01010", "00100"],
};

function rect(x, y, width, height, fill, extra = "") {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${extra}/>`;
}

function polygon(points, fill, extra = "") {
  return `<polygon points="${points}" fill="${fill}"${extra}/>`;
}

function pixelText(text, x, y, scale, fill) {
  const parts = [];
  let cursor = x;
  for (const character of text) {
    const glyph = glyphs[character];
    if (!glyph) {
      cursor += scale * 4;
      continue;
    }
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((pixel, columnIndex) => {
        if (pixel === "1") {
          parts.push(rect(cursor + columnIndex * scale, y + rowIndex * scale, scale, scale, fill));
        }
      });
    });
    cursor += scale * 6;
  }
  return parts.join("");
}

function brickBand(x, y, width, height, base, mortar, top) {
  const parts = [
    `<g data-platform-top="${y}">`,
    rect(x, y, width, height, base),
    rect(x, y, width, 4, top),
  ];
  const rowHeight = 12;
  const brickWidth = 34;
  for (let row = 0; y + row * rowHeight < y + height; row += 1) {
    const rowY = y + row * rowHeight;
    parts.push(rect(x, rowY, width, 2, mortar));
    const offset = row % 2 === 0 ? 0 : -brickWidth / 2;
    for (let brickX = x + offset; brickX < x + width; brickX += brickWidth) {
      parts.push(rect(brickX, rowY, 2, Math.min(rowHeight, y + height - rowY), mortar));
    }
  }
  parts.push("</g>");
  return parts.join("");
}

function sign(label, x, y, width) {
  return [
    "<g>",
    rect(x, y, width, 34, "#101a1e"),
    rect(x + 3, y + 3, width - 6, 28, "#35565a"),
    rect(x + 6, y + 6, width - 12, 22, "#18363b"),
    pixelText(label, x + 11, y + 9, 3, "#a9f0dd"),
    "</g>",
  ].join("");
}

function svg(title, content, width = WIDTH, height = HEIGHT) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges"><title>${title}</title>${content}</svg>\n`;
}

function midgroundSvg() {
  const parts = ['<g opacity="0.2">'];
  const buildings = [
    [40, 118, 250, 502],
    [330, 188, 220, 432],
    [590, 86, 330, 534],
    [970, 160, 260, 460],
    [1280, 104, 290, 516],
    [1610, 176, 250, 444],
  ];
  for (const [x, y, width, height] of buildings) {
    parts.push(rect(x, y, width, height, "#14292e"));
    parts.push(rect(x + 8, y + 8, width - 16, 8, "#365057"));
    for (let windowY = y + 34; windowY < y + height - 20; windowY += 46) {
      for (let windowX = x + 22; windowX < x + width - 18; windowX += 42) {
        parts.push(rect(windowX, windowY, 12, 16, "#6f9f99", ' opacity="0.38"'));
      }
    }
  }
  parts.push(
    '<g fill="none" stroke-linecap="square" stroke-linejoin="miter">',
    '<path d="M0 274 H420 V226 H760 V302 H1120 V238 H1510 V286 H1920" stroke="#233b40" stroke-width="24"/>',
    '<path d="M0 274 H420 V226 H760 V302 H1120 V238 H1510 V286 H1920" stroke="#597077" stroke-width="4"/>',
    '<path d="M86 0 V188 H250 V334 H512" stroke="#20363b" stroke-width="18"/>',
    '<path d="M1430 0 V206 H1724 V372 H1920" stroke="#20363b" stroke-width="18"/>',
    '<path d="M0 78 C420 130 760 28 1120 90 S1640 144 1920 64" stroke="#182a2f" stroke-width="5"/>',
    "</g>",
    "</g>",
  );
  return svg("Kerning City industrial midground parallax layer", parts.join(""));
}

function foregroundSvg() {
  const parts = [
    brickBand(0, 620, 1920, 100, "#25373a", "#101b1e", "#789397"),
    brickBand(395, 458, 330, 24, "#304347", "#142226", "#8ba3a3"),
    brickBand(955, 508, 310, 24, "#304347", "#142226", "#8ba3a3"),
    '<g fill="none" stroke-linecap="square" stroke-linejoin="miter">',
    '<path d="M28 620 V520 H182 V438 H344" stroke="#0b1417" stroke-width="24"/>',
    '<path d="M28 620 V520 H182 V438 H344" stroke="#567176" stroke-width="12"/>',
    '<path d="M28 620 V520 H182 V438 H344" stroke="#263d42" stroke-width="6"/>',
    '<path d="M1370 620 V486 H1548 V418 H1878 V620" stroke="#0b1417" stroke-width="22"/>',
    '<path d="M1370 620 V486 H1548 V418 H1878 V620" stroke="#5e767a" stroke-width="10"/>',
    '<path d="M1370 620 V486 H1548 V418 H1878 V620" stroke="#2c4549" stroke-width="5"/>',
    "</g>",
    sign("GUILD", 92, 430, 132),
    sign("HEAL", 754, 410, 112),
    sign("CAVE", 1652, 410, 110),
  ];

  for (const x of [410, 480, 640, 710, 970, 1040, 1180, 1250]) {
    parts.push(rect(x, x < 900 ? 426 : 476, 6, 32, "#182529"));
    parts.push(rect(x + 2, x < 900 ? 428 : 478, 2, 28, "#7c9394"));
  }
  parts.push(rect(395, 426, 330, 6, "#60797d"));
  parts.push(rect(955, 476, 310, 6, "#60797d"));

  return svg("Kerning City collision-aligned brick pipe and sign foreground layer", parts.join(""));
}

function caveMushroom(x, y, scale, cap = "#80e890") {
  const capWidth = 18 * scale;
  const capHeight = 7 * scale;
  const stemWidth = 5 * scale;
  return [
    "<g>",
    polygon(
      `${x},${y + capHeight} ${x + 3 * scale},${y + 2 * scale} ${x + 7 * scale},${y} ${x + 11 * scale},${y} ${x + 15 * scale},${y + 2 * scale} ${x + capWidth},${y + capHeight}`,
      "#143c2d",
    ),
    polygon(
      `${x + 2 * scale},${y + 6 * scale} ${x + 4 * scale},${y + 3 * scale} ${x + 8 * scale},${y + scale} ${x + 12 * scale},${y + scale} ${x + 16 * scale},${y + 6 * scale}`,
      cap,
      ' opacity="0.9"',
    ),
    rect(x + 5 * scale, y + 5 * scale, 8 * scale, scale, "#c4ffd0"),
    rect(
      x + Math.round((capWidth - stemWidth) / 2),
      y + capHeight,
      stemWidth,
      8 * scale,
      "#a2d5a4",
    ),
    "</g>",
  ].join("");
}

function caveMidgroundSvg() {
  const parts = [
    rect(0, 0, WIDTH, HEIGHT, "#021b14", ' opacity="0.46"'),
    rect(0, 112, WIDTH, 92, "#0b3a2d", ' opacity="0.18"'),
    rect(0, 324, WIDTH, 70, "#0c4b38", ' opacity="0.12"'),
    polygon("0,0 246,0 330,178 264,430 368,720 0,720", "#031b14", ' opacity="0.72"'),
    polygon("1920,0 1670,0 1588,196 1660,414 1544,720 1920,720", "#031912", ' opacity="0.74"'),
    polygon("382,0 604,0 660,168 594,364 690,720 464,720 510,442 430,248", "#06251b", ' opacity="0.54"'),
    polygon("1010,0 1224,0 1166,206 1238,398 1132,720 938,720 1042,426 976,222", "#052319", ' opacity="0.48"'),
    polygon("1372,0 1516,0 1454,182 1530,346 1420,720 1286,720 1384,414 1328,218", "#06281d", ' opacity="0.5"'),
    '<g fill="none" stroke-linecap="square" stroke-linejoin="miter">',
    '<path d="M0 74 C190 148 262 40 442 116 S720 176 924 74 S1260 38 1440 128 S1740 164 1920 62" stroke="#123f30" stroke-width="26" opacity="0.48"/>',
    '<path d="M0 76 C190 150 262 42 442 118 S720 178 924 76 S1260 40 1440 130 S1740 166 1920 64" stroke="#4a8a63" stroke-width="4" opacity="0.32"/>',
    '<path d="M160 0 V136 L224 198 V334" stroke="#123d2d" stroke-width="12" opacity="0.72"/>',
    '<path d="M780 0 V116 L724 184 V292" stroke="#174b36" stroke-width="10" opacity="0.58"/>',
    '<path d="M1274 0 V128 L1336 206 V306" stroke="#174a35" stroke-width="12" opacity="0.58"/>',
    '<path d="M1786 0 V152 L1722 218 V366" stroke="#123d2d" stroke-width="12" opacity="0.72"/>',
    "</g>",
  ];

  for (const [x, height] of [
    [96, 122],
    [284, 78],
    [548, 146],
    [844, 106],
    [1108, 152],
    [1488, 118],
    [1816, 144],
  ]) {
    parts.push(rect(x, 0, 5, height, "#315f45", ' opacity="0.42"'));
    parts.push(rect(x + 5, height - 8, 8, 8, "#69b276", ' opacity="0.34"'));
  }

  for (const [x, y, scale, color] of [
    [202, 516, 2, "#70dfa0"],
    [350, 248, 1, "#6cdeb9"],
    [626, 534, 2, "#91e87c"],
    [902, 238, 1, "#72e0b4"],
    [1190, 502, 2, "#80e890"],
    [1452, 266, 1, "#63d9ae"],
    [1690, 520, 2, "#8ae77e"],
  ]) {
    parts.push(caveMushroom(x, y, scale, color));
  }

  for (const [x, y] of [
    [118, 428],
    [252, 382],
    [408, 486],
    [716, 202],
    [808, 430],
    [1074, 312],
    [1262, 444],
    [1396, 192],
    [1578, 388],
    [1772, 286],
    [1860, 470],
  ]) {
    parts.push(rect(x, y, 4, 4, "#8df5b1", ' opacity="0.6"'));
    parts.push(rect(x + 5, y - 4, 2, 2, "#c5ffd4", ' opacity="0.72"'));
  }

  return svg(
    "Green Mushroom Cave deep root and luminous mushroom midground parallax layer",
    parts.join(""),
  );
}

function cavePlatform(centerX, top, width, depth) {
  const x = centerX - width / 2;
  const bottom = Math.min(HEIGHT, top + depth);
  const inset = width === WIDTH ? 0 : Math.min(58, Math.round(width * 0.1));
  const parts = [
    `<g data-platform-top="${top}" data-platform-x="${centerX}" data-platform-width="${width}">`,
    rect(x, top, width, 8, "#0b261b"),
    rect(x + 3, top, width - 6, 4, "#86db63"),
    rect(x + 8, top + 4, width - 16, 5, "#2f8c54"),
    polygon(
      `${x + 4},${top + 9} ${x + width - 4},${top + 9} ${x + width - inset},${bottom} ${x + inset},${bottom}`,
      "#153d29",
    ),
    polygon(
      `${x + 12},${top + 11} ${x + width - 12},${top + 11} ${x + width - inset - 10},${Math.min(bottom, top + 28)} ${x + inset + 10},${Math.min(bottom, top + 28)}`,
      "#6aa64e",
      ' opacity="0.56"',
    ),
  ];

  const gillEnd = Math.min(bottom - 2, top + 34);
  for (let gillX = x + 24; gillX < x + width - 18; gillX += 34) {
    parts.push(rect(gillX, top + 10, 4, Math.max(4, gillEnd - top - 10), "#b7d36a", ' opacity="0.42"'));
  }
  for (let vineX = x + 54; vineX < x + width - 30; vineX += 108) {
    const vineHeight = 16 + ((vineX / 18) % 3) * 8;
    parts.push(rect(vineX, bottom, 4, Math.min(vineHeight, HEIGHT - bottom), "#235c39"));
  }
  parts.push("</g>");
  return parts.join("");
}

function cavePortalSocket(id, x, baseY) {
  return [
    `<g data-portal-id="${id}" data-portal-x="${x}" data-portal-y="${baseY}">`,
    `<ellipse cx="${x}" cy="${baseY - 50}" rx="38" ry="52" fill="#071d16" stroke="#315e3b" stroke-width="10"/>`,
    `<ellipse cx="${x}" cy="${baseY - 50}" rx="30" ry="44" fill="none" stroke="#8ed96b" stroke-width="4" opacity="0.78"/>`,
    rect(x - 48, baseY - 4, 96, 4, "#142b1c"),
    "</g>",
  ].join("");
}

function caveForegroundSvg() {
  const parts = [
    cavePlatform(960, 610, 1920, 110),
    cavePlatform(1490, 453, 570, 74),
    cavePlatform(880, 474, 300, 64),
    cavePlatform(730, 338, 500, 72),
    cavePlatform(300, 218, 320, 64),
    cavePlatform(1320, 168, 720, 70),
    cavePortalSocket("cave-city-ground", 145, 610),
    cavePortalSocket("cave-city-upper", 1680, 180),
    cavePortalSocket("cave-ant-nest", 880, 350),
    cavePortalSocket("cave-patience-forest", 300, 230),
    caveMushroom(392, 316, 1, "#8aeb78"),
    caveMushroom(805, 588, 1, "#74de9b"),
    caveMushroom(1274, 431, 1, "#92e873"),
    caveMushroom(1470, 146, 1, "#72deb1"),
    caveMushroom(1802, 588, 1, "#89e77e"),
  ];

  return svg(
    "Green Mushroom Cave collision-aligned luminous mushroom platform foreground layer",
    parts.join(""),
  );
}

const dungeonLayerConfigs = {
  "crystal-ant-nest": {
    title: "Crystal Ant Nest",
    palette: ["#21150d", "#4f3219", "#b7863e", "#65d7c1"],
    platforms: [
      [960, 610, 1920, 110],
      [510, 448, 420, 74],
      [1050, 318, 440, 72],
      [1570, 458, 380, 72],
    ],
    portals: [["ant-nest-cave", 105, 610], ["ant-nest-clockwork", 1815, 610]],
    climbables: [["ant-nest-rope", 350, 458, 610, 14]],
  },
  "clockwork-tower": {
    title: "Clockwork Toy Tower",
    palette: ["#11182b", "#34334b", "#b18544", "#89cfe7"],
    platforms: [
      [960, 610, 1920, 110],
      [430, 448, 360, 70],
      [950, 298, 430, 72],
      [1510, 448, 430, 70],
    ],
    portals: [["clockwork-ant-nest", 105, 610], ["clockwork-coral-temple", 1815, 610]],
    climbables: [["clockwork-rope", 300, 458, 610, 14]],
  },
  "sunken-coral-temple": {
    title: "Sunken Coral Temple",
    palette: ["#062733", "#15566a", "#5fb6b1", "#ef9d91"],
    platforms: [
      [960, 610, 1920, 110],
      [540, 448, 500, 72],
      [960, 288, 400, 68],
      [1370, 448, 500, 72],
    ],
    portals: [["coral-temple-clockwork", 105, 610], ["coral-temple-ember-mine", 1815, 610]],
    climbables: [["coral-temple-rope", 340, 458, 610, 14]],
  },
  "ember-mine": {
    title: "Ember Mine",
    palette: ["#1b1719", "#443033", "#d96b2d", "#4f8ed8"],
    platforms: [
      [960, 610, 1920, 110],
      [430, 438, 360, 72],
      [970, 308, 480, 72],
      [1550, 438, 420, 72],
    ],
    portals: [["ember-mine-coral-temple", 105, 610], ["ember-mine-library", 1815, 610]],
    climbables: [["ember-mine-rope", 300, 448, 610, 14]],
  },
  "moonlit-arcane-library": {
    title: "Moonlit Arcane Library",
    palette: ["#10152c", "#2d2852", "#7d6fc0", "#e7d18c"],
    platforms: [
      [960, 610, 1920, 110],
      [470, 468, 430, 70],
      [1010, 338, 430, 70],
      [1550, 218, 430, 68],
    ],
    portals: [
      ["library-ember-mine", 105, 610],
      ["library-city", 1815, 610],
      ["library-duel-ground", 1550, 230],
    ],
    climbables: [["library-rope", 300, 478, 610, 14]],
  },
  "infinite-duel-ground": {
    title: "Infinite Duel Ground",
    palette: ["#100e13", "#24232c", "#9b4e3f", "#f0c67b"],
    platforms: [
      [960, 610, 1920, 110],
      [480, 458, 360, 52],
      [980, 448, 420, 54],
      [1520, 458, 360, 52],
      [690, 298, 360, 48],
      [1310, 288, 420, 48],
    ],
    portals: [["duel-ground-library", 105, 610]],
    climbables: [["duel-ground-rope", 350, 468, 610, 14]],
  },
};

function dungeonPlatform(centerX, top, width, depth, palette, index) {
  const [shadow, body, edge, accent] = palette;
  const x = centerX - width / 2;
  const bottom = Math.min(HEIGHT, top + depth);
  const inset = width === WIDTH ? 0 : Math.min(42, Math.round(width * 0.09));
  const parts = [
    `<g data-platform-top="${top}" data-platform-x="${centerX}" data-platform-width="${width}">`,
    rect(x, top, width, 8, shadow),
    rect(x + 3, top + 2, width - 6, 4, edge),
    polygon(
      `${x + 4},${top + 8} ${x + width - 4},${top + 8} ${x + width - inset},${bottom} ${x + inset},${bottom}`,
      body,
    ),
    rect(x + inset, top + 12, Math.max(1, width - inset * 2), 4, accent, ' opacity="0.45"'),
  ];
  for (let detailX = x + 28; detailX < x + width - 18; detailX += 54) {
    const height = 10 + ((detailX + index * 13) % 3) * 6;
    parts.push(rect(detailX, top + 20, 5, Math.min(height, bottom - top - 22), shadow, ' opacity="0.62"'));
  }
  parts.push("</g>");
  return parts.join("");
}

function dungeonPortalSocket(id, x, baseY, palette) {
  const [shadow, body, edge, accent] = palette;
  return [
    `<g data-portal-id="${id}" data-portal-x="${x}" data-portal-y="${baseY}">`,
    `<ellipse cx="${x}" cy="${baseY - 50}" rx="37" ry="52" fill="${shadow}" stroke="${body}" stroke-width="10"/>`,
    `<ellipse cx="${x}" cy="${baseY - 50}" rx="28" ry="42" fill="none" stroke="${accent}" stroke-width="4" opacity="0.82"/>`,
    `<circle cx="${x}" cy="${baseY - 50}" r="8" fill="${edge}" opacity="0.72"/>`,
    rect(x - 46, baseY - 4, 92, 4, shadow),
    "</g>",
  ].join("");
}

function dungeonClimbable(id, x, top, bottom, width, palette) {
  const [shadow, body, edge, accent] = palette;
  const parts = [
    `<g data-climbable-id="${id}" data-climbable-kind="rope" data-climbable-x="${x}" data-climbable-top="${top}" data-climbable-bottom="${bottom}" data-climbable-width="${width}">`,
    rect(x - 3, top, 6, bottom - top, shadow),
    rect(x - 2, top, 4, bottom - top, body),
    rect(x - 1, top, 1, bottom - top, accent, ' opacity="0.8"'),
  ];
  for (let knotY = top + 12; knotY < bottom; knotY += 14) {
    parts.push(`<circle cx="${x}" cy="${knotY}" r="4" fill="${edge}" stroke="${shadow}" stroke-width="2"/>`);
  }
  parts.push("</g>");
  return parts.join("");
}

function dungeonForegroundSvg(config) {
  const parts = config.platforms.map((platform, index) =>
    dungeonPlatform(...platform, config.palette, index),
  );
  parts.push(
    ...config.portals.map(([id, x, y]) => dungeonPortalSocket(id, x, y, config.palette)),
    ...config.climbables.map((climbable) => dungeonClimbable(...climbable, config.palette)),
  );
  return svg(`${config.title} collision-aligned platform foreground layer`, parts.join(""));
}

const PATIENCE_FOREST_HEIGHT = 1440;

function patienceForestPlatform(centerX, top, width, depth, index) {
  const x = centerX - width / 2;
  const bottom = Math.min(PATIENCE_FOREST_HEIGHT, top + depth);
  const inset = width === WIDTH ? 0 : Math.min(34, Math.round(width * 0.12));
  const parts = [
    `<g data-platform-top="${top}" data-platform-x="${centerX}" data-platform-width="${width}">`,
    rect(x, top, width, 8, "#10281e"),
    rect(x + 3, top + 2, width - 6, 4, "#84b84f"),
    polygon(
      `${x + 4},${top + 8} ${x + width - 4},${top + 8} ${x + width - inset},${bottom} ${x + inset},${bottom}`,
      index % 2 === 0 ? "#3f2c1c" : "#4a321d",
    ),
    rect(x + inset, top + 13, Math.max(1, width - inset * 2), 5, "#71943d", ' opacity="0.55"'),
  ];
  for (let knotX = x + 24; knotX < x + width - 16; knotX += 48) {
    parts.push(`<circle cx="${knotX}" cy="${top + 25}" r="5" fill="#24180f" opacity="0.72"/>`);
  }
  if (width !== WIDTH) {
    parts.push(
      `<path d="M${x + inset} ${bottom - 4} Q${x + width / 2} ${bottom + 20 + index * 2} ${x + width - inset} ${bottom - 4}" fill="none" stroke="#243a20" stroke-width="6"/>`,
    );
  }
  parts.push("</g>");
  return parts.join("");
}

function patienceForestPortalSocket(id, x, baseY) {
  return [
    `<g data-portal-id="${id}" data-portal-x="${x}" data-portal-y="${baseY}">`,
    `<ellipse cx="${x}" cy="${baseY - 50}" rx="36" ry="51" fill="#071a16" stroke="#496b34" stroke-width="10"/>`,
    `<ellipse cx="${x}" cy="${baseY - 50}" rx="27" ry="41" fill="none" stroke="#d2a94f" stroke-width="4" opacity="0.86"/>`,
    `<circle cx="${x}" cy="${baseY - 50}" r="7" fill="#f2d878" opacity="0.8"/>`,
    rect(x - 46, baseY - 4, 92, 4, "#10231a"),
    "</g>",
  ].join("");
}

function patienceForestClimbable(id, kind, x, top, bottom, width) {
  const parts = [
    `<g data-climbable-id="${id}" data-climbable-kind="${kind}" data-climbable-x="${x}" data-climbable-top="${top}" data-climbable-bottom="${bottom}" data-climbable-width="${width}">`,
  ];
  parts.push(rect(x - 3, top, 6, bottom - top, "#b18b50"));
  for (let y = top + 14; y < bottom; y += 28) {
    parts.push(`<circle cx="${x}" cy="${y}" r="6" fill="#6f4b2b"/>`);
  }
  parts.push("</g>");
  return parts.join("");
}

function patienceForestHazardMarker(id, kind, x, y, width, height) {
  return `<g data-hazard-id="${id}" data-hazard-kind="${kind}" data-hazard-x="${x}" data-hazard-y="${y}" data-hazard-width="${width}" data-hazard-height="${height}"></g>`;
}

function patienceForestForegroundSvg() {
  const platforms = [
    [960, 1330, 1920, 110],
    [250, 1220, 105, 56], [410, 1150, 90, 54], [570, 1210, 80, 52],
    [730, 1110, 84, 54], [890, 1030, 78, 52], [1050, 1100, 82, 52],
    [1210, 1000, 78, 52], [1370, 910, 82, 52], [1530, 980, 76, 50],
    [1690, 870, 92, 56], [1690, 670, 96, 58], [1510, 590, 82, 52],
    [1330, 660, 76, 50], [1150, 560, 84, 54], [970, 470, 80, 52],
    [830, 310, 100, 58], [650, 230, 80, 52], [470, 300, 76, 50],
    [300, 200, 84, 54], [180, 120, 110, 60],
  ];
  const parts = platforms.map((platform, index) =>
    patienceForestPlatform(...platform, index),
  );
  parts.push(
    patienceForestPortalSocket("patience-forest-cave", 105, 1330),
    patienceForestPortalSocket("patience-forest-summit", 180, 132),
    patienceForestClimbable("patience-rope-entry", "rope", 250, 1230, 1330, 14),
    patienceForestClimbable("patience-rope-lower", "rope", 1770, 680, 900, 14),
    patienceForestClimbable("patience-rope-middle", "rope", 830, 320, 510, 14),
    patienceForestClimbable("patience-rope-summit", "rope", 180, 130, 240, 14),
  );
  for (const hazard of [
    ["patience-log-1", "swingingLog", 650, 1170, 76, 28],
    ["patience-thorn-1", "thornOrb", 980, 1060, 38, 38],
    ["patience-acorn-1", "fallingAcorn", 1290, 965, 34, 46],
    ["patience-thorn-2", "thornOrb", 1590, 900, 40, 40],
    ["patience-log-2", "swingingLog", 1570, 720, 82, 28],
    ["patience-acorn-2", "fallingAcorn", 1260, 610, 36, 48],
    ["patience-log-3", "swingingLog", 960, 520, 74, 26],
    ["patience-thorn-3", "thornOrb", 620, 375, 38, 38],
    ["patience-thorn-4", "thornOrb", 400, 245, 36, 36],
    ["patience-acorn-3", "fallingAcorn", 230, 150, 34, 46],
  ]) {
    parts.push(patienceForestHazardMarker(...hazard));
  }
  return svg(
    "Patience Forest collision-aligned climbing challenge foreground layer",
    parts.join(""),
    WIDTH,
    PATIENCE_FOREST_HEIGHT,
  );
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../assets/maps/layers");
mkdirSync(outputDirectory, { recursive: true });

for (const [filename, source] of [
  ["kerning-city-midground-v1.svg", midgroundSvg()],
  ["kerning-city-foreground-v1.svg", foregroundSvg()],
  ["mushroom-cave-midground-v1.svg", caveMidgroundSvg()],
  ["mushroom-cave-foreground-v1.svg", caveForegroundSvg()],
  ...Object.entries(dungeonLayerConfigs).map(([slug, config]) => [
    `${slug}-foreground-v1.svg`,
    dungeonForegroundSvg(config),
  ]),
  ["patience-forest-foreground-v1.svg", patienceForestForegroundSvg()],
]) {
  const outputPath = resolve(outputDirectory, filename);
  writeFileSync(outputPath, source, "utf8");
  console.log(`Generated ${outputPath}`);
}

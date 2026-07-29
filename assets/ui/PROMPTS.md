# Screen Background Prompts

## 생성 방식

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 출력: 생성 원본 PNG 보존 후 1280×720 WebP로 중앙 크롭
- 정책: 아래 텍스트 규격과 현재 프로젝트 에셋만 사용하며 로고·문자·기존 장면을 복제하지 않음
- 스킬 아이콘의 정규화 PNG는 픽셀 감사 기준으로만 보존한다. `npm run assets:webp`로 같은
  stem의 lossless WebP를 만들고 Vite·DOM·`dist/`에는 WebP만 사용한다.

## Login Background v1

```text
Use case: stylized-concept
Asset type: production PC web game login-screen background
Primary request: an original nostalgic 16:9 2D side-scrolling fantasy RPG login background plate for real HTML inputs and buttons
Scene/backdrop: a large open antique storybook with cream parchment, warm gold corner guards, dark wooden base, and a lush whimsical forest painted inside; old tree and colorful mushrooms on the left, soft clearing and turquoise sky on the right
Style/medium: polished hand-painted 2D game background with crisp pixel-art-like edges and early-2000s PC fantasy RPG warmth
Composition/framing: keep the central-right 42% calm and low-detail for an HTML login panel; preserve the book border on all sides after center crop
Constraints: no characters, interface panel, fields, buttons, text, letters, numbers, logos, trademarks, watermark, branding, or copied scene
```

## Character Selection Background v1

```text
Use case: stylized-concept
Asset type: production PC web game character-selection background
Primary request: an original nostalgic 16:9 2D side-scrolling fantasy RPG character-selection background plate
Scene/backdrop: bright blue sky, soft clouds, distant green treetops, and an original wooden sky-dock platform spanning the lower third with ropes and brass brackets
Style/medium: polished hand-painted 2D game background with crisp pixel-art-like edges and early-2000s PC fantasy RPG mood
Composition/framing: reserve the left 38% for an HTML information panel and an open area around x=66%, y=55% for one character sprite; keep a consistent platform baseline
Constraints: no characters, silhouettes, interface panels, buttons, text, letters, numbers, logos, trademarks, watermark, branding, or copied scene
```

## P11 스킬 아이콘 6종 v1

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 출력: 각 아이콘별 크로마 원본을 보존하고 배경 제거 후 128×128 RGBA PNG로 point 축소

각 아이콘은 다음 공통 블록과 스킬별 `Primary request`를 조합해 서로 독립적으로 생성했다.

```text
Use case: stylized-concept
Asset type: game UI active/passive-skill icon source for a PC 2D side-scrolling RPG
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background covering every gap and corner, with no shadow, gradient, texture, floor, or lighting variation.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG UI mood, limited 16-24 color palette, hard pixel clusters, strong readable silhouette at 46x46 display size.
Composition/framing: square canvas, centered subject occupying about 72% of the canvas, generous uniform padding, icon only with no frame.
Constraints: no UI border, logo, trademark, watermark, scenery, or soft painterly glow; do not use #00ff00 anywhere in the subject; perfectly uniform chroma-key background.
Avoid: recognizable copyrighted skill icons, character portrait, grid, multiple panels, anti-aliased blurry edges.
```

```text
Lucky Seven: two compact cyan crystalline throwing stars crossing behind exactly one clearly readable angular numeral "7" made from teal-white light; no other text, letters, or numbers.
Drain: one emerald-black rune throwing star pulling exactly three compact pale-green life-energy wisps into its center; no hands, character, bottle, heart, blood, or skull.
Avenger: one ornate violet-and-gold winged four-point throwing star cutting through exactly three small aligned dark-violet target silhouettes with one bright purple trajectory; no angel or bird.
Keen Sight: one angular luminous teal iris focused on a small silver-blue throwing star flying into the distance with two short cyan streaks; no face or character.
Critical Throw: one sharp silver throwing star striking through a compact crimson-and-gold angular critical burst with a few gold spark pixels; no blood.
Shadow Breathing: one violet-black empty hood silhouette surrounding a calm cyan-white spiral breath rune and two restrained gold rune sparks; no visible face, skull, person, hands, or body.
```

## P12 호카게 스킬 아이콘 4종 v1

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 출력: 각 1254×1254 `#ff00ff` 크로마 원본을 보존하고 배경 제거 후 128×128 RGBA PNG로 point 축소
- 정책: 사용자 참고 이미지는 기술의 색감·운동감 분석에만 사용하고 원작 캐릭터·문양·아이콘은 복제하지 않음

```text
Use case: stylized-concept
Asset type: game UI active/passive-skill icon source for a PC 2D side-scrolling RPG
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background covering every gap and corner, with no shadow, gradient, texture, floor, or lighting variation.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG UI mood, limited palette, hard pixel clusters, strong readable silhouette at 46x46 display size.
Composition/framing: square canvas, exactly one centered subject occupying about 70-72% of the canvas, generous uniform padding, no frame.
Constraints: no text, letters, numbers, UI border, scenery, logo, trademark, or watermark; do not use #ff00ff in the subject.
Avoid: Naruto, recognizable copyrighted anime skill icons, copied symbols or costumes, multiple panels, painterly or blurry rendering.
```

```text
Rasengan: one original cyan-white spiral energy sphere with three curved turquoise rotation blades, a brilliant center, and restrained square sparks; no hand or character.
Nine Tails Transformation: one empty charcoal ninja silhouette surrounded by an amber-red chakra mantle and exactly five clearly separated tail-flame arcs; no visible face, eyes, or full animal.
Tailed Beast Bomb: one dense dark-indigo energy sphere with electric-cyan rim, violet-white core, amber compression cracks, and one restrained shock ring; no character, animal, mouth, or multiple orbs.
Sage Mode: one empty dark-indigo hooded torso encircled by a calm teal regeneration aura, two leaf-like energy wisps, and five gold restorative rune sparks; no face, eye symbol, frog, or character portrait.
```

## P14 호카게 시네마틱 2×2 아틀라스 v1

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 출력: 생성 PNG를 1280×720으로 정규화한 뒤 quality 38 WebP로 변환
- 정책: 추상 에너지 배경만 생성하고 캐릭터·문자·원작 문양은 포함하지 않음

```text
Use case: stylized-concept
Asset type: production full-screen cinematic background atlas for a PC 2D side-scrolling action RPG
Primary request: Create exactly one clean 2 columns by 2 rows atlas of four different spectacular abstract ninja-energy attack backgrounds, one complete 16:9 composition per equal cell.
Cell order: top-left is a huge cyan-white rotating spiral sphere with concentric wind rings and speed shards; top-right is an amber-orange multi-tail flame eruption around an empty dark center; bottom-left is a dense black-violet energy orb colliding with an electric-blue shock front; bottom-right is a three-way cyan, gold, and crimson trajectory collision with a brilliant white impact center.
Style/medium: high-impact polished 2D fantasy game key art, deep near-black backgrounds, bright controlled highlights, crisp particle streaks, dramatic radial motion, strong contrast under scanlines.
Composition/framing: every cell has its own centered or rule-of-thirds focal point and hard cell-safe framing; no energy crosses a cell boundary.
Constraints: backgrounds only; no people, faces, animals, hands, text, letters, numbers, UI, frame, grid line, logo, emblem, trademark, or watermark.
Avoid: Naruto, recognizable copyrighted attacks, copied anime symbols, muddy low contrast, repeated identical composition, blurred focal point.
```

## P14 삼인 협공 아이콘 v1

```text
Use case: stylized-concept
Asset type: game UI active-skill icon source for a PC 2D side-scrolling RPG
Primary request: Create one original compact team-assault emblem where a cyan throwing-star trail, a gold spiral kick arc, and a crimson angular fist-impact trail converge on one bright white-gold center.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background covering every corner and gap.
Style/medium: crisp hand-authored 2D pixel art, limited palette, hard pixel clusters, readable at 46x46.
Composition/framing: exactly one centered three-direction convergence mark occupying 72% of the square with uniform padding and no frame.
Constraints: no character, face, hand anatomy, text, letters, numbers, logo, trademark, watermark, UI border, or scenery; do not use #ff00ff in the subject.
Avoid: recognizable copyrighted team symbols or skill icons, painterly blur, multiple panels.
```

## P28 차수별 신규 액티브 스킬 아이콘 4종 v1

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 출력: 각 1254×1254 `#00ff00` 크로마 원본을 보존하고 `remove_chroma_key.py`의
  soft matte·despill 뒤 128×128 RGBA PNG로 point 축소

다음 공통 프롬프트에 스킬별 `Primary request`, `Subject`, `Lighting/mood`를 조합해 네 장을
서로 독립적으로 생성했다.

```text
Use case: stylized-concept
Asset type: game UI skill icon chroma source
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal.
Style/medium: polished 16-bit fantasy RPG pixel art, 16-24 hard colors, crisp square pixel clusters, no antialias-like blur.
Composition/framing: single centered icon, square canvas, generous empty border of at least 12 percent on every edge, strong silhouette legible at 46x46.
Constraints: one uniform #00ff00 background with no gradients, shadows, texture, floor, reflection, or lighting variation; do not use #00ff00 in the subject; no frame; no text; no numbers; no character; no face; no logo; no watermark.
Avoid: realistic rendering, soft brushwork, background scene, border, cropped glow, trademarked symbols.
```

```text
Shadow Volley
Primary request: Create an original pixel-art icon for the skill "그림자 연사": three small four-point throwing stars firing in a rapid diagonal sequence with three short motion streaks.
Subject: three compact silver and icy-cyan throwing stars, clearly separated but reading as one centered volley silhouette.
Lighting/mood: bright icy-cyan highlights, deep navy outline, fast and precise.

Phantom Stars
Primary request: Create an original pixel-art icon for the skill "환영 쌍성": two four-point throwing stars crossing in opposite directions with offset phantom afterimages.
Subject: two silver throwing stars with crimson-magenta edges, pale metallic centers, and two short staggered ghost trails, forming one centered crossed silhouette.
Lighting/mood: red-magenta energy with cool silver highlights, elusive and lethal.

Abyss Rain
Primary request: Create an original pixel-art icon for the skill "심연 폭우": one large purple four-point throwing star above, shedding three sharply separated downward projectile trails like a dark rain.
Subject: a central violet-and-gold throwing star with three branching indigo rain streaks, unified into one compact downward-moving silhouette.
Lighting/mood: deep violet energy, restrained gold sparks, heavy and arcane.

Thunder Orb
Primary request: Create an original pixel-art icon for the skill "천뢰옥": a compact cyan energy orb wrapped by two angular golden lightning rings.
Subject: one bright cyan-white orb with a deep teal core, encircled by sharp gold lightning arcs; original silhouette unrelated to any existing franchise symbol.
Lighting/mood: charged cyan and gold, concentrated thunder energy, powerful and clean.
```

## P46 gameplay HUD panel v1

- 생성 방식: built-in imagegen
- 생성 원본: `source/hud-metal-panel-v1-source.png` (1254×1254)
- 런타임 프레임: `panels/hud-metal-panel-v1.webp` (96×96, lossless WebP)
- 런타임 내부 표면: `panels/hud-metal-surface-v1.webp` (96×96, 중앙 저대비 영역 파생, lossless WebP)

```text
Use case: stylized-concept
Asset type: reusable 9-slice PC game HUD panel texture
Primary request: Create one square dark gunmetal HUD panel background for a 2D side-scrolling fantasy action RPG. It must work when resized as a 9-slice panel for minimap, controls, quest, boss, status cells, meters, and skill slots.
Subject: one perfectly front-facing square panel filling the entire canvas edge-to-edge, with a precise symmetrical industrial metal frame, compact reinforced corners, uniform straight edge strips, and a calm dark blue-charcoal center field.
Style/medium: polished 2D raster game UI, pixel-art-inspired but high-resolution and crisp, restrained industrial fantasy, subtle brushed steel and oxidized blue-gray metal, readable over detailed game backgrounds.
Composition/framing: exact 1:1 square; panel touches all four canvas edges; identical border thickness on every side, approximately 16% of the image width; corners occupy equal squares; edge-middle strips remain visually uniform so they can be stretched; center is flat and uncluttered.
Lighting/mood: subtle cool top-edge highlight and dark inset bevel, even front lighting, no directional scene lighting.
Color palette: charcoal #10191f, blue-gray #263c46, muted steel #789093, small pale silver highlights; no bright saturated colors.
Materials/textures: restrained brushed metal and tiny rivet details only in the four corner zones; center texture extremely subtle and low contrast.
Constraints: exactly one panel only; no text, no glyphs, no icons, no logo, no watermark, no characters, no separate objects, no mockup, no perspective, no drop shadow outside the panel, no transparent margin, no rounded outer silhouette, no gradient or decorative mark in the center. The outermost pixels must belong to the panel frame on all four sides. Preserve strict bilateral and rotational symmetry.
```

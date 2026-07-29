# Map Background Prompts

## 생성 방식

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 출력: 생성 원본 PNG 보존 후 1280×720 WebP로 중앙 크롭
- 정책: 아래 텍스트 규격과 현재 프로젝트 에셋만 사용하며 기존 장면, 로고, 문자를 복제하지 않음

## Kerning City v1

```text
Use case: stylized-concept
Asset type: production 16:9 side-scrolling PC web game environment background
Primary request: an original nostalgic industrial night city for a 2D fantasy RPG town
Scene/backdrop: dark teal brick alleys, layered steel pipes, vents, restrained amber and violet lights, a continuous walkable street along the bottom, a small left doorway for an interior portal, and a distant right exit for a cave route
Style/medium: polished hand-painted pixel-art-like environment with crisp shapes and readable depth
Composition/framing: side-on orthographic game view; reserve the upper strip for HUD; keep the lower ground silhouette continuous and portal areas uncluttered
Constraints: no characters, monsters, UI, text, letters, numbers, logos, trademarks, watermark, branding, or copied scene
```

## Shadow Hideout v1

```text
Use case: stylized-concept
Asset type: production 16:9 side-scrolling PC web game interior background
Primary request: an original underground shadow guild training hideout belonging to the industrial town
Scene/backdrop: old brick, heavy pipes, chains, practice dummies, a central training platform, a clear arched doorway on the left, and a raised curtained mentor alcove on the right
Style/medium: polished hand-painted pixel-art-like environment, moody blue-violet lighting, warm practical lamps
Composition/framing: side-on view with one continuous walkable floor; open space at the left spawn and right NPC position; reserve upper strip for HUD
Constraints: no characters, silhouettes, UI, text, letters, numbers, logos, trademarks, watermark, branding, or copied scene
```

## Mushroom Cave v1

```text
Use case: stylized-concept
Asset type: production 16:9 side-scrolling PC web game hunting-area background
Primary request: an original lush green mushroom cavern with a vertical platform route
Scene/backdrop: enormous tree roots enclosing a deep cave, glowing green vegetation, colorful mushrooms, layered rock-and-root ledges, a continuous ground route, and clear portal sockets near the lower-left and upper-right
Style/medium: polished hand-painted pixel-art-like environment with crisp platform silhouettes and luminous fantasy depth
Composition/framing: side-on game view; readable staggered ledges from lower left toward upper right; leave combat areas uncluttered and reserve upper strip for HUD
Constraints: no characters, monsters, UI, text, letters, numbers, logos, trademarks, watermark, branding, or copied scene
```

## Shadow Trial v1

```text
Use case: stylized-concept
Asset type: production wide pixel-art background for a 16:9 side-scrolling PC RPG dungeon
Primary request: an original ancient underground Shadow Trial hall
Scene/backdrop: dark teal-black masonry, vast recessed arches, cyan runes, hanging chains,
distant stone bridges, subtle purple abyss light, drifting dust, and a sealed violet rune gate
Composition/framing: strong atmospheric depth, quiet lower gameplay floor and central lanes,
useful scene concentrated in the wide middle band for 1280x720 normalization
Constraints: no characters, monsters, collision-implying platforms, UI, text, logos, frame, or border
```

## P15 Dungeon Circuit v1

공통 규격:

```text
Use case: stylized-concept
Asset type: 16:9 background plate for an original 2D side-scrolling fantasy MMORPG dungeon
Style/medium: polished hand-painted pixel-art-inspired game background, nostalgic early-2000s Korean side-scrolling RPG atmosphere, crisp readable silhouettes, original design
Composition/framing: exact wide side-on orthographic view, deep parallax-ready backdrop, strongest detail in middle and upper background, keep the lower 22% visually quiet for a separate collision-aligned foreground layer
Constraints: no characters, monsters, UI, text, logos, readable signs, portals, trademarked characters or exact game locations, perspective floor, or dominant walkable ledges in the backdrop
```

개별 장면:

- `crystal-ant-nest-v1`: warm amber underground colony, huge roots, rounded earthen tunnels,
  bioluminescent fungi, distant honeycomb chambers, turquoise crystal veins.
- `clockwork-tower-v1`: whimsical tower interior, giant original gears, pendulums, toy blocks,
  winding springs and distant numberless clock faces; midnight blue, burgundy and brass.
- `sunken-coral-temple-v1`: flooded ancient ruin, distant stone arches, coral gardens, bubbles
  and light shafts; teal, sapphire, coral pink and sandstone.
- `ember-mine-v1`: volcanic mine, distant rail bridges, iron machinery silhouettes, magma seams,
  ore and sparks; charcoal, ember orange, molten gold and cobalt.
- `moonlit-arcane-library-v1`: enchanted underground archive, towering bookshelves, floating
  pages, crescent windows, stained glass and constellations; indigo, plum, silver blue and gold.

## P22 Infinite Duel Ground v1

```text
Use case: stylized-concept
Asset type: production 16:9 side-scrolling PC web game environment background
Primary request: Create an original final-boss arena called the Infinite Duel Ground, designed for exactly one giant boss and one player.
Scene/backdrop: a vast silent impact crater at the edge of a ruined otherworldly city, distant broken monoliths and ring-shaped shockwave scars, a pale dawn sky grading into deep red at the horizon, subtle drifting dust, and one continuous broad dark-stone combat floor across the bottom; a small clear portal alcove only at the far left.
Subject: environment only, no people, heroes, monsters, creatures, silhouettes, statues, or portraits.
Style/medium: polished hand-painted pixel-art-like environment with crisp shapes and readable side-scrolling depth, nostalgic early-2000s Korean PC RPG mood.
Composition/framing: exact 16:9 landscape, side-on orthographic game view, very wide uncluttered center stage for a towering boss, reserve the upper strip for HUD, keep the lower 22 percent low-detail for collision foreground alignment, keep the far-left portal area visually clear.
Lighting/mood: apocalyptic stillness before a decisive duel, high contrast silhouette, restrained pale gray, charcoal, ember red, and muted gold palette.
Constraints: no characters, monsters, people, caped figures, UI, text, letters, numbers, logos, trademarks, watermark, visible game portal, floating platforms, or copied anime/game scenery; no foreground object that blocks the central combat lane.
Avoid: recognizable locations from One Punch Man or other anime, poster layouts, title cards, close-up objects, busy center, modern signs, readable writing.
```

## P34 Patience Forest v1

```text
Use case: stylized-concept
Asset type: 1280×720 desktop side-scrolling game map background plate
Primary request: Create an original pixel-art forest endurance challenge environment, inspired by the idea of a classic Korean fantasy platforming jump trial but not copying any existing game artwork or layout.
Scene/backdrop: Deep enchanted forest interior with colossal mossy tree trunks, layered dark teal foliage, tangled vines, subtle waterfalls and mist in the distance, warm amber fireflies, and a mysterious carved tree gate at the far right.
Style/medium: polished 16-bit pixel art, crisp nearest-neighbor pixel clusters, cohesive game background, no painterly blur.
Composition/framing: very wide side-view scene, strong horizontal depth layers, open central play space; keep all collision platforms and portals out of the image because deterministic SVG foreground will be overlaid separately. No characters or monsters.
Lighting/mood: cool green-blue canopy shadows with selective warm golden highlights, adventurous and tranquil.
Color palette: deep pine green, teal, moss, muted brown, pale waterfall cyan, restrained amber.
Constraints: background only; no UI, no text, no logos, no watermark, no characters, no monsters, no visible floating gameplay platforms, no imitation of copyrighted map art. Keep edges tile-friendly and visual detail readable behind sprites.
```

## P37 imagegen map object kits v1

아래 프롬프트는 built-in imagegen에 각 그룹의 `assets/maps/screens/*.webp`를 입력 순서대로
스타일 참고 이미지로 전달했다. A는 커닝시티·도적 아지트·초록버섯굴·그림자 시험장, B는
수정 개미굴·시계태엽 탑·산호 신전·잿불 광산, C는 달빛 마도서고·무한의 결투장·인내의 숲
순서다. C의 우하단 셀은 비운다.

```text
Use case: stylized-concept
Asset type: production game object sprite atlas for a 2D side-scrolling pixel-art web game
Primary request: Create distinct environment object kits matching the supplied map background references in exact input order.
Subject: Each kit contains exactly three isolated objects: one wide side-view platform tile with a perfectly flat horizontal walkable top edge, one vertical knotted rope with no ladder rungs, and one upright oval portal frame with an empty center. No ladders anywhere.
Style/medium: crisp polished pixel art matching each supplied background palette, materials and lighting; limited palette; readable silhouettes; consistent side-view game perspective.
Composition/framing: precise 2-column by 2-row grid on one square canvas, one kit per equal quadrant in reading order. Inside every occupied quadrant use the same layout: platform tile across the top half, vertical rope at lower-left, oval portal at lower-right. Keep every object fully inside its quadrant, separated with generous padding, never touching other objects or quadrant edges.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background only.
Constraints: one exact uniform background color, no background shadows, gradients, texture, reflections, floor plane or lighting variation. Never use #ff00ff in objects. No cast shadows outside objects. No text, labels, characters, monsters, weapons, UI, logos, watermarks, scenery or extra props. Platform top edges must be straight and tile-friendly. Ropes must be continuous and clearly climbable, never ladders.
```

인내의 숲 장애물 아틀라스는 같은 배경 한 장을 스타일 참고로 사용했다.

```text
Use case: stylized-concept
Asset type: production moving-hazard sprite atlas for a 2D side-scrolling pixel-art web game
Primary request: Create exactly three isolated obstacle sprites matching the supplied misty patience forest background: a heavy swinging mossy log viewed from the side, a large falling acorn, and a round thorn-covered bramble orb.
Style/medium: crisp polished pixel art matching the forest's dark wood, moss green, teal mist and warm amber highlights; limited palette; strong readable silhouettes; consistent side-view game perspective.
Composition/framing: one horizontal row on a square canvas. Log on the left, acorn in the center, thorn orb on the right. Keep every object fully visible, centered in its own equal third, separated with generous padding.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background only.
Constraints: one exact uniform background color with no shadows, gradients, texture, reflections, floor plane or lighting variation. Never use #ff00ff in objects. No cast shadows outside objects. No ropes, ladders, platforms, portals, text, labels, characters, monsters, UI, logos, watermarks, scenery or extra props.
```

## P49 imagegen portal ground FX v1

사용자 제공 포탈 캡처는 유백색·빙청색·연두색 차원 에너지의 광도와 위계 참고로만 사용했다.
문틀·금색 장식·문자·구도는 입력 에셋으로 복제하지 않고, 아래 프롬프트를 built-in imagegen에
전달해 독자적인 수평 포탈 마법진을 생성했다.

```text
Use case: stylized-concept
Asset type: 2D fantasy platform-game portal ground FX texture
Primary request: Create one original magical portal base effect to sit directly underneath an upright stone portal. It should evoke the attached reference's lavish dimensional-gate energy without copying its arch or ornaments: a bright milky white and ice-blue oval energy pool with a soft celadon-green core, two concentric arcane rings, small leaflike energy wisps, and a few crisp luminous motes. The effect must read clearly at 128x64 pixels and be suitable for additive-blend animation layers.
Scene/backdrop: perfectly flat solid pure black background (#000000), edge to edge, with no texture or gradient in the background.
Subject: only the horizontal portal-ground energy effect, viewed at a low isometric/top-down angle; no upright doorway, no stone frame, no platform, no floor.
Style/medium: polished hand-painted 2D MMORPG game VFX, slightly pixel-art-friendly edges, strong readable silhouette, bright white/cyan highlights and pale green center.
Composition/framing: centered horizontal oval, generous empty black padding, contained entirely within the canvas.
Lighting/mood: radiant magical light, energetic and ornate, high contrast against black.
Constraints: no text, no symbols resembling letters, no watermark, no logos; one isolated effect only; black background must remain perfectly black beyond the glow; avoid large smoky haze so the asset stays compact and crops cleanly.
```

# Sprite Generation Prompts

## 생성 방식

- 도구: built-in `imagegen`
- 용도 분류: `stylized-concept`
- 아래 텍스트 규격과 현재 프로젝트 에셋만 스타일·비율·환경 분위기 기준으로 사용
- 생성 크로마 원본을 보존하고 로컬에서 투명 PNG로 변환
- 정규화 PNG는 픽셀 감사 기준으로만 보존하고 `npm run assets:webp`로 같은 stem의 lossless
  WebP를 생성한다. 매니페스트·Vite·`dist/`는 WebP만 사용한다.
- 기존 게임 로고, 캐릭터·NPC·몬스터의 직접 복제를 금지

아래 공통 블록과 각 시트별 블록을 합쳐 최종 프롬프트로 사용했다.

## 공통 블록

```text
Use case: stylized-concept
Asset type: PC web 2D side-scrolling game sprite sheet
Primary request: Create one production-ready 4 columns by 4 rows sprite sheet. This must be a clean animation atlas, not a concept sheet.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, limited palette, hard pixel clusters, readable at small game scale.
Composition/framing: each pose or effect centered inside its own invisible equal cell with generous padding; no content crosses cell boundaries.
Constraints: exact 4x4 grid; no labels, no text, no grid lines, no UI, no floor, no watermark; perfectly uniform chroma-key background; no chroma color inside the subject.
Avoid: MapleStory logo, recognizable copyrighted designs, copied sprites, painterly rendering, blurry edges, isometric view, camera changes, cut-off content, merged cells.
```

## Player v1

```text
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Subject: one consistent original young adventurer in every cell, oversized head, compact body, short dark hair, teal scarf, charcoal sleeveless tunic, brown belt pouch, dark shorts and boots, small icy-blue throwing stars; side view facing right.
Grid order: row 1 idle frames 1-4; row 2 walk frames 1-4; row 3 jump rise, apex, fall, hurt recoil; row 4 basic throw wind-up, basic throw release, Lucky Seven wind-up, Lucky Seven double-release.
Invariants: preserve face, proportions, outfit and palette across all 16 frames; one complete full-body character per cell; identical scale and feet baseline.
```

## Green Mushroom v1

```text
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Subject: one consistent original cute squat green cave mushroom monster, pale beige stalk-body, moss-green cap with two small lime spots, tiny amber eyes, short feet; side view facing right.
Grid order: row 1 idle squash-and-stretch frames 1-4; row 2 walk-hop frames 1-4; row 3 hurt reaction frames 1-4; row 4 defeat frames 1-4, progressively flattening and fading.
Invariants: preserve cap shape, face, colors and proportions across all 16 frames; one complete monster per cell.
```

## Shadow Mentor v1

```text
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Subject: one consistent original shadow-guild mentor, deep navy hooded mantle, charcoal layered coat, bronze clasp, pale half-mask, black gloves, subtle violet aura only during casting; side view facing right.
Grid order: row 1 calm idle frames 1-4; row 2 speaking gestures frames 1-4; row 3 job-advancement casting frames 1-4; row 4 approval gesture frames 1-4.
Invariants: preserve identity, mask, hood, clothing and proportions across all 16 frames; one complete NPC per cell; identical scale and feet baseline.
```

## Street Healer v1

참고: `shadow-mentor-v1-chroma.png`, `player-v1-chroma.png` — 현재 프로젝트의 픽셀
밀도, 측면 비율, 셀 간격 참고만 사용하고 인물·복장·포즈는 복제하지 않음.

```text
Use case: stylized-concept
Asset type: production sprite sheet for a PC web 2D side-scrolling game
Primary request: Create exactly one 4 columns by 4 rows animation sprite sheet for one original city healer NPC. This must be a clean animation atlas, not a concept sheet.
Input images: Image 1 and Image 2 are style and scale references only. Match their crisp pixel cluster density, side-view proportions, consistent cell spacing, and early-2000s Korean PC side-scrolling RPG mood, but do not copy either character, outfit, face, or pose.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background covering every gap and corner, with no shadow, gradient, texture, grid, floor, or lighting variation.
Subject: the same original friendly adult city healer in every cell, side view facing right, warm brown bob haircut, cream nurse cap with a small original teal leaf emblem, cream long coat over muted teal clothes, brown belt satchel holding berry medicine bottles, dark brown ankle boots, kind readable face. Healing magic is cyan-white with small golden sparkles only in row 3.
Style/medium: crisp hand-authored 2D pixel art, limited palette, hard pixel clusters, strong readable silhouette at small game scale, no anti-aliased painted look.
Composition/framing: exact invisible equal 4x4 grid; one complete full-body NPC centered in each cell with generous padding; identical character scale and feet baseline across all 16 cells; no content crosses cell boundaries.
Grid order: row 1 four calm idle breathing frames; row 2 four friendly talking and open-hand gesture frames; row 3 four healing cast frames progressing from hands together to a compact cyan-white and gold restorative glow around the hands; row 4 four reassuring approval frames progressing from nod to a clear thumbs-up.
Invariants: preserve the exact same face, hairstyle, cap, leaf emblem, body proportions, outfit, satchel, boots, palette, and right-facing direction in all 16 frames.
Constraints: exact 4x4 atlas, no labels, no letters, no text, no numbers, no grid lines, no UI, no platform, no floor, no cast shadow, no watermark; do not use #ff00ff anywhere in the character or effects.
Avoid: any recognizable copyrighted character or uniform, existing game logos, copied sprites, red medical cross, real-world trademark symbols, chibi toddler proportions, painterly rendering, blurry edges, isometric view, camera changes, cut-off content, merged cells.
```

## Game Developer v1

참고 1: 사용자 지정 [`일용직 개발자 임상진` 채널](https://www.youtube.com/@limsangjin12)의
공개 프로필 이미지는 얼굴·갈색 비니·친근한 인상 참고. 참고 2:
`street-healer-v1.png`는 픽셀 밀도·측면 비율·4×4 셀 간격·발 기준선 참고만 사용하고
인물·복장·포즈는 복제하지 않음.

```text
Use case: stylized-concept
Asset type: production 4×4 NPC animation sprite sheet for a PC web 2D side-scrolling RPG
Primary request: Create exactly one square sprite sheet with 4 columns and 4 rows containing 16 separate full-body SD/chibi pixel-art sprites of the same adult male game-developer NPC. This must be a clean animation atlas, not a concept sheet.
Input images: Image 1 is the identity reference for the adult Korean man’s warm friendly face, brown knit cap, and simple dark clothing. Image 2 is only a style, pixel density, side-view scale, invisible grid, spacing, and feet-baseline reference; do not copy its healer identity, outfit, face, props, or poses.
Scene/backdrop: perfectly flat uniform fully opaque solid #FF00FF chroma-key background across every corner and gap, with no shadows, gradients, texture, grid, floor plane, borders, or lighting variation.
Subject: the same friendly adult Korean male developer in every cell, side view facing screen-right, brown knit beanie matching Image 1, black crew-neck sweater over a pale undershirt, practical charcoal work trousers, worn brown work boots, a muted teal cross-body tool pouch, and a small closed dark laptop with a cyan code-bracket sticker as an original non-branded prop. Preserve a recognizable but tastefully simplified SD adaptation of Image 1’s face and smile.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, limited palette, hard pixel clusters, strong readable silhouette at small game scale, no painterly or anti-aliased look.
Composition/framing: exact invisible equal 4×4 grid; one complete full-body character centered in each cell with generous padding; identical character scale and foot baseline in all 16 cells; no body, prop, or effect crosses a cell boundary.
Grid order: row 1 four calm idle breathing frames with the laptop tucked under one arm; row 2 four friendly talking frames with open-hand gestures; row 3 four developer frames progressing through opening the laptop, typing, checking code, and presenting the screen; row 4 four cheerful subscribe-support approval frames progressing from a small bow, friendly point forward, clear thumbs-up, and grateful two-hand gesture. No words or lettering on the screen.
Invariants: preserve the exact same face, knit cap, body proportions, outfit, pouch, boots, laptop, palette, right-facing direction, scale, and foot baseline across all 16 frames.
Constraints: exactly 16 sprites; no labels, letters, Korean text, English text, numbers, YouTube logo, play-button logo, brand marks, grid lines, UI, platform, floor, cast shadow, watermark, extra characters, or extra objects; do not use #FF00FF anywhere inside the character or prop.
Avoid: copyrighted game characters, copied sprites, real-world logos, business suit, construction hard hat, toddler proportions, painterly rendering, blurry edges, isometric view, camera changes, cropped feet, merged cells.
```

built-in imagegen의 1254×1254 결과를 `game-developer-v1-chroma.png`로 보존하고, 공식
크로마 제거 도구의 soft matte·despill 뒤 nearest-neighbor 512×512 축소와 pngquant 256색
최적화를 거쳐 `core/game-developer-v1.png`로 배포했다.

## Combat Effects v1

```text
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Grid order: row 1 icy-blue four-point throwing star spin frames 1-4; row 2 cyan-white double-hit burst growth and dissipate frames 1-4; row 3 orange-red hurt spark flash and fade frames 1-4; row 4 violet-gold job-advancement ring appear, expand and fade frames 1-4.
Invariants: one centered effect per cell; consistent scale within each row; no characters; no soft glow crossing cells.
```

## World Effects and Loot v1

```text
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Grid order: row 1 vertical cyan-white portal pulse frames 1-4; row 2 bronze fantasy coin pouch bounce and settle frames 1-4; row 3 red recovery berry bottle bounce and settle frames 1-4; row 4 green mushroom-cap drop bounce and settle frames 1-4.
Invariants: one complete object per cell; consistent scale within each row; no characters, letters, text or currency symbols.
```

## P9 전직 플레이어 3종

세 시트는 직전 플레이어 시트를 이미지 편집 입력으로 사용하고 4×4 셀·16포즈·얼굴·발 위치를
고정했다. 모든 빈 영역은 `#ff00ff` 단색 크로마로 생성했다.

```text
Rogue: preserve the exact 4x4 poses and identity; upgrade only to a deep teal hood,
midnight leather tunic, silver wrist claw, cyan scarf, and small steel throwing stars.
Assassin: preserve the grid and identity; use a crimson-black armored coat, reinforced
collar, steel dual wrist claws, red belts, cyan scarf, and electric-cyan throwing stars.
Hermit: preserve the grid and identity; use a violet-black gold-trim mantle, layered
midnight armor, glowing rune claws, violet talismans, and violet-gold throwing stars.
Constraints: one complete pose per cell, no labels, borders, UI, extra characters, or text.
```

## P12 호카게 플레이어와 차크라 효과 v1

`player-hermit-v1.png`는 4×4 포즈·셀 구조의 편집 대상으로만 사용했다. 사용자 제공
참고 이미지는 기술의 색감과 움직임 분석 자료이며, 금발·주황색 복장·이마 보호대·얼굴
문양 등 원작 캐릭터의 식별 요소는 사용하지 않았다. 두 생성 원본은 `#ff00ff` 크로마로
보존하고 배경 제거 후 512×512 RGBA PNG로 point 축소했다.

```text
Use case: stylized-concept
Asset type: production PC web 2D side-scrolling game player sprite sheet
Primary request: Edit the input atlas into one original fourth-job fox-shadow ninja while preserving the exact 4 columns by 4 rows cell layout, actions, full-body pose silhouettes, scale, right-facing direction, and feet baseline.
Subject: the same original young adult ninja in every cell, asymmetrical short dark-auburn hair, charcoal layered tunic, muted rust-red split mantle, deep-indigo trousers and boots, bronze wrist guards, teal sash, and a small abstract amber fox-tail flame cloth accent.
Grid order: row 1 idle frames 1-4; row 2 walk frames 1-4; row 3 jump rise, apex, fall, hurt recoil; row 4 chakra-claw wind-up, chakra-claw release, spinning-orb wind-up, spinning-orb release.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Constraints: exact 4x4 atlas; one complete full-body character per cell; identical identity and scale; no text, grid, UI, floor, scenery, logo, trademark, or watermark.
Avoid: Naruto or any recognizable copyrighted anime character; blond spiky hair, orange jumpsuit, forehead protector, leaf emblem, whisker cheek marks, copied costume or pose; blurry painterly rendering.
```

```text
Use case: stylized-concept
Asset type: production PC web 2D side-scrolling game effects sprite sheet
Primary request: Create exactly one 4 columns by 4 rows atlas containing four original fox-shadow ninja chakra effect animations.
Grid order: row 1 cyan-white spiral sphere, bright sphere, impact bloom, dissipating sparks; row 2 four looping frames of an amber-red transformation aura with abstract pointed ears and five tail-flame arcs around an open player center; row 3 small dark-indigo bomb, compressed bomb, cyan-violet impact, dissipating fragments; row 4 four looping frames of a calm teal-and-gold regeneration aura with leaf-like wisps around an open player center.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background.
Invariants: one centered effect per cell; consistent optical center and scale within each row; hard cell-safe margins.
Constraints: no character, face, animal body, text, grid, UI, floor, scenery, logo, trademark, or watermark.
Avoid: Naruto, recognizable copyrighted attacks or transformations, copied skill effects, nine-tailed fox character, painterly blur, glow crossing cells.
```

## Throwing Stars v1

```text
Exact 4x4 projectile atlas, one centered spinning ninja star per cell. Row 1 compact
silver-blue basic stars; row 2 cyan crystalline Lucky Seven with electric trails; row 3
emerald-black Drain rune stars with siphon wisps; row 4 ornate violet-gold Avenger stars.
Flat #ff00ff background, no characters, text, borders, grid lines, or scenery.
```

## P13 장착 표창 5등급 v1

5등급 모두 같은 틴트를 쓰지 않고 작은 전투 화면에서도 날 수·중앙 장식·외곽 형태가 구분되도록
새로 생성했다. imagegen의 1254×1254 원본은 `equipped-throwing-stars-v1-chroma.png`로 보존하고,
배경 제거 뒤 nearest-neighbor 방식으로 512×512에 정규화했다.

```text
Use case: stylized-concept
Asset type: production PC web 2D side-scrolling game projectile sprite sheet
Primary request: Create exactly one 4 columns by 4 rows animation atlas containing five distinct original throwing-star equipment grades, with one centered complete projectile in every equal cell.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every corner and gap, with no shadow, gradient, texture, floor, grid, or lighting variation.
Grid order: cells 1-3 are three spin phases of a compact four-point trainee star made from dull silver iron; cells 4-6 are three spin phases of a polished six-point steel star with a dark round hub; cells 7-9 are three spin phases of a broad cyan-jade four-blade star with a bright blue gem center; cells 10-12 are three spin phases of a serrated crimson flame star with asymmetric hooked blades and an amber core; cells 13-16 are four spin phases of an ornate black-violet eclipse ring star with gold crescent blades and a pale violet center.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, hard pixel clusters, limited palette, strong readable silhouettes at small runtime scale.
Composition/framing: exact invisible equal 4x4 grid; each projectile centered on the same optical point with generous cell-safe padding; consistent scale within each grade; show rotation only, never camera or perspective changes.
Invariants: preserve each grade's blade count, outer silhouette, central ornament, material palette, and size across its spin frames; all five grades must be unmistakably different without relying on tint alone.
Constraints: no characters, hands, text, numbers, labels, UI, borders, grid lines, logo, trademark, scenery, floor, cast shadow, or watermark; do not use #ff00ff inside any projectile.
Avoid: recognizable copyrighted weapon designs, copied game sprites, shuriken logos, photorealistic metal, painterly rendering, blurry anti-aliased edges, isometric view, merged cells, clipped blades, glow crossing cell boundaries.
```

## P14 삼인 협공 동료 시트 v1

사용자 참고 이미지는 화면 밖 진입과 공격 자세의 방향만 분석했다. 배포용은 원작 인물의
얼굴·머리·복장·문양을 복제하지 않은 독자 캐릭터 `시온`과 `하나`로 생성했다.

```text
Use case: stylized-concept
Asset type: production PC web 2D side-scrolling game ally sprite sheet
Primary request: Create exactly one 4 columns by 4 rows atlas for two original adult ninja allies who fly in, attack, and exit during a five-hit team cinematic.
Characters: Shion is a lean masked shadow thrower with short silver hair, charcoal layered coat, teal scarf, dark trousers, and small crescent throwing stars; Hana is an athletic unmasked striker with a long auburn braid, cream-and-jade sleeveless armor, bronze-jade gauntlets, and dark loose trousers.
Grid order: row 1 four right-moving airborne entry poses for Shion; row 2 two Shion throwing poses followed by two fast exit poses; row 3 two Hana airborne entry poses followed by two sweeping kick poses; row 4 two forward punch poses followed by two fast exit poses.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every cell and gap.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, limited palette, hard readable silhouettes.
Composition/framing: exact invisible equal 4x4 grid; one complete full-body character per cell; consistent identity, scale, right-facing direction, and optical center; generous cell-safe padding.
Constraints: no text, grid, border, UI, scenery, floor, logo, trademark, watermark, forehead protector, leaf emblem, copied costume, or extra character; do not use #ff00ff inside a character.
Avoid: Naruto, Sasuke, Sakura, recognizable copyrighted anime faces or costumes, black spiky rival hair, pink-haired red-dress fighter, painterly blur, merged cells, clipped limbs.
```

## Shadow Sentinel v1

```text
Exact 4x4 medium monster atlas: a hunched armored panther-like shadow guardian with dark
stone plates, cyan rune eyes, horned shoulders, and violet shadow paws. Rows are idle,
stalking walk, cyan-spark hurt, and progressive violet-smoke defeat. Face right, one full
monster per cell, consistent ground line, flat #ff00ff background, no text or scenery.
```

## Abyss Golem v1

```text
Exact 4x4 large boss atlas: a broad black-blue masonry golem with massive rune fists,
violet chest core, cyan cracks, gold seals, and shadow fire. Rows are core-pulse idle,
heavy walk, fragmenting hurt, and kneel/break/rune-flame defeat. Face right, fit safely
inside each cell for runtime upscaling, flat #ff00ff background, no text or scenery.
```

## P16 던전 보스와 원정대장 v1

세 에셋은 built-in imagegen `stylized-concept` 모드에서 새로 생성했다. 생성된 1254×1254
원본은 크로마 보존본으로 저장하고, soft matte·despill 뒤 nearest-neighbor로 512×512에
정규화했다. 원작 캐릭터·몬스터·문양은 참고하거나 복제하지 않았다.

```text
Use case: stylized-concept
Asset type: production sprite sheet for a PC web 2D side-scrolling game
Primary request: Create exactly one 4 columns by 4 rows animation atlas for one original Ember Warden mid-boss.
Subject: a quadrupedal black-iron volcanic guardian beast with a furnace-orange heart, cobalt mineral plates, compact horned head, heavy clawed feet, and no rider or equipment.
Grid order: row 1 four furnace-breathing idle frames; row 2 four right-facing heavy walk frames; row 3 two hurt recoil frames followed by two forward claw-and-ember attack frames; row 4 four progressive collapse and cooling defeat frames.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering all corners and gaps.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, limited palette, readable silhouette.
Composition/framing: exact invisible equal 4x4 grid, one complete boss per cell, consistent identity, scale, right-facing direction, optical center, and feet baseline with generous cell-safe padding.
Constraints: no text, labels, UI, grid lines, border, scenery, floor, cast shadow, logo, trademark, watermark, extra creature, rider, or element crossing cell boundaries; do not use #ff00ff inside the boss.
Avoid: recognizable copyrighted monster designs, copied game sprites, dragon wings, humanoid knight, painterly blur, camera changes, clipped limbs, merged cells.
```

```text
Use case: stylized-concept
Asset type: production sprite sheet for a PC web 2D side-scrolling game
Primary request: Create exactly one 4 columns by 4 rows animation atlas for one original Eclipse Archivist final boss.
Subject: a grounded arcane library construct wearing midnight-indigo robe-like stone armor, a crescent stone mask, layered ancient tome plates, silver lunar rings, and restrained gold sealing marks; no human face.
Grid order: row 1 four lunar-ring idle frames; row 2 four right-facing floating-step walk frames; row 3 two cracked-mask hurt frames followed by two tome-and-ring arcane attack frames; row 4 four progressive unbinding, kneeling, page-fragment, and extinguished defeat frames.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering all corners and gaps.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, limited indigo-silver-gold palette, strong silhouette at small scale.
Composition/framing: exact invisible equal 4x4 grid, one complete boss per cell, consistent identity, scale, right-facing direction, optical center, and ground baseline with generous cell-safe padding.
Constraints: no text, readable book writing, UI, grid lines, border, scenery, floor, cast shadow, logo, trademark, watermark, extra character, or effect crossing cell boundaries; do not use #ff00ff inside the boss.
Avoid: recognizable copyrighted wizard or boss designs, copied game sprites, human face, painterly blur, camera changes, clipped rings, merged cells.
```

```text
Use case: stylized-concept
Asset type: production sprite sheet for a PC web 2D side-scrolling game
Primary request: Create exactly one 4 columns by 4 rows animation atlas for one original adult woman expedition captain NPC named Sera.
Subject: the same adult woman in every cell, auburn hair tied back, teal-gray expedition coat, dark trousers and boots, compact leather satchel, brass compass, and a rolled route map; practical field leader, no mount or weapon.
Grid order: row 1 four calm idle frames; row 2 four conversational talk frames; row 3 four route-briefing frames using compass and map; row 4 four approving completion-report frames with a confident salute and closed map.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering all corners and gaps.
Style/medium: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, limited palette, clear adult proportions and readable silhouette.
Composition/framing: exact invisible equal 4x4 grid, one complete full-body NPC per cell, consistent identity, scale, right-facing direction, optical center, and feet baseline with generous cell-safe padding.
Constraints: no text, labels, UI, grid lines, border, scenery, floor, cast shadow, logo, trademark, watermark, extra person, animal, mount, or prop crossing cell boundaries; do not use #ff00ff inside the character.
Avoid: recognizable copyrighted NPC designs, copied game sprites, chibi toddler proportions, medical uniform, painterly blur, camera changes, clipped limbs, merged cells.
```

## P18 플레이어 보행 주기 v2

다섯 직업 시트는 built-in imagegen의 정밀 객체 편집 방식으로 만들었다. 각 v1 시트를
전직별 외형·장비·팔레트 참고로 사용하되 2행만 지면 보행 주기로 다시 생성했고, 최종 합성
단계에서 원본 v1의 1·3·4행을 그대로 복원했다. 생성 결과의 배경은 두 번째 편집에서 균일한
`#ff00ff`로 교체한 뒤 투명화했다.

```text
Use case: precise-object-edit
Asset type: production PC web 2D side-scrolling game player sprite sheet
Primary request: Edit only the second row of the provided 4 columns by 4 rows character atlas into a clear grounded four-step walk cycle: left-foot contact, passing pose, right-foot contact, passing pose.
Character: preserve the supplied beginner, Rogue, Assassin, Hermit, or Hokage identity exactly for its own variant, including face, hair, hood or coat, boots, weapon gear, proportions, outline, and limited palette.
Rows to preserve: row 1 idle and rows 3–4 jump, hurt, and attack must remain unchanged in pose, layout, scale, and cell placement.
Walk constraints: one complete right-facing full-body character in each cell; both boots visibly change position; contact frames show one heel forward and the other leg trailing; passing frames bring one leg under the torso; no airborne, seated, crouched, sliding, or duplicated pose; keep the same feet baseline and optical center.
Composition: exact invisible equal 4x4 grid, 128x128 logical cells, consistent character size, generous cell-safe padding, no limb or equipment crossing cell boundaries.
Style: crisp hand-authored 2D pixel art, early-2000s Korean PC side-scrolling RPG mood, hard readable silhouette at small gameplay scale, nearest-neighbor-friendly edges.
Backdrop: perfectly flat uniform solid #ff00ff covering every corner and gap; do not use #ff00ff inside the character.
Constraints: no text, labels, UI, grid lines, border, scenery, floor, cast shadow, logo, trademark, watermark, extra character, or identity redesign.
```

## P19 플레이어 무릎 회수 자세 v3

다섯 v2 크로마 시트를 각각 edit target으로 사용했다. 결과 전체를 런타임에 쓰지 않고 2행
2·4열만 합성했으며, 나머지 14개 프레임은 v2 런타임과 픽셀 단위로 동일하게 보존했다.

```text
Use case: precise-object-edit
Asset type: production PC web 2D side-scrolling game player sprite sheet
Primary request: Edit only row 2 column 2 and row 2 column 4 into unmistakable leg-recovery passing poses for a grounded walk cycle. In row 2 column 2, keep the forward/support boot planted directly under the torso while the trailing leg bends sharply at the knee, lifting its heel visibly backward toward the calf. In row 2 column 4, mirror the gait phase: the opposite support boot is planted under the torso while the other leg bends sharply and its heel lifts backward toward the calf. The bent knee and lifted boot must create a compact triangular silhouette, not two straight legs spread apart.
Input image: edit target and identity/layout reference.
Preserve exactly: all of rows 1, 3, and 4; row 2 columns 1 and 3 contact poses; face, hair, scarf/cape/coat, armor, clothing, hands, proportions, palette, pixel-art rendering, cell centers, character size, and right-facing direction.
Walk constraints: grounded, upright torso, no airborne pose, no crouch, no sliding, no split stance in the two edited passing cells; one foot bears weight under the hips and the other foot clearly leaves the ground with a bent knee. Keep the lowest planted sole on the same baseline as the contact frames.
Composition: exact invisible equal 4x4 grid; one complete character per cell; generous separation; no element crossing cell boundaries.
Backdrop: perfectly flat uniform solid #ff00ff across every gap and corner, with no gradient, texture, floor, or shadow; never use #ff00ff in the character.
Style: crisp hand-authored 2D pixel art, nearest-neighbor-friendly hard edges, readable legs at small gameplay scale.
Avoid: changing any non-target cell, redesigning identity or equipment, extra limbs, duplicated boots, straight-legged passing poses, wide split stance in columns 2 or 4, blur, antialias haze, text, grid lines, border, logo, watermark.
```

## P20 호카게 독자 SD 외형 v4

built-in imagegen의 style-transfer 모드를 사용했다. 텍스트 외형·복장 규격과
`assets/sprites/core/player-hokage-v3.png`의 포즈·액션·4×4 배치를 기준으로 한다.

```text
Use case: style-transfer / game sprite-sheet character redesign.

The supplied current sprite sheet is the mandatory pose, action, framing, and 4×4 layout reference. The text below is the mandatory visual-identity and outfit contract.

Create one square 4×4 sprite sheet containing exactly 16 separate full-body SD/chibi pixel-art sprites of the same character, facing screen-right. Redesign the supplied current sprite sheet to match the identity contract below. Preserve its exact cell order, pose/action silhouette, per-cell scale, spacing, foot baseline, and generous empty padding. Do not merge cells or place a character across a grid boundary.

Character identity must stay consistent in all 16 cells: bright spiky blond hair; dark metal forehead protector on a dark band; light skin; three short whisker-like marks on each cheek when visible; black high-collar zip jacket with orange torso/lower panels; orange pants; dark belt/pouch; black shin wraps; black open-toe ninja sandals. Youthful determined face, large SD head and compact body. No brown hair, no black cloak, no armor, no cape, no scarf, no text, no watermark, no extra characters.

Animation contract, left-to-right:
Row 1: four subtle standing/idle poses.
Row 2: left-foot contact; compact bent-knee passing pose with the trailing leg folded and clearly lifted; right-foot contact; mirrored compact bent-knee passing pose with the other leg folded and clearly lifted.
Row 3: jump rise; jump apex; falling pose; hurt/recoil.
Row 4: close-range claw/kunai windup; close-range release/slash; swirling blue energy sphere windup; larger swirling blue energy sphere release.

Pixel-art direction: polished Korean 2D side-scrolling RPG sprite, crisp hard-edged pixels, readable at 128×128 per cell, limited coherent shading, strong dark outline, no antialias blur. Each cell contains exactly one complete character and any action effect belonging to that pose. Keep all body parts inside their cell.

Background must be one perfectly flat, uniform, fully opaque chroma-key magenta #FF00FF across the entire canvas, including all corners and gaps. No grid lines, shadows, gradients, texture, ground, labels, UI, or borders.
```

## P21 삼인 협공 동료 독자 SD 외형 v2

built-in imagegen의 style-transfer 모드를 사용했다. 두 동료의 텍스트 외형 규격과
`assets/sprites/core/hokage-allies-v1.png`의 포즈·효과·4×4 배치를 기준으로 한다.

```text
Use case: style-transfer / game sprite-sheet character redesign.

The text below is the mandatory visual identity and outfit contract for both allies. The supplied current sprite sheet is the mandatory 4×4 pose, action, framing, effect, cell order, and spacing reference.

Create one square 4×4 sprite sheet containing exactly 16 separate full-body SD/chibi pixel-art sprites. Replace only the two character identities in the supplied sheet while preserving its exact invisible grid, per-cell action silhouette, direction, scale, spacing, effects, and generous padding. Do not merge cells or place any body/effect across a cell boundary.

Rows 1–2, rival ninja identity: same young male character in all eight cells, pale skin, very dark navy-black spiky hair with long side bangs, dark forehead band with a rectangular metal protector, focused dark eyes, navy high-collar short-sleeved shirt, white knee-length shorts, dark blue wrist/forearm guards, white leg bandage wraps, dark blue open-toe ninja sandals. Compact SD body and large head. No silver hair, mask, cloak, scarf, armor, or long coat.
Row 1 actions left-to-right: rapid aerial entry pose 1; rapid aerial entry pose 2; forward aerial dash; compact three-point landing.
Row 2 actions left-to-right: grounded shuriken/kunai throw windup; grounded multi-projectile release; forward exit dash 1; faster forward exit dash 2 with short blue speed streaks.

Rows 3–4, striker ninja identity: same young female character in all eight cells, light skin, short bright pink hair, green eyes, dark forehead band with a small rectangular metal protector, sleeveless deep red tunic with pale trim and a white circular back/side motif when visible, fitted black shorts, dark gloves or wrist guards, dark blue open-toe ninja sandals. Athletic compact SD body and large head. No brown braided hair, green-and-cream robe, oversized gauntlets, armor, long skirt, or cape.
Row 3 actions left-to-right: fast aerial entry pose 1; tucked aerial entry pose 2; high forward kick with a pale curved strike arc; grounded fighting stance.
Row 4 actions left-to-right: heavy forward punch impact; punch recovery/ready stance; forward exit dash 1 with short pink-white speed streaks; faster forward exit dash 2 with short pink-white speed streaks.

Direction and animation: both characters face screen-right except when the exact action silhouette naturally turns the torso. Preserve the supplied sheet’s animation readability and exact row ownership: the rival appears only in rows 1–2 and the striker appears only in rows 3–4.

Pixel-art direction: polished early-2000s Korean PC side-scrolling RPG sprite, crisp hard-edged pixels, strong dark outline, coherent limited shading, nearest-neighbor friendly, readable at 128×128 per cell. One complete character per cell. No text, watermark, logo, labels, UI, grid lines, floor, cast shadow, extra characters, duplicated limbs, or mixed identities.

Background must be one perfectly flat, uniform, fully opaque chroma-key magenta #FF00FF across the entire canvas, including all corners and gaps. No gradient, texture, scenery, border, or lighting variation. Do not use #FF00FF inside either character.
```

## P22 거대 최종보스 원펀맨 v1

사용자 제공 `codex-clipboard-5ca937e1-c790-4b4b-9f48-fd4a517d0897.png`는 외형·팔레트
레퍼런스로만 사용했다. built-in imagegen 결과를 크로마 제거·512×512 point 축소한 뒤
16개 주 피사체와 효과를 각각 128×128 셀 안으로 다시 패킹해 망토·펀치 효과의 경계 침범을
제거했다.

```text
Use case: stylized-concept
Asset type: production sprite sheet for a PC web 2D side-scrolling game
Primary request: Create exactly one 4 columns by 4 rows animation atlas for a giant One Punch Man final boss, using Image 1 only as the character appearance and color reference.
Input images: Image 1 is the appearance reference for the bald head, calm face, yellow bodysuit, white cape, red gloves, red boots, and simple round belt clasp; do not reproduce the poster composition, typography, or background.
Subject: the same towering bald adult superhero in every cell, broad readable silhouette, yellow suit, white cape, red gloves and boots; calm expression; much larger and more imposing proportions than a normal game character.
Grid order: row 1 four subtle cape-breathing idle frames; row 2 four right-facing heavy grounded walk frames; row 3 two short hurt/recoil frames followed by two devastating forward punch windup-and-strike frames; row 4 four progressive exhausted kneel, stagger, fall, and defeated frames.
Scene/backdrop: perfectly flat uniform solid #ff00ff chroma-key background covering every corner and all gaps.
Style/medium: crisp hand-authored 2D pixel art, nostalgic early-2000s Korean PC side-scrolling RPG boss sprite, limited palette, hard readable edges, nearest-neighbor-friendly.
Composition/framing: exact invisible equal 4x4 grid, one complete full-body boss per cell, consistent identity and giant scale, right-facing direction, optical center and boots baseline, generous cell-safe padding, no element crosses a cell boundary.
Constraints: no text, letters, labels, UI, visible grid, border, scenery, floor, cast shadow, logo, watermark, extra person, duplicate body, or prop; never use #ff00ff inside the character; keep all cape and limbs fully inside each cell.
Avoid: reproducing the reference poster, title typography, red poster backdrop, cinematic camera changes, close-ups, cropped bodies, merged cells, blur, painterly rendering, extra fists, extra limbs, inconsistent costume or identity.
```

## P24 허름한 초보자 v4

built-in imagegen의 `stylized-concept` 모드를 사용했다. 입력 1은 사용자 제공
`codex-clipboard-693e895f-176c-4ab9-8a2c-a6e1a378e8bd.png`로 낡은 두건과 재질의 인상만
참고하고, 입력 2는 `assets/sprites/core/player-v3.png`로 4×4 동작·방향·셀 배치 기준을
고정했다. 첫 결과의 hurt 셀에서 빠진 두건은 같은 built-in imagegen의 정밀 편집으로 한 셀만
보정했다.

```text
Use case: stylized-concept
Asset type: production 4×4 player animation sprite sheet for a PC web 2D side-scrolling RPG
Primary request: redesign only the beginner player as an unmistakably poor, worn-out novice adventurer while preserving the exact 4 columns × 4 rows animation atlas contract.
Input images: Image 1 is appearance and material inspiration only for the shabby brown earflap hood, patched clothing, bandages, and humble beginner feeling; do not copy its pose, checkerboard background, weapon, face, or exact design. Image 2 is the mandatory pose order, right-facing direction, character scale, invisible 4×4 grid, per-cell framing, action silhouette, spacing, and effect reference.
Subject: the same original young novice adventurer in all 16 cells, compact SD/chibi proportions and large readable head; worn patchwork dark-brown earflap hood with uneven stitching and a faded patch, messy charcoal-black hair peeking out, simple dirty off-white sleeveless tunic with pale desaturated blue undershirt edge, frayed dark-blue shorts, rope belt and tiny patched pouch, wrapped forearms and shins, scuffed brown sandals. Visibly impoverished and inexperienced but appealing and readable. No armor, jewelry, cape, scarf, uniform, luxury fabric, polished equipment, or branded character details.
Animation contract left-to-right: Row 1 four subtle idle/breathing poses. Row 2 left-foot contact, compact bent-knee passing pose with trailing leg clearly lifted, right-foot contact, mirrored bent-knee passing pose. Row 3 jump rise, jump apex, fall, hurt/recoil. Row 4 basic throwing windup, basic throwing release with one small dull practice star, stronger skill windup, stronger skill release with two short pale-blue practice-star streaks.
Style/medium: crisp hand-authored 2D pixel art, nostalgic early-2000s Korean PC side-scrolling RPG player sprite, limited earthy palette, strong dark outline, hard pixel edges, nearest-neighbor friendly, readable at 128×128 per cell.
Composition/framing: exact invisible equal 4×4 grid; exactly one complete full-body character per cell; consistent identity and scale; right-facing; centered optical body and common sandal baseline; generous cell-safe padding; no body part or effect crosses a cell boundary.
Scene/backdrop: perfectly flat uniform fully opaque solid #FF00FF chroma-key background covering every corner and gap.
Constraints: no visible grid, text, labels, UI, watermark, logo, scenery, floor, cast shadow, checkerboard, extra person, duplicate body, extra limbs, cropped body, large weapon, wooden sword, or shield; never use #FF00FF in the character; keep all limbs, hood flaps, practice stars, and streaks fully inside their own cell.
Avoid: polished hero costume, modern clothing, shiny armor, rich colors, clean pristine fabric, oversized props, pose drift, merged cells, painterly blur, antialias blur, inconsistent outfit or identity.
```

Hurt 셀 복장 보정 프롬프트:

```text
Use case: precise-object-edit
Asset type: production 4×4 beginner player sprite sheet
Input images: Image 1 is the edit target and must remain unchanged except for one costume consistency fix. Image 2 is the shabby hood and material inspiration. Image 3 is the pose/grid contract reference.
Primary request: Fix only row 3 column 4, the hurt/recoil frame, so this character wears the exact same patched dark-brown earflap hood with faded crown patch and long side flaps as the other 15 cells. The hood must stay on the head during recoil and follow the hurt pose naturally.
Constraints: preserve all other 15 cells exactly; preserve the hurt frame face, body pose, limbs, clothing, practice-star impact spark, right-facing direction, scale, pixel-art rendering, flat #FF00FF background, invisible equal 4×4 grid, spacing, and cell-safe padding. Do not redesign the character or any other frame. No text, visible grid, checkerboard, scenery, shadow, watermark, extra person, extra limb, or cell-boundary crossing. Never use #FF00FF inside the character.
```

## P64 좀비·늑대·고대 나무정령 v1

built-in imagegen의 새 이미지 생성을 사용했다. 기존 프로젝트 몬스터 시트 3종은 픽셀 밀도,
4×4 고정 셀과 idle·walk·hurt·defeat 행 배치의 스타일 참고에만 사용했다.

공통 프롬프트:

```text
Create one production-ready square 4×4 sprite sheet for an original monster in a Korean 2D
side-scrolling pixel-art RPG. Exactly 16 separate full-body sprites of the same creature, facing
screen-right, one complete creature per equal invisible cell. Row 1: idle 4. Row 2: grounded walk
4. Row 3: hurt/recoil 4. Row 4: progressive defeat 4. Crisp hard-edged pixel art, limited coherent
palette, strong dark outline, nearest-neighbor friendly, consistent scale and identity, common foot
baseline, generous cell-safe padding. Flat uniform fully opaque chroma-key background across every
corner and gap. No visible grid, text, logo, watermark, scenery, floor, cast shadow, blur, cropped
body, duplicate body, extra limbs, merged cells, or any pixel crossing a cell boundary.
```

종별 추가 프롬프트:

```text
Plague zombie: a gaunt shambling undead former worker, sickly moss-green skin, torn desaturated
brown work clothes, crooked posture and asymmetric hanging arms. Readable humanoid silhouette;
no robot parts, metal armor, gears, mechanical joints, glowing machine core, or gore.

Moon wolf: an agile four-legged wolf with a low long body, charcoal and cool blue-gray fur,
pale moonlit mane and tail tip, alert ears and bright cyan eyes. Natural animal anatomy and a clear
four-paw gait; no armor, saddle, machine parts, humanoid posture, or extra tails.

Ancient treant: a broad living tree spirit with a leafy crown, bark torso, branch arms, root feet,
moss and small coral-colored growth accents. Heavy grounded plant silhouette; no stone golem body,
metal plates, gears, robotic limbs, weapon, or humanoid clothing.
```

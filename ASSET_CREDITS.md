# Asset Credits and Distribution Policy

이 문서는 런타임 번들에 들어가는 에셋의 출처, 제작 과정, 권리 조건과 외부 시각 자료의
배포 경계를 기록한다. 현재 공개 가능한 데모 산출물은 `npm run build`가 만든 `dist/`다.

## 런타임 에셋

| 범주 | 런타임 파일 | 원본·제작 방식 | 제작자·출처 | 배포 조건 |
| --- | --- | --- | --- | --- |
| 핵심 스프라이트 | `assets/sprites/core/*.webp` 중 매니페스트가 가리키는 24종 | 같은 stem의 정규화 PNG, `source/*-chroma.png`, `PROMPTS.md`; PNG에서 lossless VP8L 생성 | 이 프로젝트에서 built-in imagegen으로 생성·편집 | 데모 `dist/`에는 WebP만 포함. 원본 단독 재배포 조건은 저장소 수준 라이선스 결정 전 보류 |
| 맵 화면 배경 | `assets/maps/screens/*.webp` 11종 | `source/*.png`, `PROMPTS.md`, 1280×720 크기 정규화 | 이 프로젝트에서 built-in imagegen으로 생성·편집 | 위와 같음 |
| 맵 오브젝트 | `assets/maps/objects/map-object-kits-a|b-v1.webp`, `map-object-kits-c-v2.webp`, `patience-hazards-v1.webp` | 크로마 원본 4종, P49 포탈 바닥 광륜 원본, `PROMPTS.md`; 투명 프레임 추출·WebP 최적화 | 이 프로젝트에서 built-in imagegen으로 생성·편집 | 데모 `dist/`에 최종 아틀라스 4종 포함. 생성 원본·이전 C v1은 제외 |
| UI 화면 배경 | `assets/ui/screens/*.webp` 3종 | `source/*.png`, `PROMPTS.md`, 1280×720 중앙 크롭·정규화 | 이 프로젝트에서 built-in imagegen으로 생성·편집 | 위와 같음 |
| 플레이 HUD 패널 | `assets/ui/panels/hud-metal-*.webp` 2종 | `source/hud-metal-panel-v1-source.png`, `PROMPTS.md`, 96×96 정규화·중앙 표면 파생 | 이 프로젝트에서 built-in imagegen으로 독자 생성 | 데모 `dist/`에 런타임 WebP 2종 포함. 생성 원본은 제외 |
| 호카게 시네마틱 | `assets/ui/cinematics/hokage-cinematics-v1.webp` | `source/hokage-cinematics-v1.png`, `PROMPTS.md`, 1280×720 2×2 아틀라스·quality 38 WebP | 이 프로젝트에서 built-in imagegen으로 독자 생성 | 위와 같음 |
| 스킬 아이콘 | `assets/ui/skills/*.webp` 15종 | 같은 stem의 정규화 PNG, `source/skill-*-v1-chroma.png`, `PROMPTS.md`; PNG에서 lossless VP8L 생성 | 이 프로젝트에서 built-in imagegen으로 독자 생성 | 위와 같음 |
| 맵 레이어 | `assets/maps/layers/*.svg` 13종 | 커닝시티·동굴·던전 회랑·인내의 숲은 `scripts/generate-map-layers.mjs`, 시험장은 규격 기반 수작업 SVG | 프로젝트 자체 절차적 SVG | 데모 `dist/`에 포함. 별도 재라이선스 미부여 |
| 공통 패널 | `assets/ui/panels/*.svg` 3종 | `scripts/generate-ui-panels.mjs` | 프로젝트 자체 절차적 SVG | 데모 `dist/`에 포함. 별도 재라이선스 미부여 |
| 데미지 숫자 | `assets/ui/combat/damage-numbers-v1.svg` | `scripts/generate-damage-atlas.mjs`의 3×5 픽셀 매트릭스 | 프로젝트 자체 절차적 SVG | 데모 `dist/`에 포함. 별도 재라이선스 미부여 |
| 원펀맨 충격파 | `assets/ui/combat/one-punch-shockwave-v1.svg` | 192×96 공기압 호·속도 파편을 수작업한 투명 벡터 | 프로젝트 자체 SVG | 데모 런타임에 Vite data URI로 포함. 별도 재라이선스 미부여 |
| BGM | `assets/audio/bgm/game-theme-v1.mp3`, `boss-theme-v1.mp3` | 사용자 제공 MP3 원본을 재인코딩 없이 복사 | 사용자 제공, 원저작자·라이선스 미확인 | 로컬 데모 `dist/`에 포함. 외부 공개·배포 전 권리 확인 필요 |
| SFX | `assets/audio/sfx/*.wav` 12종 | `scripts/generate-audio-assets.mjs`의 파형 합성, 외부 샘플 없음 | 프로젝트 자체 절차적 PCM | 데모 `dist/`에 포함. 별도 재라이선스 미부여 |
| 한글 픽셀 폰트 | `assets/ui/fonts/Galmuri11*.woff2` | Galmuri11 v2.40.3 | Lee Minseo | SIL Open Font License 1.1. 전문은 `assets/ui/fonts/Galmuri-LICENSE.txt` |

P19까지의 생성형 이미지 에셋은 기존 게임의 로고·문자·캐릭터·장면을 복제하지 않도록 독자
프롬프트로 제작했다. P20 호카게 v4, P21 협공 동료 v2, P22 원펀맨 v1과 P24 초보자 v4는
텍스트로 확정한 외형·복장·재질 규격을 SD 캐릭터로 제작했다. 각 항목의 권리 조건은 아래를 따른다.

P79 런타임 전송 최적화는 핵심 스프라이트 24종과 스킬 아이콘 15종의 정규화 PNG를 보존한 채
`cwebp -lossless -z 9`로 같은 stem의 WebP를 생성한다. 39종의 디코딩 픽셀 전수 비교는 차이
0건이며, 입력 2,465,785 bytes에서 런타임 1,980,136 bytes로 485,649 bytes(19.70%) 감소했다.
`npm run assets:webp`로 재생성하고 배포 감사에서는 PNG 런타임 포함을 금지한다.

아래 P13~P64 항목의 “런타임 PNG”와 파일 크기는 각 단계 당시의 제작·회귀 기록이다. 현재
배포에서는 그 PNG를 기준 파일로만 보존하고 같은 stem의 lossless WebP를 사용한다. 현재 파일
형식과 배포 경계는 위 런타임 에셋 표와 P79 규칙이 우선한다.

P13 장착 표창은 `assets/sprites/core/equipped-throwing-stars-v1.png` 한 장에 독자적인 5등급을
구성했다. built-in imagegen의 1254×1254 크로마 원본을 투명 512×512 4-bit indexed PNG로
정규화한 런타임 파일은 `20,570B`이며, 원본과 생성 프롬프트는 배포 번들에서 제외한다.

P46 플레이 HUD는 외부 참고 이미지 없이 built-in imagegen으로 만든 1254×1254 정면 건메탈
패널 원본을 사용한다. 96×96 런타임 프레임 `hud-metal-panel-v1.webp`는 7,402B, 내부 표면
`hud-metal-surface-v1.webp`는 5,142B이며 생성 원본과 정확한 프롬프트는 `dist/`에서 제외한다.
두 런타임 이미지에는 텍스트·아이콘·로고가 없고 화면 정보는 Phaser Text와 DOM 접근성 상태로
별도 렌더링한다.

P58 두아 펫 v2는 `apps/utilities/token-dog`의 독자 웰시코기 실루엣과 사용자가 제공한 실제 두아
사진 2장의 연한 황금빛 털, 긴 흰 주둥이, 날렵한 쐐기형 얼굴과 아몬드형 눈매를 언어화해 built-in
imagegen으로 새로 제작했다. 참고사진 원본은 저장소와 `dist/`에 포함하지 않는다. 1254×1254
크로마 원본은 `assets/sprites/source/dua-pet-v2-chroma.png`, 크로마 제거·최근접 축소한 512×512
런타임 시트는 `assets/sprites/core/dua-pet-v2.png`에 보존하며, 4×4 고정 셀의 sit/idle·run·fetch·
happy 동작을 사용한다. 공개 배포·상업 이용 전에는 생성 서비스 약관과 캐릭터 디자인 권리를 확인한다.

P62 두아 펫 v3는 v2의 얼굴·체형과 sit/idle·fetch·happy 12프레임을 그대로 유지하고, 공중에 뜬
비슷한 자세가 반복되던 run 4프레임만 built-in imagegen 정밀 편집으로 교체했다. 두 대각발의 접지와
회수를 번갈아 배치하고 원거리 다리를 어둡게 구분해 짧은 코기 다리가 자연스럽게 연결된다.
1254×1254 크로마 원본은 `assets/sprites/source/dua-pet-v3-chroma.png`, 크로마 제거·최근접 축소 뒤
2행만 합성한 512×512 런타임은 `assets/sprites/core/dua-pet-v3.png`에 보존한다. 런타임의 나머지
12프레임은 v2와 픽셀 차이 0이며, 참고사진 원본은 저장소와 `dist/`에 포함하지 않는다.

P64 일반 몬스터 다양화는 built-in imagegen으로 독자 제작한 역병 좀비·달빛 늑대·고대 나무정령
시트 3종을 사용한다. 기존 프로젝트 시트는 픽셀 밀도와 4×4 동작 배치의 스타일 참고에만 사용했으며
특정 외부 캐릭터·로고·문자를 복제하지 않았다. 1254×1254 크로마 원본은
`assets/sprites/source/plague-zombie-v1-chroma.png`, `moon-wolf-v1-chroma.png`,
`ancient-treant-v1-chroma.png`에 보존한다. 크로마 제거·최근접 축소·셀 안전 여백·PNG 최적화를
거친 512×512 런타임은 같은 이름의 `assets/sprites/core/` PNG이며 각각 72,328B·63,600B·
96,759B다. 생성 원본은 `dist/`에서 제외하며 공개 배포·상업 이용 전 생성 서비스 약관과 독자
캐릭터 디자인 권리를 확인한다.

P68 크레딧 배경은 외부 입력 이미지 없이 built-in imagegen으로 만든 달빛 폐허 결투장과 여명,
독자 닌자·반려견·전사 실루엣을 사용한다. 1672×941 생성 원본은
`assets/ui/source/ending-credits-v1-source.png`, point 정규화한 1280×720·76,650B 런타임은
`assets/ui/screens/ending-credits-v1.webp`에 보존한다. 이미지에는 문자·로고·워터마크가 없고
정확한 제작자·레퍼런스 문구는 DOM으로 분리한다. 크레딧의 `메이플스토리` 표기는 사용자가 지정한
게임 레퍼런스 고지이며, 해당 상표·에셋의 라이선스나 제휴를 의미하지 않는다.

P14는 원작 인물의 얼굴·머리·복장·문양을 복제하지 않은 독자 동료 `시온`과 `하나`, 추상
차크라 배경 4종, 삼인 협공 아이콘을 사용한다. 런타임 3종은 각각 `51,657B`, `105,248B`,
`5,193B`이며 합계 `162,098B`다. 생성 원본과 참고 이미지는 `dist/`에서 제외한다.

P15 던전 회랑은 원작 맵의 구조·오브젝트·문구를 복제하지 않은 수정 개미굴, 시계태엽 탑,
가라앉은 산호 신전, 잿불 광산, 달빛 마도서고 5종이다. built-in imagegen 원본은
`assets/maps/source/`, 1280×720 WebP는 `assets/maps/screens/`에 보존하고, 충돌 발판·포탈은
프로젝트 자체 SVG 전경으로 분리했다. 런타임 WebP 5종은 약 687KB이며 원본과 프롬프트는
`dist/`에서 제외한다.

P16은 잿불 광산 중간보스 `폭열군주 이그니카르`, 달빛 마도서고 상위보스 `월식현자 루나시온`,
커닝시티 퀘스트 NPC `원정대장 세라`를 독자 디자인으로 생성했다. built-in imagegen의
1254×1254 `#ff00ff` 크로마 원본은 `assets/sprites/source/`에 보존하고, 크로마 제거·point
축소·팔레트 최적화를 거친 512×512 런타임 PNG 3종은 각각 `84,768B`, `84,649B`,
`56,574B`다. 생성 원본과 프롬프트는 `dist/`에서 제외한다.

P18 플레이어 v2 시트 5종은 기존 전직별 외형과 idle·jump·hurt·attack 12개 프레임을
유지하고, 공중에 뜬 것처럼 보이던 walk 행만 왼발 접지·통과·오른발 접지·통과의 독자적인
지면 보행 주기로 편집했다. built-in imagegen의 1254×1254 `#ff00ff` 크로마 원본은
`assets/sprites/source/player*-v2-chroma.png`에 보존하고, 걷기 행 합성·크로마 제거·point
축소·팔레트 최적화를 거친 512×512 런타임 PNG는 초보자 `47,790B`, 로그 `49,500B`,
어쌔신 `55,771B`, 허밋 `69,642B`, 호카게 `52,964B`다. 원본과 v1 시트는 명시적 Vite
URL 목록에 없으므로 `dist/`에서 제외한다.

P19 플레이어 v3 시트는 P18 v2의 접지 2프레임과 idle·jump·hurt·attack 12개 프레임을
픽셀 단위로 유지하고, built-in imagegen 정밀 편집으로 통과 프레임 2개만 무릎·뒤꿈치 회수
자세로 교체했다. 1254×1254 합성 크로마 원본은 `assets/sprites/source/player*-v3-chroma.png`,
512×512 256색 런타임은 `assets/sprites/core/player*-v3.png`에 보존한다. 런타임 PNG는 초보자
`46,858B`, 로그 `48,289B`, 어쌔신 `54,469B`, 허밋 `66,978B`, 호카게 `51,537B`이며,
v2와 생성 원본은 명시적 Vite URL 목록에 없어 `dist/`에서 제외한다.

P20 호카게 v4 시트는 금발·이마 보호대·볼 표식·검정/주황 닌자복의 텍스트 외형 규격과
호카게 v3의 16포즈·4×4 배치를 사용해 built-in imagegen에서 SD 픽셀 캐릭터로 제작했다.
균일한 1254×1254 `#ff00ff` 크로마 원본은
`assets/sprites/source/player-hokage-v4-chroma.png`, 512×512 PaletteAlpha 256색 런타임은
`assets/sprites/core/player-hokage-v4.png`에 보존하며 런타임 파일은 `48,461B`다. 공개 배포·
상업 이용 전에는 캐릭터 디자인과 생성 서비스 약관에 대한 권리를 확인한다.

P21 협공 동료 v2 시트는 검푸른 라이벌 닌자와 분홍 머리 타격 닌자의 텍스트 외형 규격,
v1 시트의 16포즈·4×4 배치를 사용해 built-in imagegen에서 SD 픽셀 캐릭터로 제작했다. 균일한
1254×1254 `#ff00ff` 크로마 원본은 `assets/sprites/source/hokage-allies-v2-chroma.png`,
512×512 PaletteAlpha 256색 런타임은 `assets/sprites/core/hokage-allies-v2.png`에 보존하며
런타임 파일은 `53,103B`다. 공개 배포·상업 이용 전에는 두 캐릭터 디자인과 생성 서비스
약관에 대한 권리를 확인한다.

P22 원펀맨 v1 시트는 사용자 제공 `codex-clipboard-5ca937e1-c790-4b4b-9f48-fd4a517d0897.png`를
외형·팔레트 참고로 사용해 built-in imagegen에서 4×4 SD 픽셀 보스 시트로 생성했다. 포스터
배경·문자·구도는 사용하지 않았고, 1254×1254 크로마 원본은
`assets/sprites/source/one-punch-man-v1-chroma.png`, 셀별 재패킹·256색 최적화를 거친
512×512 런타임은 `assets/sprites/core/one-punch-man-v1.png`에 보존하며 런타임 파일은
`62,271B`다. 전용 `무한의 결투장`은 별도의 독자 프롬프트로 생성한 원경을 40,524-byte
WebP와 7,737-byte 결정적 SVG 전경으로 번들링한다. 참고 이미지는 번들에서 제외되지만 보스
생성 결과는 레퍼런스의 캐릭터 식별 요소를 의도적으로 반영하므로 공개 배포·상업 이용 전
원 이미지와 캐릭터에 대한 권리 확인과 필요한 허가가 필요하다.

P34 인내의 숲 원경은 외부 참고 이미지 없이 built-in imagegen으로 생성한 독자적인 거목·폭포
픽셀 환경이다. 생성 원본은 `assets/maps/source/patience-forest-v1-source.png`, 1280×720
런타임은 `assets/maps/screens/patience-forest-v1.webp`에 보존하며, 충돌 정렬 나무 발판과
포탈은 `scripts/generate-map-layers.mjs`가 만드는 프로젝트 자체 SVG를 사용한다. 런타임
WebP는 78,774B, SVG는 8,874B다.

P35 인내의 숲 확장은 새 래스터를 추가하지 않는다. 기존 원경은 그대로 사용하고 결정적 SVG를
1920×1440으로 확장해 나뭇가지 발판·줄·사다리의 외형과 정렬 메타데이터를 생성한다. 움직이는
통나무·도토리·가시는 Phaser 도형으로 렌더링한다. 보상 전용 `초대형 고드름`은 기존 프로젝트
자체 3등급 빙결 표창 프레임을 확대·틴트해 재사용한다. 확장 SVG는 18,183B다.

P36 던전 줄타기 오브젝트는 새 래스터를 추가하지 않는다. 그림자 시험장 수작업 SVG와
`scripts/generate-map-layers.mjs`가 만드는 던전 회랑 6종의 프로젝트 자체 SVG 도형만 사용하며,
각 던전 팔레트의 주선·하이라이트·매듭으로 표현한다.

P37 환경 오브젝트는 프로젝트의 11개 독자 배경을 스타일 참고로 built-in imagegen에서 새로
생성했다. 외부 이미지·샘플·상표를 입력하지 않았다. 4개 1254×1254 flat `#ff00ff` 크로마
원본은 `assets/maps/source/map-object-kits-a|b|c-v1-chroma.png`와
`patience-hazards-v1-chroma.png`에 보존한다. imagegen 스킬의 공식 크로마 제거 도구와 로컬
Lanczos 축소·WebP 품질 52 최적화를 거친 런타임은 각각 38,288B·47,272B·44,008B·12,028B다.
생성 프롬프트와 맵 셀 순서는 `assets/maps/PROMPTS.md`에 기록한다.

P24 초보자 v4 시트는 사용자 제공 `codex-clipboard-693e895f-176c-4ab9-8a2c-a6e1a378e8bd.png`의
낡은 갈색 귀덮개 두건·패치·붕대·닳은 신발 인상만 외형·재질 참고로 사용했다. 얼굴·신체 비율·
16개 포즈와 세부 복장은 프로젝트의 독자적인 SD 픽셀 캐릭터로 다시 설계했다. built-in
imagegen의 크로마 보존본은 `assets/sprites/source/player-v4-chroma.png`, 크로마 제거·point
축소·256색 최적화를 거친 512×512 런타임은 `assets/sprites/core/player-v4.png`에 보존하며
런타임 파일은 `36,898B`다. 사용자 참고 이미지는 임시 입력으로만 사용해 저장소·Vite·`dist/`에
포함하지 않았으며, 정확한 생성·보정 프롬프트는 `assets/sprites/PROMPTS.md`에 기록한다.

P26 셀 경계 정리본은 새 생성형 이미지를 만들지 않고 기존 런타임에서 인접 프레임 본체가
넘어온 분리 픽셀만 `scripts/clean-player-frame-boundaries.mjs`로 제거했다. 로그·어쌔신·허밋
v4, 호카게 v5, 심연의 골렘 v3, 이그니카르·루나시온 v2는 각 v3/v4/v1 입력의 팔레트 또는 RGBA
형식과 모든 비오염 픽셀을 유지하며, 전수 비교에서 추가·재색상은 0건이다. 런타임 파일 크기는
각각 `51,427B`, `57,163B`, `69,889B`, `50,031B`, `351,160B`, `85,700B`, `84,919B`다.
생성 원본과 이전 런타임의 출처·배포 조건은 그대로 승계한다.

P27 심연의 골렘 v3는 v2에서 내부 셀 경계 양쪽으로 이어진 9개 연결 지점의 분리 컴포넌트
24픽셀만 추가 제거했다. 새 생성형 출력 없이 v1 원본에서 같은 정리 스크립트로 재생성하며,
v2 대비 픽셀 추가·재색상은 0건이다.

P49 포탈 바닥 FX v1은 사용자 제공 포탈 캡처의 유백색·빙청색·연두색 에너지 광도만 참고해
built-in imagegen에서 독자적인 수평 마법진으로 생성했다. 문틀·금색 장식·문자·구도는 복제하지
않았고, 임시 참고 캡처는 저장소·Vite·`dist/`에 포함하지 않았다. 1774×887 생성 원본은
`assets/maps/source/portal-ground-fx-v1-source.png`에 보존하고, 검은 배경 제거·224×112 Lanczos
축소 뒤 `map-object-kits-c-v2.webp`의 비어 있던 우하단 셀에 합쳤다. C v2 런타임 아틀라스는
40,826B이며 기존 C v1 대신 하나만 번들링한다. 정확한 생성 프롬프트는
`assets/maps/PROMPTS.md`에 기록한다.

P50 개발자 NPC v1은 사용자가 지정한
[`일용직 개발자 임상진` 유튜브 채널](https://www.youtube.com/@limsangjin12)의 공개 프로필
이미지를 인물 외형 참고로, 기존 `street-healer-v1.png`를 픽셀 밀도·4×4 배치 참고로 사용해
built-in imagegen에서 새로 생성했다. 다운로드한 프로필 참고 이미지는 임시 입력으로만 사용해
저장소·Vite·`dist/`에 포함하지 않았다. 균일한 1254×1254 `#ff00ff` 크로마 원본은
`assets/sprites/source/game-developer-v1-chroma.png`, 크로마 제거·point 축소·256색 최적화를
거친 512×512 런타임은 `assets/sprites/core/game-developer-v1.png`에 보존하며 런타임 파일은
`50,757B`다. 생성 결과는 공개 프로필의 갈색 비니·친근한 인상을 SD 픽셀 외형으로 재해석하며,
채널 로고·문자·YouTube 상표는 시트에 넣지 않았다. 채널 홍보 목적 외 공개 배포·상업 이용은
프로필 이미지와 인물 초상 사용에 필요한 권리를 별도로 확인한다.

## 외부 시각 자료 정책

외부 레퍼런스 이미지는 저장소, 소스 아카이브, Vite import와 `dist/`에 보관하지 않는다.
화면 구성이나 동작 분석이 필요하면 권리가 확인된 자료만 임시 작업 공간에서 사용하고,
독자적인 텍스트 규격·제작 프롬프트·권리 메모만 남긴 뒤 커밋 전에 원본을 제거한다.
시각 회귀는 `docs/screenshots/`의 실제 런타임 캡처와 `VISUAL_QA.md`를 기준으로 한다.

## 번들 경계

- 스프라이트 URL은 `src/game/assets/runtime-assets.ts`의 명시적 목록으로 번들링한다.
  따라서 매니페스트에서 사용하지 않는 `world-effects-loot-v1.png`와 기준 PNG는 `dist/`에
  들어가지 않는다.
- 오디오는 `src/game/assets/audio-assets.ts`에 명시된 사용자 제공 BGM MP3 2종과 절차적
  SFX 12종만 번들링한다. 일반곡과 SFX는 초기 로딩, 보스곡은 최초 보스 조우 시 동적 로딩을
  사용한다. 이전 절차적 BGM WAV 3종은 런타임에서 import하지 않는다.
- 외부 레퍼런스 원본, 생성 프롬프트와 생성 원본은 `dist/`에 없다. P20 호카게 v4와 P21
  협공 동료 v2의 런타임 결과는 포함되며 공개 배포 전 권리 확인이 필요하다.
- `npm run build`는 `THIRD_PARTY_NOTICES.txt`, 이 문서, Galmuri OFL 전문과 Phaser MIT
  전문을 `dist/`에 복사한다.
- `npm run audit:dist`는 필수 고지, 금지 파일, 상대 URL과 번들 예산을 자동 검증한다. 런타임 BGM MP3 2종은 실제 산출물 총량과 제외 용량을 함께 보고하되 8,000,000-byte 총량 상한 계산에서는 제외한다.

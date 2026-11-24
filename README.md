# Animated Shorts

Vertical (1080x1920, 30 fps) animated story shorts: 2D cartoon characters in a 3D toon world, rendered with three.js inside Remotion.

The Claude skill that drives the workflow lives in `.claude/skills/cartoon-3d-short/` (from [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts), MIT). Claude Code loads it automatically when you open this repo.

## Use it
In Claude Code: *"Use the cartoon short skill and make a short about …"*

## Layout
| Path | What |
|---|---|
| `.claude/skills/cartoon-3d-short/` | The skill: `SKILL.md`, templates, style references |
| `src/videos/bridge/` | The example short, "The Bridge That Fell for a Song" (composition `BridgeShort`) |
| `src/Root.tsx` | Register new shorts here, next to `BridgeShort` |
| `scripts/` | Stills, side-by-side sheets, sandbox merge, QA helpers |
| `audio/` | Synthesized SFX, march music, final mix (Python) |
| `public/bridge/kenney/` | Optional Kenney CC0 `.glb` props (trees, stalls, windmill…). Missing ones are skipped. |

## Setup
```bash
npm install
pip install -r requirements.txt   # numpy, scipy, pillow (for audio/ and scripts/)
```
Also needs ffmpeg.

## Commands
```bash
npm run studio      # preview
npm run render      # 1080x1920
npm run render:2k   # final 1440x2560
npx remotion still src/index.ts BridgeShort out/still.png --frame=600 --scale=0.5
```
In a Claude Code cloud container, add `--browser-executable=/opt/pw-browsers/chromium`.

## Notes
- Library versions are pinned to the ones the skill was built on (Remotion 4.0.290, three 0.175, fiber 9.1.2). Newer versions render a blank frame.
- `tsc --noEmit` reports 6 type-only errors in `Bridge.tsx` from the `@react-three/postprocessing` typings; rendering is unaffected.
- Every Remotion bundle copies `public/` into the temp folder. Point `TEMP`/`TMP` at a big drive.
- The reference frames under `.claude/skills/cartoon-3d-short/references/` are for style study only. Keep this repo private.

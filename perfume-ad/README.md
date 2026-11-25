# ORVELLE — Midnight Saffron (10s motion graphic ad)

Fictitious perfume brand. Built 2026-11-25 with the Motion Graphics Skill Pack (charlie947/motion-graphics-skills, MIT), installed in `../.claude/skills/`.

| Skill used | What it set |
|---|---|
| brand-intake | `brand.md`, `MOTION.md`, `CLAUDE.md` (answers invented for a fictitious brand, marked as such) |
| title-sequence-3d | Three.js scene, one continuous camera move, cards moving in depth, score in code, seeded randomness, `window.seek()` / `?render` |
| reel-export | Safe zone (text in y 360–1420, clear of right 120px), H.264 high, yuv420p, tv range, bt709, AAC, faststart, ffprobe check |

## Files
- `orvelle-ad.mp4` — the ad, 1080×1920, 30fps, 10s, with audio
- `index.html` — the animation. Serve the folder (`npx http-server` or similar) and open it to watch it loop.
- `score.js` — writes the soundtrack (bed, a hit per beat, a lift under the end card)
- `render.js` — `npm install && node render.js` rebuilds the MP4; `node render.js --check 1,5.5,9.9` renders review frames only

## Why these choices
- Rebuilt from a first 2D version because it broke three pack rules: end card in the Reel UI zone, bounce easing, gradient text.
- Exported with ffmpeg + headless Chromium instead of HyperFrames; the pack lists this as an accepted route.

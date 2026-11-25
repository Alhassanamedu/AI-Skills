---
name: claude-animation-base
description: Make short hand-painted 2D character animations (watercolour brush strokes, boiling linework, acted emotions) rendered from code with p5.js + p5.brush to MP4. Use when the user asks for a hand-painted, watercolour, cartoon or character-acting animation, a storybook-style short, or mentions Claude Animation Base.
---

# Claude Animation Base

A wrapper around John Heibel's ClaudeAnimationBase starter kit (MIT), bundled in `kit/` next to this file.

## Setup (once per film)

1. Copy the kit into a new project folder named for the film:
   `cp -r "<skill base directory>/kit" ./<film-name> && cd ./<film-name>`
2. Check for Node.js, Google Chrome (or Chromium) and ffmpeg. Report anything missing to the user; don't install system software yourself.
3. Run `npm install`.

## Make the film

1. Read `ANIMATION_GUIDE.md` in full before writing any code, and follow its rules and workflow: storyboard first, build shot by shot, review with contact sheets and frame strips, then render.
2. Put the film in `src/scenes/`, using `src/scenes/demo.js` as the pattern. Set length and tempo in `src/config.js`.
3. Render: `node render.mjs --clip --out=out/video.mp4`. On a machine without a GPU, add `--soft-gl` and avoid the watercolour fills (they are slow without a GPU).
4. Deliver `out/video.mp4` and say where it is.

## Character rule (important)

The kit's built-in character, Clawd, belongs to Anthropic and is not licensed for reuse. For any client, brand or commercial work, design an original character instead: use `src/clawd.js` only as a reference for how views, emotions, eyes, mouths and hooks are structured, and write a new character module with its own shape, colours and name. Ask the user for character references if they have them.

# AI-Skills

My collection of Claude Code skills. Added 25 November 2026.

## Install in Claude Code

```bash
claude plugin marketplace add Alhassanamedu/AI-Skills
claude plugin install motion-graphics@ai-skills
```

To use just one skill instead, copy its folder from `plugins/motion-graphics/skills/` into `~/.claude/skills/`.

## Motion graphics skills

| Skill | What it makes | Needs | Licence: can I use it for paid client work? |
|---|---|---|---|
| **hyperframes** (+ `hyperframes-cli`, `hyperframes-registry`, `media-use`) | Motion graphics, kinetic type, logo reveals, animated slides and explainers from HTML | Node.js, ffmpeg | Apache 2.0. **Yes** |
| **onetake** | 10–30 s product launch films and feature demos in one continuous take, no cuts | Node.js, Python 3, ffmpeg, Chrome | PolyForm Noncommercial 1.0.0. **No**: personal and noncommercial use only |
| **collage-broll-explainers** | 5-second 9:16 halftone paper-collage B-roll from one voiceover line | MaxFusion MCP connector (paid credits), ffmpeg | MIT. **Yes** (generation costs are yours) |
| **claude-animation-base** | Hand-painted 2D watercolour character animation (p5.js + p5.brush) | Node.js, Chrome, ffmpeg; a GPU helps a lot | MIT code. **Yes**, but not with the Clawd character (Anthropic's). Use your own character |
| **lemo-opuscar** | Short films in many styles (oil paint, ukiyo-e, satellite briefing, product teardown, 3D diorama…) | Node.js, Python, ffmpeg; downloads its library to `~/lemo-opuscar` on first use | Code MIT, docs CC BY-NC 4.0. **Yes**: films you make are yours, commercial included |

### Things to know

- None of these is a true 3D renderer. They draw motion in code (HTML, canvas, WebGL). For a 3D look, Lemo-Opuscar's 3D-styled entries come closest; for photoreal 3D, use an AI video model (Kling, Higgsfield).
- They work best in Claude Code with Opus 5.5 on high reasoning. Lemo-Opuscar is tuned for it.
- HyperFrames also has an official Claude connector ("HyperFrames by HeyGen") for use in the Claude app without Claude Code.

## Sources

Copied from the upstream repositories on 25 November 2026. Showcase videos and image examples were left out to keep the repo small. Each skill keeps its original licence file.

- HyperFrames: https://github.com/heygen-com/hyperframes
- onetake: https://github.com/feitangyuan/onetake
- Collage B-roll (English edition): https://github.com/MegaTroll222/VOX-COLLAGE-BROLL, adapted from https://github.com/pyang5166/gbro-collage-broll
- Claude Animation Base: https://github.com/JohnHeibel/ClaudeAnimationBase (the `SKILL.md` wrapper is mine)
- Lemo-Opuscar: https://github.com/lemomo-ai/lemo-opuscar

To update a skill, re-copy its folder from the upstream repo.

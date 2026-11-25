# ORVELLE — human version (Kling AI) — brief

Written 2026-11-25. Read `../MOTION.md`, `../brand.md` and `../CLAUDE.md` first. ORVELLE is a fictitious brand (concept/spec work).

## Goal
A 10s, 9:16 version of "The Portrait" ad in which a photoreal person (not a bust or mannequin) reacts to the scent of the perfume. Same voiceover, score and end card as `orvelle-portrait-vo-1080.mp4`.

## Why Kling
Building a believable human performance in code isn't feasible (no skin, hair or facial animation). Kling generates the human shot; our coded 3D end card and the existing voiceover are kept.

## Inputs
- Product reference: `kling/orvelle-bottle-reference.png` (bottle design: amber liquid, black square cap, gold collar, black-and-gold label "ORVELLE / MIDNIGHT SAFFRON"). Keep its shape and label.
- Voiceover: ElevenLabs take B (voice "Belle B – Premium Ad Narrator"), cut points and placements in `../vo-mix.sh`. The take is not in the repo. Download it again from the ElevenLabs flow `6as4Nle327TErIfyTevt` (generation `yxWAhZXNmy22DgXyOY1s`) or generate a new take with the same script.
- Score: `node ../score.js score.wav` with `HITS=0.4,3.0,3.5,5.0,6.35,7.45`.

## Shot plan (final timeline)
| Time | Picture | Voice (already timed) |
|---|---|---|
| 0.0–3.3 | Dark plum-black space. A narrow saffron light beam slides across her face; eyes closed, still. | "Some nights… are made to be remembered." |
| 3.3–7.3 | She sprays ORVELLE once on her inner wrist, raises it, inhales slowly. Eyes stay closed, shoulders soften, a slight smile; head tilts back a little as gold dust drifts in the beam. | "Saffron." (3.7) "Amber." (5.2) "Oud." (6.55) |
| 7.3–10.0 | Cut (0.3s dissolve) to the coded end card: bottle on the plinth + ORVELLE wordmark, from `../portrait.html` (hide the bust for this version). | "Orvelle." (7.55) "Midnight Saffron." (8.6) |

## Kling steps (each billed step needs the user's explicit approval, per the kling-ai skill)
1. `kling-ai-generate-image`: first frame. Woman holding the ORVELLE bottle at chest height, using `orvelle-bottle-reference.png` as the product reference. 9:16, photoreal.
2. `kling-ai-generate-video`: image-to-video from that first frame, 10s, 9:16, highest supported resolution (4K if offered, else 1080p). Use the first 7.3s.

### Video prompt (starting point)
Vertical cinematic fragrance film. A woman in her late twenties, dark hair pinned up, bare shoulders, black silk dress, in a dark plum-black gallery. A narrow warm saffron light beam slides slowly across her face. She holds the ORVELLE bottle (amber liquid, black square cap, gold collar, black-and-gold label). She sprays it once on her inner wrist, raises the wrist to her face and inhales slowly; her eyes close, her shoulders relax, a soft slight smile; her head tilts back a little as fine golden dust drifts through the beam. Camera: one slow continuous push-in from medium close-up to close-up, shallow depth of field, focus moving from the bottle to her face. Light: warm saffron key from upper right, gold rim light from behind, deep plum-black background. Photoreal skin texture, 35mm film look. No text, no extra people, no other products, no logos besides the bottle label.

## Assembly
1. End card: render `portrait.html` frames 7.3–10.0 with the bust and threads hidden (add a `?nobust` switch; the `productStill()` helper shows how to hide them) and re-centre the camera on the bottle.
2. Concatenate Kling 0–7.3s + end card with a 0.3s dissolve; strip Kling's own audio.
3. `../vo-mix.sh <video> <takeB.mp3> <score.wav> <out.mp4>`.
4. Encode per `reel-export` (H.264 high, yuv420p, tv range, bt709, AAC, faststart) and check with ffprobe. Output: `../orvelle-human-vo-1080.mp4` (and `-4k` if Kling delivered 4K).

## Checks before calling it done
- Bottle label and shape match the reference in every frame of the Kling clip that shows it.
- No extra fingers, warped hands or face drift; reject and say so rather than ship it.
- Text only in the end card, inside y 360–1420.
- Captions: reuse `../captions.md`; add "Human footage generated with Kling AI" and keep the head-scan credit only if the bust appears.

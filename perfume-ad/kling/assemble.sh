#!/usr/bin/env bash
# Assemble the human (Kling) version of "The Portrait" per kling/BRIEF.md.
# Usage (from perfume-ad/kling): ./assemble.sh <kling-clip.mp4> [take.mp3]
#   Default take: build/vo-take2.mp3 (ElevenLabs regen, cut points in vo-cuts-v4take2.txt). For the original take B: CUTS= ./assemble.sh clip.mp4 takeB.mp3
#   Kling clip 0–7.3s (its audio stripped) + coded end card (portrait.html?nobust) with a 0.3s dissolve at 7.0–7.3s,
#   then ../vo-mix.sh adds voiceover + score, then a reel-export encode and ffprobe check.
# Needs build/endcard-7.0-10.0-1080.mp4 and build/score.wav (rendered by: HITS=0.4,3.0,3.5,5.0,6.35,7.45 node ../score.js build/score.wav and node ../render.js --page portrait.html --scale 2 --query nobust --from 7.0 --out kling/build/endcard-7.0-10.0-1080.mp4).
set -euo pipefail
cd "$(dirname "$0")"
KLING=$1 TAKE=${2:-build/vo-take2.mp3}
export CUTS=${CUTS-vo-cuts-v4take2.txt}
B=build; mkdir -p "$B"
ENC="-c:v libx264 -profile:v high -crf 17 -preset slow -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709"

# 1. Kling 0–7.3s, conformed to 1080x1920 @30fps, no audio
ffmpeg -y -loglevel error -i "$KLING" -t 7.3 -an \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30,format=yuv420p" $ENC "$B/kling-0-7.3.mp4"

# 2. 0.3s dissolve into the end card (end card segment starts at t=7.0, so the dissolve runs 7.0–7.3)
ffmpeg -y -loglevel error -i "$B/kling-0-7.3.mp4" -i "$B/endcard-7.0-10.0-1080.mp4" \
  -filter_complex "[0:v]settb=1/30,setpts=PTS-STARTPTS[a];[1:v]settb=1/30,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=0.3:offset=7.0,format=yuv420p[v]" \
  -map "[v]" -t 10 $ENC -an "$B/picture-10s.mp4"

# 3. Voiceover + score
../vo-mix.sh "$B/picture-10s.mp4" "$TAKE" "$B/score.wav" "$B/mixed.mp4"

# 4. Reel export (H.264 high, yuv420p, tv range, bt709, AAC, faststart) + check
ffmpeg -y -loglevel error -i "$B/mixed.mp4" -c:v copy -c:a aac -b:a 192k -movflags +faststart ../orvelle-human-vo-1080.mp4
ffprobe -v error -show_entries stream=codec_type,codec_name,profile,width,height,pix_fmt,color_range,color_space,r_frame_rate:format=duration -of compact ../orvelle-human-vo-1080.mp4

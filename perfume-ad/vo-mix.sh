#!/usr/bin/env bash
# Mix the ElevenLabs voiceover (take B, "Belle B – Premium Ad Narrator") onto a rendered portrait video.
# Usage: ./vo-mix.sh <video.mp4> <takeB.mp3> <score.wav> <out.mp4>
# Each line is cut from the take at its measured word boundaries and placed on its visual beat.
# Note spacing: ~0.7s of air between "Saffron", "Amber" and "Oud".
set -euo pipefail
VIDEO=$1 TAKE=$2 SCORE=$3 OUT=$4

# name            take start  take end   place at (ms)
# Take B cut points below; set CUTS=<file> (same 4 columns, # comments allowed) to use another take, e.g. kling/vo-cuts-v4take2.txt
LINES=(
  "hook            0.15        3.22       250"    # Some nights... are made to be remembered.
  "saffron         4.06        4.93       3700"
  "amber           5.48        6.23       5200"
  "oud             6.68        7.35       6550"
  "orvelle         8.05        8.94       7550"
  "midnight        9.40        10.83      8600"   # Midnight Saffron.
)

if [ -n "${CUTS:-}" ]; then mapfile -t LINES < <(grep -v '^\s*\(#\|$\)' "$CUTS" | sed 's/#.*//'); fi
F=""; LABELS=""; i=0
for row in "${LINES[@]}"; do
  read -r name a b at <<<"$row"
  len=$(python3 -c "print(round($b-$a-0.08,3))")
  F+="[1:a]atrim=$a:$b,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=$len:d=0.08,adelay=$at|$at[l$i];"
  LABELS+="[l$i]"; i=$((i+1))
done
F+="${LABELS}amix=inputs=$i:normalize=0,aformat=channel_layouts=stereo,aecho=0.8:0.5:60:0.12,volume=1.8,apad=whole_dur=10,asplit=2[vo][key];"
F+="[2:a]volume=0.6,apad=whole_dur=10[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[duck];"
F+="[duck][vo]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,atrim=0:10[a]"

ffmpeg -y -loglevel error -i "$VIDEO" -i "$TAKE" -i "$SCORE" -filter_complex "$F" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -t 10 -movflags +faststart "$OUT"

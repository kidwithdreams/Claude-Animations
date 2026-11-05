#!/usr/bin/env bash
# 4 parallel segments -> silent.mp4 -> + audio/mix.wav -> brainfreeze.mp4 (1080x1920)
set -euo pipefail
cd "$(dirname "$0")"
export GL=${GL:-swiftshader}
B=(0 7 14 21 27.85)
pids=()
for i in 0 1 2 3; do node render.mjs video seg/part$i.mp4 30 ${B[$i]} ${B[$((i+1))]} > seg/log$i.txt 2>&1 & pids+=($!); done
for p in "${pids[@]}"; do wait "$p"; done
for i in 0 1 2 3; do echo "file '$PWD/seg/part$i.mp4'"; done > seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i seg/list.txt -c copy silent.mp4
ffmpeg -v error -y -i silent.mp4 -i audio/mix.wav -map 0:v -map 1:a -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
  -af "alimiter=limit=0.9:attack=2:release=60,loudnorm=I=-14:TP=-1.5:LRA=9" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart brainfreeze.mp4
echo done

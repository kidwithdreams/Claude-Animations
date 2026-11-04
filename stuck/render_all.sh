#!/usr/bin/env bash
# Renders STUCK in 4 parallel segments, joins them (silent.mp4), then muxes the mix -> stuck.mp4
set -euo pipefail
cd "$(dirname "$0")"
B=(0 28 56 84 111.8)
pids=()
for i in 0 1 2 3; do node render.mjs video seg/part$i.mp4 30 ${B[$i]} ${B[$((i+1))]} > seg/log$i.txt 2>&1 & pids+=($!); done
for p in "${pids[@]}"; do wait "$p"; done
for i in 0 1 2 3; do echo "file '$PWD/seg/part$i.mp4'"; done > seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i seg/list.txt -c copy silent.mp4
ffmpeg -v error -y -i silent.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v libx264 -crf 21 -preset slow -tune grain -pix_fmt yuv420p \
  -af "alimiter=limit=0.9:attack=2:release=60,loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart stuck.mp4
echo done

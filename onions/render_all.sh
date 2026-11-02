#!/usr/bin/env bash
# Renders the short in 4 parallel segments (split on shot cuts), then joins them: silent.mp4
set -euo pipefail
cd "$(dirname "$0")"
export GL=${GL:-swiftshader}
B=(0 8.2 17.5 24.9 32.0)
pids=()
for i in 0 1 2 3; do
  node render.mjs video seg/part$i.mp4 30 ${B[$i]} ${B[$((i+1))]} > seg/log$i.txt 2>&1 & pids+=($!)
done
for p in "${pids[@]}"; do wait "$p"; done
for i in 0 1 2 3; do echo "file '$PWD/seg/part$i.mp4'"; done > seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i seg/list.txt -c copy silent.mp4
echo done

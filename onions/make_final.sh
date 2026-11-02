#!/usr/bin/env bash
# silent.mp4 + audio/mix.wav -> why-onions-make-you-cry.mp4 (1080x1920, 30 fps, -14 LUFS)
set -euo pipefail
cd "$(dirname "$0")"
ffmpeg -v error -y -i silent.mp4 -i audio/mix.wav -map 0:v -map 1:a \
  -vf scale=1080:1920:flags=lanczos -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p \
  -af "alimiter=limit=0.9:attack=2:release=60,loudnorm=I=-14:TP=-1.5:LRA=9" -c:a aac -b:a 192k -ar 48000 \
  -shortest -movflags +faststart why-onions-make-you-cry.mp4
echo "done: $PWD/why-onions-make-you-cry.mp4"

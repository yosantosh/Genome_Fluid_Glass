#!/usr/bin/env bash
# Generate the flat acceptance-test wallpapers (400% zoom checks).
set -euo pipefail
magick -size 1920x1080 gradient:black-white ramp.png
magick -size 1920x1080 xc:'#808080' grey.png
magick -size 1920x1080 xc:'#ffffff' white.png
magick -size 1920x1080 xc:'#000000' black.png
echo "ramp/grey/white/black written. Add your teal, sunset, canyon shots = 7 backdrops."

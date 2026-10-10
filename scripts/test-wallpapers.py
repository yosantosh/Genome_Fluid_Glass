#!/usr/bin/env python3
"""Acceptance wallpapers for the Files glass test (no imagemagick needed).
Writes 1920x1080 PNGs into the current dir: ramp, grey, white, black,
split (half black/half white), checkerboard.
Blur proof: open Files over split.png — the black/white edge must read as
a soft gradient through the window; over checker.png it must melt to an
even tone. If edges stay razor sharp, the veil is fine but blur isn't
attaching (check BMS applications/blur + whitelist)."""
from PIL import Image, ImageDraw

W, H = 1920, 1080

Image.new("L", (W, 1)).resize((W, H)).convert("RGB").save("ramp.png")
ramp = Image.new("RGB", (W, H))
px = ramp.load()
for x in range(W):
    v = int(255 * x / (W - 1))
    for y in range(H):
        px[x, y] = (v, v, v)
ramp.save("ramp.png")

Image.new("RGB", (W, H), (128, 128, 128)).save("grey.png")
Image.new("RGB", (W, H), (255, 255, 255)).save("white.png")
Image.new("RGB", (W, H), (0, 0, 0)).save("black.png")

split = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(split)
d.rectangle([W // 2, 0, W, H], fill=(255, 255, 255))
split.save("split.png")

S = 120
checker = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(checker)
for y in range(0, H, S):
    for x in range(0, W, S):
        if (x // S + y // S) % 2:
            d.rectangle([x, y, x + S - 1, y + S - 1], fill=(255, 255, 255))
checker.save("checker.png")

print("wrote ramp/grey/white/black/split/checker.png")

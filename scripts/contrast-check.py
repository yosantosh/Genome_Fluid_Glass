#!/usr/bin/env python3
"""WCAG contrast from a screenshot: sample FG and BG pixels, print ratio.
Usage: ./scripts/contrast-check.py shot.png x1,y1 x2,y2 [x3,y3 ...]
  Each x,y samples one pixel; first point = text/icon, rest = backdrop.
  Averages the backdrop points. Screenshots: PrintScreen / Screenshot app,
  then zoom to 400% and pick coordinates (e.g. with a color picker).
  Pass: text >= 4.5:1, icons >= 3:1 on the brightest backdrop."""
import sys
from PIL import Image


def lum(rgb):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[:3]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def main():
    img = Image.open(sys.argv[1]).convert("RGB")
    pts = [tuple(map(int, p.split(","))) for p in sys.argv[2:]]
    fg = img.getpixel(pts[0])
    bgs = [img.getpixel(p) for p in pts[1:]]
    bg = tuple(sum(c) // len(bgs) for c in zip(*bgs))
    l1, l2 = lum(fg), lum(bg)
    ratio = (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
    print(f"fg={fg} bg={bg} ratio={ratio:.2f}:1 "
          f"({'PASS text' if ratio >= 4.5 else 'PASS icon-only' if ratio >= 3 else 'FAIL'})")


main()

# Dock Fluid Glass — Baseline (preserved 2026-10-09)

Working dock glass state on Ubuntu / GNOME Shell 50.1 / Wayland,
before building the combined pack in this repo.

## What was installed
- `liquid-glass@thinkingcoding1231.gmail.com` — third-party shader glass,
  only `enable-dock-glass=true` was good. QS/menu/notification glass in that
  extension is discarded (wrongly coded) and will be redesigned here.
  Upstream: https://github.com/ryohsuke1231/liquid-glass (not vendored —
  see `dconf/` for our dock tunings only).
- `dock-tight@local` — own local fix, vendored verbatim under
  `baseline/dock-tight/` (pill hugs icons, 10px float gap, tile-less icons,
  4px running dot, hairline separator).
- `blur-my-shell@aunetx` v74 — dock/panel/popup blur all OFF for dock path
  (dock glass comes from the shader, not BMS).

## Key dock tunings (from dconf)
- liquid-glass dock: blur-radius 3, brightness 1.02, contrast 1.08,
  saturation 1.8, corner-radius 18, glass-expand 6, margin-bottom 12,
  tint `#241f31` @ 0.05
- dash-to-dock: BOTTOM, shrink, `dash-max-icon-size 40`,
  `background-opacity 0.05`, `transparency-mode FIXED`, DOTS indicator

## Restore
```bash
dconf load /org/gnome/shell/extensions/dash-to-dock/ < baseline/dconf/dash-to-dock.ini
dconf load /org/gnome/shell/extensions/blur-my-shell/ < baseline/dconf/blur-my-shell-dock-panel-popup.ini
# liquid-glass dock keys: apply manually via dconf Editor or prefs UI,
# see liquid-glass-dock.ini (extension will be replaced by the new pack)
```

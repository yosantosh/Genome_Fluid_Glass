#!/usr/bin/env bash
# Install the new pack for local testing (Wayland: log out/in after).
set -euo pipefail
SRC="$(cd "$(dirname "$0")/../shell/genome-fluid-glass@local" && pwd)"
DEST="$HOME/.local/share/gnome-shell/extensions/genome-fluid-glass@local"
rm -rf "$DEST"
cp -r "$SRC" "$DEST"
glib-compile-schemas "$DEST/schemas"
# Kill BMS conflicts: shader owns the blur, BMS must not double-paint.
dconf write /org/gnome/shell/extensions/blur-my-shell/panel/blur false
dconf write /org/gnome/shell/extensions/blur-my-shell/panel/override-background false
dconf write /org/gnome/shell/extensions/blur-my-shell/popup/blur false
dconf write /org/gnome/shell/extensions/blur-my-shell/dash-to-dock/blur false
gnome-extensions enable genome-fluid-glass@local || true
echo "installed. Log out/in (Wayland has no shell restart), then test."

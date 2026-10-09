#!/usr/bin/env bash
# Genome Fluid Glass — full installer (shell extension + optional Nautilus GTK).
# Usage:
#   ./scripts/install.sh [--skip-gtk] [--no-enable]
# Wayland note: log out/in after install (no shell restart on Wayland).
set -euo pipefail

UUID="genome-fluid-glass@local"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/shell/$UUID"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
GTK_SRC="$REPO_ROOT/gtk/gtk-4.0"
GTK_DEST="$HOME/.config/gtk-4.0"
WITH_GTK=1
DO_ENABLE=1

for arg in "$@"; do
  case "$arg" in
    --skip-gtk) WITH_GTK=0 ;;
    --no-enable) DO_ENABLE=0 ;;
    -h|--help)
      echo "Usage: $0 [--skip-gtk] [--no-enable]"
      exit 0 ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

echo "==> Checking shell version"
if command -v gnome-shell >/dev/null 2>&1; then
  gnome-shell --version
else
  echo "WARNING: gnome-shell not found; continuing anyway" >&2
fi
command -v glib-compile-schemas >/dev/null 2>&1 || {
  echo "ERROR: glib-compile-schemas missing (install libglib2.0-bin)" >&2; exit 1; }

echo "==> Backing up settings"
BACKUP="$HOME/fluid-glass-backup-$(date +%Y%m%d-%H%M%S).dconf"
dconf dump / > "$BACKUP"
echo "    backup: $BACKUP"

echo "==> Validating source"
test -f "$SRC/metadata.json" || { echo "ERROR: $SRC/metadata.json missing" >&2; exit 1; }
test -f "$SRC/schemas/org.gnome.shell.extensions.genome-fluid-glass.gschema.xml" || {
  echo "ERROR: gschema missing" >&2; exit 1; }
python3 -c "import json; json.load(open('$SRC/metadata.json'))" \
  || { echo "ERROR: metadata.json is not valid JSON" >&2; exit 1; }
glib-compile-schemas --dry-run "$SRC/schemas" 2>/dev/null \
  || cp "$SRC/schemas/"*.xml /tmp/ && glib-compile-schemas /tmp/ >/dev/null

echo "==> Installing shell extension to $DEST"
rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -r "$SRC" "$DEST"
glib-compile-schemas "$DEST/schemas"

if [ "$WITH_GTK" -eq 1 ] && [ -d "$GTK_SRC" ]; then
  echo "==> Installing Nautilus GTK theme to $GTK_DEST"
  mkdir -p "$GTK_DEST"
  for f in gtk.css gtk-dark.css; do
    if [ -f "$GTK_SRC/$f" ]; then
      [ -f "$GTK_DEST/$f" ] && cp "$GTK_DEST/$f" "$GTK_DEST/$f.pre-fluid-glass.bak" || true
      cp "$GTK_SRC/$f" "$GTK_DEST/$f"
      echo "    installed $f"
    fi
  done
  echo "    (translucent twin of shell glass; GTK has no live wallpaper blur)"
else
  echo "==> Skipping GTK theme"
fi

echo "==> Neutralising Blur-my-Shell conflicts (shader owns the blur)"
dconf write /org/gnome/shell/extensions/blur-my-shell/panel/blur false || true
dconf write /org/gnome/shell/extensions/blur-my-shell/panel/override-background false || true
dconf write /org/gnome/shell/extensions/blur-my-shell/popup/blur false || true
dconf write /org/gnome/shell/extensions/blur-my-shell/dash-to-dock/blur false || true

if [ "$DO_ENABLE" -eq 1 ]; then
  echo "==> Enabling $UUID"
  gnome-extensions enable "$UUID" || {
    echo "Enable failed; try logging out/in, then: gnome-extensions enable $UUID" >&2; }
else
  echo "==> Installed but not enabled (--no-enable)"
fi

cat <<EOF
Done.
- Log OUT/IN (Wayland), then look top-right: the Fluid Glass droplet sits
  left of Wi-Fi/sound/battery. Click it to open settings.
- CLI fallback: gnome-extensions prefs $UUID
- Rollback: ./scripts/uninstall.sh --restore "$BACKUP"
EOF

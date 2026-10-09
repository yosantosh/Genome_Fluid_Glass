#!/usr/bin/env bash
# Genome Fluid Glass — uninstaller.
# Usage:
#   ./scripts/uninstall.sh [--remove-gtk] [--restore BACKUP.dconf]
set -euo pipefail

UUID="genome-fluid-glass@local"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"
GTK_DEST="$HOME/.config/gtk-4.0"
REMOVE_GTK=0
RESTORE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --remove-gtk) REMOVE_GTK=1; shift ;;
    --restore) RESTORE="${2:-}"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--remove-gtk] [--restore BACKUP.dconf]"; exit 0 ;;
    *) echo "Unknown flag: $1" >&2; exit 1 ;;
  esac
done

echo "==> Disabling $UUID (ignoring errors if shell is busy)"
gnome-extensions disable "$UUID" || true

if [ -d "$DEST" ]; then
  echo "==> Removing $DEST"
  rm -rf "$DEST"
else
  echo "==> Not installed at $DEST, nothing to remove"
fi

if [ "$REMOVE_GTK" -eq 1 ]; then
  for f in gtk.css gtk-dark.css; do
    if [ -f "$GTK_DEST/$f.pre-fluid-glass.bak" ]; then
      mv "$GTK_DEST/$f.pre-fluid-glass.bak" "$GTK_DEST/$f"
      echo "    restored $f from backup"
    elif [ -f "$GTK_DEST/$f" ]; then
      echo "    keeping $GTK_DEST/$f (no .pre-fluid-glass.bak found; delete manually if ours)"
    fi
  done
else
  echo "==> Keeping GTK files (pass --remove-gtk to restore them)"
fi

if [ -n "$RESTORE" ]; then
  test -f "$RESTORE" || { echo "ERROR: backup $RESTORE not found" >&2; exit 1; }
  echo "==> Restoring settings from $RESTORE"
  dconf load / < "$RESTORE"
fi

echo "Done. Log OUT/IN to fully clear the top-bar icon and glass."

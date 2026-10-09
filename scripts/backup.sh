#!/usr/bin/env bash
# Back up theme state + extension settings before touching anything.
set -euo pipefail
OUT="${1:-$HOME/fluid-glass-backup.dconf}"
dconf dump / > "$OUT"
echo "backed up to $OUT"

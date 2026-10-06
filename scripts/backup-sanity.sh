#!/bin/zsh
# Sanity dataset yedegi: iCloud Drive'a tarih damgali .tar.gz, son 8 kopya kalir.
# Oturum: `npx sanity login` (GitHub hesabi) yapilmis olmali.
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Backups/uzay-sanity"
mkdir -p "$DEST"
OUT="$DEST/uzay-production-$(date +%Y%m%d-%H%M).tar.gz"
npx sanity dataset export production "$OUT" --overwrite
test -s "$OUT"
ls -1t "$DEST"/uzay-production-*.tar.gz | tail -n +9 | while read -r f; do rm -- "$f"; done
echo "Yedek: $OUT ($(du -h "$OUT" | cut -f1))"

#!/usr/bin/env bash
set -euo pipefail
for f in index.html admin.css admin.js; do
  [[ -f "$f" ]] || { echo "Run from admin project root; missing $f"; exit 1; }
done
backup="_backup_before_patch_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup"
cp index.html admin.css admin.js "$backup/"
[[ ! -f nbiu-logo.jpg ]] || cp nbiu-logo.jpg "$backup/"
cp "$(dirname "$0")/index.html" index.html
cp "$(dirname "$0")/admin.css" admin.css
cp "$(dirname "$0")/admin.js" admin.js
cp "$(dirname "$0")/nbiu-logo.jpg" nbiu-logo.jpg
echo "Patch applied. Backup: $backup"
echo "Supabase remains unconnected; no fake data is shown."

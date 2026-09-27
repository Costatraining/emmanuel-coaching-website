#!/bin/sh
# Resizes original photos into the web-ready JPEGs the site uses.
# Uses only built-in macOS tools; camera rotation is applied automatically.
#
# 1. Put the original in source/photos-original/ named one of:
#      hero, stage, pose, inperson, apply
# 2. From the project folder, run:  sh tools/optimize-photos.sh
# 3. Commit the changed files in public/assets/img/
cd "$(dirname "$0")/.." || exit 1
tmp=$(mktemp -d)
for src in source/photos-original/*; do
  [ -f "$src" ] || continue
  name=$(basename "$src"); name=${name%.*}
  qlmanage -t -s 2400 -o "$tmp" "$src" >/dev/null 2>&1
  png="$tmp/$(basename "$src").png"
  [ -f "$png" ] || { echo "Skipped $src"; continue; }
  for w in 640 1080 1600; do
    sips -s format jpeg -s formatOptions 76 --resampleWidth "$w" "$png" \
      --out "public/assets/img/$name-$w.jpg" >/dev/null && echo "public/assets/img/$name-$w.jpg"
  done
done
rm -rf "$tmp"

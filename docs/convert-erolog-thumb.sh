#!/bin/bash
# エロタレのサムネ（WebP 偽装 .png 含む）→ Blogterest 用 JPG
# 使い方: ./convert-erolog-thumb.sh 保存した画像.png
# 出力: 同じフォルダに thumb-YYYYMMDD-HHMMSS.jpg

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "使い方: $0 <画像ファイル>"
  echo "例: $0 ~/Downloads/thumbnail.png"
  exit 1
fi

INPUT="$1"
if [ ! -f "$INPUT" ]; then
  echo "ファイルが見つかりません: $INPUT"
  exit 1
fi

DIR="$(cd "$(dirname "$INPUT")" && pwd)"
BASE="$(basename "$INPUT")"
OUT="$DIR/thumb-$(date +%Y%m%d-%H%M%S).jpg"

sips -s format jpeg "$INPUT" --out "$OUT" >/dev/null
echo "変換完了: $OUT"
file "$OUT"
ls -lh "$OUT"

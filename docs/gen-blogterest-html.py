#!/usr/bin/env python3
"""Blogterest「動画埋め込み(htmlソース)」用・改行なし1行HTMLを生成する。

Blogterest は複数行＋空行で貼ると <script> が <p> 内に入りやすい。
生成結果を1回でコピペする（文章タブは空のまま）。

Usage:
  python3 gen-blogterest-html.py "あらすじ1行目" "あらすじ2行目" "https://動画URL"
  python3 gen-blogterest-html.py --copy "..." "..." "https://..."
  python3 gen-blogterest-html.py --file article.txt   # 3行: あらすじ1\\nあらすじ2\\nURL
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys

from erolog_article import build_html


def copy_to_clipboard(text: str) -> bool:
    if shutil.which("pbcopy"):
        subprocess.run(["pbcopy"], input=text.encode("utf-8"), check=True)
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Blogterest htmlソース用1行HTML")
    parser.add_argument("--copy", action="store_true", help="Mac: クリップボードへコピー")
    parser.add_argument("--file", type=str, help="3行ファイル（あらすじ1/2/URL）")
    parser.add_argument("line1", nargs="?", help="あらすじ1行目")
    parser.add_argument("line2", nargs="?", help="あらすじ2行目")
    parser.add_argument("video_url", nargs="?", help="動画向きURL")
    args = parser.parse_args()

    if args.file:
        with open(args.file, encoding="utf-8") as f:
            lines = [ln.rstrip("\n") for ln in f.readlines()]
        if len(lines) < 3:
            sys.exit(" --file には3行以上（あらすじ1, あらすじ2, URL）が必要です")
        line1, line2, url = lines[0], lines[1], lines[2]
    elif args.line1 and args.line2 and args.video_url:
        line1, line2, url = args.line1, args.line2, args.video_url
    else:
        parser.print_help()
        sys.exit(1)

    out = build_html(line1, line2, url)
    print(out)
    if args.copy:
        if copy_to_clipboard(out):
            print("\n（クリップボードにコピーしました → htmlソースタブに貼り付け）", file=sys.stderr)
        else:
            print("\n（pbcopy なし: 上の1行を手動でコピー）", file=sys.stderr)


if __name__ == "__main__":
    main()

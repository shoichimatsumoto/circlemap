#!/usr/bin/env python3
"""pillar-c-wp-mirror.csv → WordPress ミラー.

運用: Blogterest 新規登録（遅延OK）ごとに pillar-c-wp-mirror.csv へ1行追加して実行。
wp_post_id が空の行だけ投稿する。

Usage:
  python3 wp-post-mirror.py --list
  python3 wp-post-mirror.py --page 44707610
  python3 wp-post-mirror.py --all
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from erolog_article import build_html_wp
from wp_client import CONFIG_ENV, get_client, wp_request
from wp_mirror_lib import MIRROR_CSV, post_mirror_row, read_mirror_rows, write_mirror_rows


def refresh_row(row: dict[str, str], base: str, user: str, app_password: str) -> None:
    post_id = row.get("wp_post_id", "").strip()
    if not post_id:
        raise RuntimeError(f"wp_post_id がありません: {row['eroterest_page']}")
    content = build_html_wp(row["line1"], row["line2"], row["video_url"])
    wp_request(
        base,
        user,
        app_password,
        "POST",
        f"/wp-json/wp/v2/posts/{post_id}",
        {"content": content},
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="WP ミラー投稿（pillar-c-wp-mirror.csv）")
    parser.add_argument("--config", type=Path, default=CONFIG_ENV)
    parser.add_argument("--csv", type=Path, default=MIRROR_CSV)
    parser.add_argument("--list", action="store_true", help="未ミラー一覧")
    parser.add_argument("--page", type=int, help="eroterest_page を1件ミラー")
    parser.add_argument("--all", action="store_true", help="未ミラーを全部")
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="済み行の本文を build_html_wp で上書き（MGS ショートコード反映）",
    )
    args = parser.parse_args()

    if not args.csv.is_file():
        sys.exit(f"ミラー CSV がありません: {args.csv}")
    fieldnames, rows = read_mirror_rows(args.csv)

    if args.list:
        for row in rows:
            mark = "済" if row.get("wp_post_id", "").strip() else "未"
            print(f"[{mark}] {row['eroterest_page']} {row['title'][:40]}")
        return

    if not args.page and not args.all and not args.refresh:
        parser.print_help()
        sys.exit(1)

    targets = rows
    if args.page:
        targets = [r for r in rows if int(r["eroterest_page"]) == args.page]
        if not targets:
            sys.exit(f"eroterest_page={args.page} が CSV にありません")

    base, user, app_password = get_client(args.config)

    if args.refresh:
        refreshed = 0
        for row in targets:
            if not row.get("wp_post_id", "").strip():
                print(f"スキップ（未投稿）: {row['eroterest_page']}")
                continue
            refresh_row(row, base, user, app_password)
            print(f"本文更新 OK: page={row['eroterest_page']} id={row['wp_post_id']}")
            refreshed += 1
        if not refreshed:
            sys.exit("更新対象がありません")
        return

    posted = 0
    for row in targets:
        if row.get("wp_post_id", "").strip():
            print(f"スキップ（済）: {row['eroterest_page']}")
            continue
        post_id, link = post_mirror_row(row, base, user, app_password)
        row["wp_post_id"] = str(post_id)
        print(f"下書き作成 OK: page={row['eroterest_page']} id={post_id} {link}")
        posted += 1

    if posted:
        write_mirror_rows(rows, args.csv, fieldnames)


if __name__ == "__main__":
    main()

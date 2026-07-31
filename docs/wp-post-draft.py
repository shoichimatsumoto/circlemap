#!/usr/bin/env python3
"""WordPress REST API でエログ記事を下書き投稿する（Blogterest 並行運用用）.

Usage:
  cp wp-config.example.env wp-config.env   # 編集して認証情報を入れる
  python3 wp-post-draft.py \\
    --title '＜秘密＞｜…ｗ' \\
    --line1 'あらすじ1行目' \\
    --line2 'あらすじ2行目' \\
    --video-url 'https://upornia.com/...' \\
    --tags '人妻 筆おろし 清楚' \\
    --eroterest-page 44707650

  python3 wp-post-draft.py --dry-run ...   # 投稿せず HTML だけ表示
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from erolog_article import build_html, build_html_wp
from wp_client import CONFIG_ENV, get_client, resolve_tag_ids, wp_request


def main() -> None:
    parser = argparse.ArgumentParser(description="WordPress 下書き投稿（エログメモ）")
    parser.add_argument("--config", type=Path, default=CONFIG_ENV)
    parser.add_argument("--title", required=True)
    parser.add_argument("--line1", required=True)
    parser.add_argument("--line2", required=True)
    parser.add_argument("--video-url", required=True)
    parser.add_argument("--tags", default="", help="半角スペース区切り（最大8個推奨）")
    parser.add_argument("--eroterest-page", type=int, default=0)
    parser.add_argument("--status", default="draft", choices=["draft", "publish", "future"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print(build_html(args.line1, args.line2, args.video_url))
        print("\n--- WordPress 用 ---")
        print(build_html_wp(args.line1, args.line2, args.video_url))
        return

    content = build_html_wp(args.line1, args.line2, args.video_url)

    try:
        base, user, app_password = get_client(args.config)
    except RuntimeError as exc:
        msg = str(exc)
        if "401" in msg or "rest_not_logged_in" in msg:
            sys.exit(
                "認証失敗（401）。WP_USER とアプリケーションパスワードを確認し、"
                " CloudSecure WP Security が REST API をブロックしていないかも見てください。"
            )
        sys.exit(msg)

    tag_names = args.tags.split()[:8]
    tag_ids = resolve_tag_ids(base, user, app_password, tag_names) if tag_names else []

    meta: dict[str, str | int] = {}
    if args.eroterest_page:
        meta["eroterest_page"] = args.eroterest_page
        meta["video_url"] = args.video_url

    payload: dict = {
        "title": args.title,
        "content": content,
        "status": args.status,
        "tags": tag_ids,
    }
    if meta:
        payload["meta"] = meta

    result = wp_request(base, user, app_password, "POST", "/wp-json/wp/v2/posts", payload)
    if not isinstance(result, dict):
        sys.exit("投稿応答が不正です")
    post_id = result.get("id")
    link = result.get("link", "")
    print(f"下書き作成 OK: id={post_id} {link}")


if __name__ == "__main__":
    main()

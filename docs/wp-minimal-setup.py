#!/usr/bin/env python3
"""WordPress 最小限セットアップ（固定ページ3 + コメントOFF）.

Usage:
  python3 wp-minimal-setup.py --dry-run
  python3 wp-minimal-setup.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from wp_client import CONFIG_ENV, get_client, wp_request

PAGES: list[dict[str, str]] = [
    {
        "slug": "about",
        "title": "運営者情報",
        "content": """<h2>サイト名</h2>
<p>エログメモ（staging）</p>
<h2>運営者</h2>
<p>個人運営（エログ試行錯誤メモ）</p>
<h2>サイトの目的</h2>
<p>アダルト動画の情報をまとめ、視聴先への案内を行うサイトです。</p>
<h2>お問い合わせ</h2>
<p><a href="/contact/">お問い合わせページ</a>よりご連絡ください。</p>
<h2>免責事項</h2>
<p>当サイトはリンク先のコンテンツについて一切の責任を負いません。各サービスの利用はご自身の責任でお願いします。18歳未満の方の閲覧は禁止です。</p>""",
    },
    {
        "slug": "privacy",
        "title": "プライバシーポリシー",
        "content": """<h2>個人情報の取り扱い</h2>
<p>当サイトでは、お問い合わせ時に入力されたメールアドレス・お名前等を、お問い合わせへの返信目的のみに利用します。</p>
<h2>第三者への提供</h2>
<p>法令に基づく場合を除き、個人情報を第三者に提供することはありません。</p>
<h2>Cookie・広告について</h2>
<p>当サイトでは WordPress および各種広告サービスにより Cookie が使用される場合があります。</p>
<h2>お問い合わせ</h2>
<p><a href="/contact/">お問い合わせページ</a>よりご連絡ください。</p>
<p>制定日: 2026年7月11日</p>""",
    },
    {
        "slug": "contact",
        "title": "お問い合わせ",
        "content": """<p>エログメモへのお問い合わせは、下記よりお願いします。</p>
<p>広告掲載・リンク削除・その他のご連絡を受け付けています。</p>
<p>（本番切替前は Cocoon の問い合わせフォームまたはメールリンクをここに設置してください）</p>""",
    },
]


def find_page_by_slug(base: str, user: str, pw: str, slug: str) -> dict | None:
    import urllib.parse

    q = urllib.parse.urlencode({"slug": slug, "per_page": 1})
    found = wp_request(base, user, pw, "GET", f"/wp-json/wp/v2/pages?{q}")
    if isinstance(found, list) and found:
        return found[0]
    return None


def upsert_page(
    base: str, user: str, pw: str, spec: dict[str, str], dry_run: bool
) -> None:
    existing = find_page_by_slug(base, user, pw, spec["slug"])
    payload = {
        "title": spec["title"],
        "content": spec["content"],
        "status": "publish",
        "comment_status": "closed",
        "slug": spec["slug"],
    }
    if dry_run:
        action = "更新" if existing else "作成"
        print(f"[dry-run] {action}: {spec['title']} (/{spec['slug']}/)")
        return
    if existing:
        pid = existing["id"]
        result = wp_request(base, user, pw, "POST", f"/wp-json/wp/v2/pages/{pid}", payload)
        link = result.get("link", "") if isinstance(result, dict) else ""
        print(f"更新 OK: {spec['title']} id={pid} {link}")
    else:
        result = wp_request(base, user, pw, "POST", "/wp-json/wp/v2/pages", payload)
        if not isinstance(result, dict):
            sys.exit("ページ作成に失敗しました")
        print(f"作成 OK: {spec['title']} id={result.get('id')} {result.get('link', '')}")


def close_discussion(base: str, user: str, pw: str, dry_run: bool) -> None:
    settings = {
        "default_comment_status": "closed",
        "default_ping_status": "closed",
    }
    if dry_run:
        print("[dry-run] 設定: 新規投稿のコメント・ピンバック OFF")
        return
    wp_request(base, user, pw, "POST", "/wp-json/wp/v2/settings", settings)
    print("設定 OK: 新規投稿のコメント・ピンバック OFF")


def close_post_comments(base: str, user: str, pw: str, dry_run: bool) -> None:
    posts = wp_request(base, user, pw, "GET", "/wp-json/wp/v2/posts?per_page=100&status=any")
    if not isinstance(posts, list):
        return
    for post in posts:
        pid = post.get("id")
        if post.get("comment_status") == "closed":
            continue
        if dry_run:
            print(f"[dry-run] 投稿 id={pid} コメント OFF")
            continue
        wp_request(base, user, pw, "POST", f"/wp-json/wp/v2/posts/{pid}", {"comment_status": "closed"})
        print(f"投稿 id={pid} コメント OFF")


def main() -> None:
    parser = argparse.ArgumentParser(description="WP 最小限セットアップ")
    parser.add_argument("--config", type=Path, default=CONFIG_ENV)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print("=== dry-run ===")
        for spec in PAGES:
            upsert_page("", "", "", spec, True)
        close_discussion("", "", "", True)
        close_post_comments("", "", "", True)
        return

    base, user, pw = get_client(args.config)
    for spec in PAGES:
        upsert_page(base, user, pw, spec, False)
    close_discussion(base, user, pw, False)
    close_post_comments(base, user, pw, False)


if __name__ == "__main__":
    main()

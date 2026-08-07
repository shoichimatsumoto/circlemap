#!/usr/bin/env python3
"""エロタレ page のサムネ → WP メディア → アイキャッチ設定.

Usage:
  python3 wp-set-featured.py --post-id 109
  python3 wp-set-featured.py --post-id 109,110,111,112,113
  python3 wp-set-featured.py --page 44709854
  python3 wp-set-featured.py --from-mirror --post-id 109,110
"""

from __future__ import annotations

import argparse
import base64
import csv
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

from wp_client import CONFIG_ENV, get_client, wp_request
from wp_mirror_lib import MIRROR_CSV, read_mirror_rows

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
IMG_FLUID = re.compile(
    r'<img[^>]+class="img-fluid"[^>]+src="([^"]+)"',
    re.I,
)
IMG_FLUID_ALT = re.compile(
    r'<img[^>]+src="([^"]+)"[^>]+class="img-fluid"',
    re.I,
)


def fetch_eroterest_thumb(eroterest_page: int) -> tuple[str, bytes, str]:
    url = f"https://movie.eroterest.net/page/{eroterest_page}/"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        html = resp.read().decode("utf-8", "ignore")
    m = IMG_FLUID.search(html) or IMG_FLUID_ALT.search(html)
    if not m:
        raise RuntimeError(f"サムネ img-fluid が見つかりません: page={eroterest_page}")
    img_url = m.group(1)
    if img_url.startswith("//"):
        img_url = "https:" + img_url
    img_req = urllib.request.Request(
        img_url,
        headers={
            "User-Agent": UA,
            "Referer": url,
        },
    )
    with urllib.request.urlopen(img_req, timeout=20) as resp:
        data = resp.read()
        ctype = resp.headers.get("Content-Type", "image/jpeg")
    ext = ".jpg"
    if "png" in ctype or img_url.lower().endswith(".png"):
        ext = ".png"
    elif "webp" in ctype or img_url.lower().endswith(".webp"):
        ext = ".webp"
    filename = f"eroterest-{eroterest_page}{ext}"
    return filename, data, ctype.split(";")[0].strip() or "image/jpeg"


def upload_media(
    base_url: str,
    user: str,
    app_password: str,
    filename: str,
    data: bytes,
    content_type: str,
) -> int:
    url = f"{base_url.rstrip('/')}/wp-json/wp/v2/media"
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Disposition", f'attachment; filename="{filename}"')
    req.add_header("Content-Type", content_type)
    req.add_header("Accept", "application/json")
    token = f"{user}:{app_password}".encode("utf-8")
    req.add_header("Authorization", "Basic " + base64.b64encode(token).decode("ascii"))
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read().decode("utf-8")
            result = __import__("json").loads(body)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"メディアアップロード失敗 {exc.code}: {detail[:800]}") from exc
    if not isinstance(result, dict) or not result.get("id"):
        raise RuntimeError("メディア応答が不正です")
    return int(result["id"])


def set_featured_media(
    base_url: str,
    user: str,
    app_password: str,
    post_id: int,
    media_id: int,
) -> None:
    wp_request(
        base_url,
        user,
        app_password,
        "POST",
        f"/wp-json/wp/v2/posts/{post_id}",
        {"featured_media": media_id},
    )


def mirror_by_post_id(post_ids: list[int]) -> dict[int, dict[str, str]]:
    _, rows = read_mirror_rows()
    out: dict[int, dict[str, str]] = {}
    for row in rows:
        pid = row.get("wp_post_id", "").strip()
        if pid.isdigit() and int(pid) in post_ids:
            out[int(pid)] = row
    return out


def parse_post_ids(raw: str) -> list[int]:
    return [int(x.strip()) for x in raw.split(",") if x.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="WP アイキャッチ設定（エロタレサムネ）")
    parser.add_argument("--config", type=Path, default=CONFIG_ENV)
    parser.add_argument("--post-id", help="WP post id（カンマ区切り）")
    parser.add_argument("--page", type=int, help="eroterest_page を1件")
    parser.add_argument("--dry-run", action="store_true", help="サムネURL取得のみ")
    args = parser.parse_args()

    if not args.post_id and not args.page:
        parser.print_help()
        sys.exit(1)

    base, user, pw = get_client(args.config)

    jobs: list[tuple[int, int]] = []  # (wp_post_id, eroterest_page)
    if args.page:
        _, rows = read_mirror_rows()
        match = next((r for r in rows if r.get("eroterest_page") == str(args.page)), None)
        if not match or not match.get("wp_post_id", "").strip():
            sys.exit(f"eroterest_page={args.page} の WP 投稿が見つかりません")
        jobs.append((int(match["wp_post_id"]), args.page))
    if args.post_id:
        post_ids = parse_post_ids(args.post_id)
        by_post = mirror_by_post_id(post_ids)
        for pid in post_ids:
            row = by_post.get(pid)
            if not row:
                sys.exit(f"wp_post_id={pid} がミラー CSV にありません")
            jobs.append((pid, int(row["eroterest_page"])))

    for post_id, eroterest_page in jobs:
        filename, data, ctype = fetch_eroterest_thumb(eroterest_page)
        print(f"page={eroterest_page} post={post_id} thumb={filename} ({len(data)} bytes)")
        if args.dry_run:
            continue
        media_id = upload_media(base, user, pw, filename, data, ctype)
        set_featured_media(base, user, pw, post_id, media_id)
        print(f"  アイキャッチ OK: post={post_id} media={media_id}")


if __name__ == "__main__":
    main()

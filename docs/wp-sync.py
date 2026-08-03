#!/usr/bin/env python3
"""WordPress ミラー自動化（Phase 3 入口）.

Usage:
  python3 wp-sync.py status              # キュー vs ミラー状態
  python3 wp-sync.py stash-add ...       # 文案を stash へ
  python3 wp-sync.py draft-stash         # stash → WP 下書き（Blogterest 不要）
  python3 wp-sync.py draft-stash --page ID
  python3 wp-sync.py run                 # 遅延OK 分を sync-mirror + WP 下書き
  python3 wp-sync.py run --page ID
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from wp_client import CONFIG_ENV, get_client
from wp_mirror_lib import (
    MIRROR_CSV,
    append_copy_stash,
    import_stash_to_mirror,
    mirror_index,
    mirror_policy_row,
    post_mirror_row,
    queue_ok_pages,
    read_mirror_rows,
    read_queue_rows,
    read_copy_stash,
    stash_index,
    sync_mirror_from_stash,
    write_mirror_rows,
)


def cmd_status() -> int:
    queue_rows = read_queue_rows()
    _, mirror_rows = read_mirror_rows()
    _, stash_rows = read_copy_stash()
    idx = mirror_index(mirror_rows)
    stash = stash_index(stash_rows)
    ok_rows = queue_ok_pages(queue_rows)
    in_scope = [r for r in ok_rows if mirror_policy_row(r, idx)]
    out_scope = [r for r in ok_rows if not mirror_policy_row(r, idx)]

    print("=== 遅延OK × WP ミラー（page/93 以降） ===")
    if not in_scope:
        print("（対象なし）")
    for row in in_scope:
        page = row.get("eroterest_page", "").strip()
        bt = row.get("blogterest_page", "").strip() or "—"
        title = row.get("1回目タイトル", "")[:36]
        m = idx.get(page)
        if m and m.get("wp_post_id", "").strip():
            mark = f"済 id={m['wp_post_id']}"
        elif m:
            mark = "未ミラー"
        elif page in stash:
            mark = "要sync-mirror"
        else:
            mark = "要stash-add"
        print(f"  BT page/{bt}  eroterest={page}  [{mark}]  {title}")

    if out_scope:
        print(f"\n（過去分 {len(out_scope)} 件 — ミラー対象外）")

    pending = [r for r in mirror_rows if not r.get("wp_post_id", "").strip()]
    print(f"\n=== ミラー CSV 未投稿: {len(pending)} 件 ===")
    for row in pending:
        print(f"  {row['eroterest_page']} {row['title'][:40]}")

    if stash:
        print("\n=== stash（WP 先行投稿可・Blogterest 不要） ===")
        for page, s in sorted(stash.items(), key=lambda x: x[0]):
            m = idx.get(page)
            if m and m.get("wp_post_id", "").strip():
                mark = f"WP id={m['wp_post_id']}"
            elif m:
                mark = "要draft-stash"
            else:
                mark = "要draft-stash"
            print(f"  eroterest={page}  [{mark}]  {s.get('title', '')[:36]}")
    return 0


def cmd_stash_add(args: argparse.Namespace) -> int:
    append_copy_stash(
        args.page,
        args.title,
        args.line1,
        args.line2,
        args.video_url,
        args.tags,
    )
    print(f"stash 保存 OK: eroterest_page={args.page}")
    return 0


def cmd_sync_mirror() -> int:
    added = sync_mirror_from_stash()
    if added:
        for page in added:
            print(f"ミラー CSV 追加: eroterest_page={page}")
    else:
        print("追加なし（遅延OK + stash あり + 未ミラーの組み合わせがありません）")
    return 0


def _post_pending(page: int | None, config: Path) -> int:
    fieldnames, rows = read_mirror_rows()
    if page:
        targets = [r for r in rows if int(r["eroterest_page"]) == page]
        if not targets:
            return 0
    else:
        targets = rows

    base, user, pw = get_client(config)
    posted = 0
    for row in targets:
        if row.get("wp_post_id", "").strip():
            print(f"スキップ（済）: {row['eroterest_page']}")
            continue
        post_id, link = post_mirror_row(row, base, user, pw)
        row["wp_post_id"] = str(post_id)
        print(f"下書き作成 OK: page={row['eroterest_page']} id={post_id} {link}")
        posted += 1

    if posted:
        write_mirror_rows(rows, MIRROR_CSV, fieldnames)
    return posted


def cmd_draft_stash(page: int | None, config: Path) -> int:
    """Blogterest / 遅延OK を待たず stash から WP 下書きへ（staging 用）。"""
    added = import_stash_to_mirror(page)
    if added:
        print(f"ミラー CSV 取込: {', '.join(added)}")
    posted = _post_pending(page, config)
    if not added and not posted:
        print("対象なし（stash 空 or 既に WP 済）")
    return 0


def cmd_run(page: int | None, config: Path) -> int:
    added = sync_mirror_from_stash()
    if added:
        print(f"sync-mirror: {len(added)} 件追加")

    if page:
        fieldnames, rows = read_mirror_rows()
        if not any(int(r["eroterest_page"]) == page for r in rows):
            sys.exit(f"eroterest_page={page} がミラー CSV にありません（stash-add → run を確認）")

    posted = _post_pending(page, config)
    if not posted and not added:
        print("投稿対象なし")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="WP ミラー自動化")
    parser.add_argument("--config", type=Path, default=CONFIG_ENV)
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("status", help="キューとミラー CSV の突合")
    sub.add_parser("sync-mirror", help="stash → ミラー CSV（遅延OK のみ）")

    draft_p = sub.add_parser("draft-stash", help="stash → WP 下書き（Blogterest 不要）")
    draft_p.add_argument("--page", type=int, help="eroterest_page を1件")

    stash_p = sub.add_parser("stash-add", help="文案を stash CSV へ保存")
    stash_p.add_argument("--page", type=int, required=True, help="eroterest_page")
    stash_p.add_argument("--title", required=True)
    stash_p.add_argument("--line1", required=True)
    stash_p.add_argument("--line2", required=True)
    stash_p.add_argument("--video-url", required=True)
    stash_p.add_argument("--tags", required=True, help="スペース区切り・最大8")

    run_p = sub.add_parser("run", help="sync-mirror 後、未ミラーを WP 下書きへ")
    run_p.add_argument("--page", type=int, help="eroterest_page を1件")

    args = parser.parse_args()
    if args.cmd == "status":
        raise SystemExit(cmd_status())
    if args.cmd == "stash-add":
        raise SystemExit(cmd_stash_add(args))
    if args.cmd == "sync-mirror":
        raise SystemExit(cmd_sync_mirror())
    if args.cmd == "draft-stash":
        raise SystemExit(cmd_draft_stash(args.page, args.config))
    if args.cmd == "run":
        raise SystemExit(cmd_run(args.page, args.config))


if __name__ == "__main__":
    main()

"""WordPress ミラー CSV の読み書き・投稿."""

from __future__ import annotations

import csv
from pathlib import Path

from erolog_article import build_html_wp
from wp_client import resolve_tag_ids, wp_request

MIRROR_CSV = Path(__file__).with_name("pillar-c-wp-mirror.csv")
QUEUE_CSV = Path(__file__).with_name("pillar-c-reflection-queue.csv")
COPY_STASH_CSV = Path(__file__).with_name("pillar-c-copy-stash.csv")

MIRROR_FIELDS = [
    "eroterest_page",
    "title",
    "line1",
    "line2",
    "video_url",
    "tags",
    "wp_post_id",
]

STASH_FIELDS = [
    "eroterest_page",
    "title",
    "line1",
    "line2",
    "video_url",
    "tags",
]

MIRROR_POLICY_BT_MIN = 93


def read_mirror_rows(path: Path = MIRROR_CSV) -> tuple[list[str], list[dict[str, str]]]:
    if not path.is_file():
        return MIRROR_FIELDS, []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or MIRROR_FIELDS)
        rows = [dict(row) for row in reader]
    return fieldnames, rows


def write_mirror_rows(
    rows: list[dict[str, str]],
    path: Path = MIRROR_CSV,
    fieldnames: list[str] | None = None,
) -> None:
    fieldnames = fieldnames or MIRROR_FIELDS
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def read_queue_rows(path: Path = QUEUE_CSV) -> list[dict[str, str]]:
    if not path.is_file():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def append_mirror_row(
    eroterest_page: int,
    title: str,
    line1: str,
    line2: str,
    video_url: str,
    tags: str,
    path: Path = MIRROR_CSV,
) -> None:
    fieldnames, rows = read_mirror_rows(path)
    page_str = str(eroterest_page)
    for row in rows:
        if row.get("eroterest_page", "").strip() == page_str:
            row.update(
                {
                    "title": title,
                    "line1": line1,
                    "line2": line2,
                    "video_url": video_url,
                    "tags": tags,
                }
            )
            write_mirror_rows(rows, path, fieldnames)
            return
    rows.append(
        {
            "eroterest_page": page_str,
            "title": title,
            "line1": line1,
            "line2": line2,
            "video_url": video_url,
            "tags": tags,
            "wp_post_id": "",
        }
    )
    write_mirror_rows(rows, path, fieldnames)


def post_mirror_row(row: dict[str, str], base: str, user: str, app_password: str) -> tuple[int, str]:
    title = row["title"].strip()
    line1 = row["line1"].strip()
    line2 = row["line2"].strip()
    video_url = row["video_url"].strip()
    tags = row.get("tags", "").split()[:8]
    page_id = int(row["eroterest_page"])

    content = build_html_wp(line1, line2, video_url)
    tag_ids = resolve_tag_ids(base, user, app_password, tags) if tags else []
    payload: dict = {
        "title": title,
        "content": content,
        "status": "draft",
        "tags": tag_ids,
        "meta": {"eroterest_page": page_id, "video_url": video_url},
    }
    result = wp_request(base, user, app_password, "POST", "/wp-json/wp/v2/posts", payload)
    if not isinstance(result, dict):
        raise RuntimeError("投稿応答が不正です")
    return int(result["id"]), str(result.get("link", ""))


def mirror_index(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {r["eroterest_page"].strip(): r for r in rows if r.get("eroterest_page", "").strip()}


def queue_ok_pages(queue_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    return [r for r in queue_rows if r.get("状態", "").strip() == "遅延OK"]


def mirror_policy_row(row: dict[str, str], idx: dict[str, dict[str, str]]) -> bool:
    """page/93 以降の遅延OK、または既にミラー CSV にある行。"""
    page = row.get("eroterest_page", "").strip()
    if page in idx:
        return True
    bt = row.get("blogterest_page", "").strip()
    if bt.isdigit() and int(bt) >= MIRROR_POLICY_BT_MIN:
        return True
    return False


def read_copy_stash(path: Path = COPY_STASH_CSV) -> tuple[list[str], list[dict[str, str]]]:
    if not path.is_file():
        return STASH_FIELDS, []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or STASH_FIELDS)
        rows = [dict(row) for row in reader]
    return fieldnames, rows


def write_copy_stash(
    rows: list[dict[str, str]],
    path: Path = COPY_STASH_CSV,
    fieldnames: list[str] | None = None,
) -> None:
    fieldnames = fieldnames or STASH_FIELDS
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def append_copy_stash(
    eroterest_page: int,
    title: str,
    line1: str,
    line2: str,
    video_url: str,
    tags: str,
    path: Path = COPY_STASH_CSV,
) -> None:
    """文案確定時に stash へ保存（遅延OK 前でも可）。"""
    fieldnames, rows = read_copy_stash(path)
    page_str = str(eroterest_page)
    for row in rows:
        if row.get("eroterest_page", "").strip() == page_str:
            row.update(
                {
                    "title": title,
                    "line1": line1,
                    "line2": line2,
                    "video_url": video_url,
                    "tags": tags,
                }
            )
            write_copy_stash(rows, path, fieldnames)
            return
    rows.append(
        {
            "eroterest_page": page_str,
            "title": title,
            "line1": line1,
            "line2": line2,
            "video_url": video_url,
            "tags": tags,
        }
    )
    write_copy_stash(rows, path, fieldnames)


def stash_index(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    return {r["eroterest_page"].strip(): r for r in rows if r.get("eroterest_page", "").strip()}


def sync_mirror_from_stash(
    queue_path: Path = QUEUE_CSV,
    stash_path: Path = COPY_STASH_CSV,
    mirror_path: Path = MIRROR_CSV,
) -> list[str]:
    """遅延OK + page/93 以降 + stash あり → ミラー CSV へ追記。追加した page ID のリスト。"""
    queue_rows = read_queue_rows(queue_path)
    _, stash_rows = read_copy_stash(stash_path)
    fieldnames, mirror_rows = read_mirror_rows(mirror_path)
    idx = mirror_index(mirror_rows)
    stash = stash_index(stash_rows)
    added: list[str] = []

    for q in queue_ok_pages(queue_rows):
        if not mirror_policy_row(q, idx):
            continue
        page = q.get("eroterest_page", "").strip()
        if not page or page in idx:
            continue
        s = stash.get(page)
        if not s or not s.get("line1", "").strip():
            continue
        append_mirror_row(
            int(page),
            s.get("title", q.get("1回目タイトル", "")).strip(),
            s["line1"].strip(),
            s.get("line2", "").strip(),
            s["video_url"].strip(),
            s.get("tags", "").strip(),
            mirror_path,
        )
        idx[page] = {}
        added.append(page)
    return added


def import_stash_to_mirror(
    page: int | None = None,
    stash_path: Path = COPY_STASH_CSV,
    mirror_path: Path = MIRROR_CSV,
) -> list[str]:
    """stash → ミラー CSV（遅延OK 不要・staging 用）。"""
    _, stash_rows = read_copy_stash(stash_path)
    _, mirror_rows = read_mirror_rows(mirror_path)
    idx = mirror_index(mirror_rows)
    added: list[str] = []

    for s in stash_rows:
        page_str = s.get("eroterest_page", "").strip()
        if not page_str or not s.get("line1", "").strip():
            continue
        if page is not None and int(page_str) != page:
            continue
        if page_str in idx and idx[page_str].get("wp_post_id", "").strip():
            continue
        append_mirror_row(
            int(page_str),
            s["title"].strip(),
            s["line1"].strip(),
            s.get("line2", "").strip(),
            s["video_url"].strip(),
            s.get("tags", "").strip(),
            mirror_path,
        )
        added.append(page_str)
    return added

#!/usr/bin/env python3
"""One-off: scan eroterest pages for WP candidates with direct video URLs."""
import csv
import re
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
BASE = Path(__file__).parent
BAD = re.compile(
    r"259luxu|長浜|宮島|深田|三上|河北|明日花|波多野|JULIA|小宵|本田|星宮|高橋|七咲|田野|"
    r"愛宝|柚木|涼美|つぼみ|MINAMO|浅田|楓花|由紀恵|一花|しょう子|南澤|あいか|水川|スミレ",
    re.I,
)
HOST = re.compile(r"(vjav|hclips|upornia|hdzog|txxx)\.com", re.I)


def used_pages() -> set[str]:
    u: set[str] = set()
    for name in ("pillar-c-wp-mirror.csv", "pillar-c-reflection-queue.csv"):
        for row in csv.DictReader((BASE / name).open()):
            p = row.get("eroterest_page", "").strip()
            if p:
                u.add(p)
    return u


def fetch(url: str, timeout: int = 6) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "ignore")


def resolve(src: str) -> str:
    if HOST.search(src):
        return src
    try:
        html = fetch(src, 8)
    except Exception:
        return ""
    m = re.search(
        r'https?://[^"\']*(?:vjav|hclips|upornia|hdzog|txxx)\.com[^"\']*', html, re.I
    )
    return m.group(0) if m else ""


def main() -> None:
    used = used_pages()
    results = []
    for pid in range(44709850, 44710150):
        ps = str(pid)
        if ps in used:
            continue
        try:
            html = fetch(f"https://movie.eroterest.net/page/{pid}/", 5)
        except Exception:
            continue
        if "clickCnt" not in html:
            continue
        cm = re.search(r'clickCnt">(\d+)click', html)
        click = int(cm.group(1)) if cm else 999
        if click > 22:
            continue
        sm = re.search(r'class="gotoBlog"><a href="([^"]+)"', html)
        if not sm:
            continue
        src = sm.group(1)
        tm = re.search(r"<title>([^<]+)", html)
        title = tm.group(1).replace(" - 動画エロタレスト", "") if tm else ""
        if BAD.search(title) or BAD.search(html[:8000]):
            continue
        direct = resolve(src)
        if not direct:
            continue
        mins = re.search(r"(\d+分)", html)
        results.append((pid, click, mins.group(1) if mins else "", title[:55], direct))
        if len(results) >= 8:
            break
    for r in results:
        print("|".join(str(x) for x in r))


if __name__ == "__main__":
    main()

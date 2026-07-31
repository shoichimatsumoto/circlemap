"""WordPress REST API 共通クライアント."""

from __future__ import annotations

import base64
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

CONFIG_ENV = Path(__file__).with_name("wp-config.env")


def load_env(path: Path = CONFIG_ENV) -> dict[str, str]:
    if not path.is_file():
        sys.exit(f"設定ファイルがありません: {path}\n  cp wp-config.example.env wp-config.env")
    env: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def wp_request(
    base_url: str,
    user: str,
    app_password: str,
    method: str,
    path: str,
    payload: dict | list | None = None,
) -> dict | list:
    url = f"{base_url.rstrip('/')}{path}"
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    token = f"{user}:{app_password}".encode("utf-8")
    req.add_header("Authorization", "Basic " + base64.b64encode(token).decode("ascii"))
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"WP API エラー {exc.code}: {detail[:800]}") from exc


def check_auth(base_url: str, user: str, app_password: str) -> dict:
    me = wp_request(base_url, user, app_password, "GET", "/wp-json/wp/v2/users/me?context=edit")
    if not isinstance(me, dict) or not me.get("id"):
        raise RuntimeError("ログイン応答にユーザー ID がありません。WP_USER を確認してください。")
    roles = me.get("roles") or []
    if roles and not any(r in roles for r in ("administrator", "editor", "author")):
        raise RuntimeError(f"権限不足（roles={roles}）")
    return me


def resolve_tag_ids(base_url: str, user: str, app_password: str, tags: list[str]) -> list[int]:
    ids: list[int] = []
    for name in tags:
        name = name.strip()
        if not name:
            continue
        q = urllib.parse.urlencode({"search": name, "per_page": 5})
        found = wp_request(base_url, user, app_password, "GET", f"/wp-json/wp/v2/tags?{q}")
        if not isinstance(found, list):
            continue
        exact = next((t for t in found if t.get("name") == name), None)
        if exact:
            ids.append(int(exact["id"]))
            continue
        created = wp_request(base_url, user, app_password, "POST", "/wp-json/wp/v2/tags", {"name": name})
        if isinstance(created, dict):
            ids.append(int(created["id"]))
    return ids


def get_client(config_path: Path = CONFIG_ENV) -> tuple[str, str, str]:
    cfg = load_env(config_path)
    base = cfg.get("WP_URL", "")
    user = cfg.get("WP_USER", "")
    app_password = cfg.get("WP_APP_PASSWORD", "")
    if not all([base, user, app_password]):
        sys.exit("wp-config.env に WP_URL / WP_USER / WP_APP_PASSWORD を設定してください")
    check_auth(base, user, app_password)
    return base, user, app_password

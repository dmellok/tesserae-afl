"""afl_round, current-round AFL fixtures.

Squiggle's ``q=games`` endpoint takes year + round. When ``round=0``
(default), we auto-detect: fetch the full season and pick the lowest
round number that still has at least one incomplete game. That gives
the natural roll-forward behaviour, once every Sunday game finishes
the widget bumps to next round on Monday morning.
"""

from __future__ import annotations

import contextlib
import datetime as _dt
import json
import time
from pathlib import Path
from typing import Any

from app.plugin_http import fetch_json

CACHE_TTL_S = 600
HTTP_TIMEOUT_S = 15
USER_AGENT = "tesserae-afl/0.1 (+https://github.com/dmellok/tesserae-afl)"
SQUIGGLE_BASE = "https://api.squiggle.com.au"


def _cached(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    if time.time() - path.stat().st_mtime >= CACHE_TTL_S:
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def _write_cache(path: Path, payload: dict[str, Any]) -> None:
    with contextlib.suppress(OSError):
        path.write_text(json.dumps(payload), encoding="utf-8")


def _resolve_year(raw: Any) -> int:
    try:
        year = int(raw or 0)
    except (TypeError, ValueError):
        year = 0
    if year < 2000 or year > 2100:
        return _dt.datetime.now().year
    return year


def _auto_round(games: list[dict[str, Any]]) -> int:
    incomplete = [g for g in games if not g.get("complete")]
    if incomplete:
        return min((g.get("round") or 99) for g in incomplete)
    return max((g.get("round") or 0) for g in games) if games else 1


def fetch(
    options: dict[str, Any], settings: dict[str, Any], *, ctx: dict[str, Any]
) -> dict[str, Any]:
    del settings
    year = _resolve_year(options.get("year"))
    try:
        round_req = int(options.get("round") or 0)
    except (TypeError, ValueError):
        round_req = 0

    data_dir = Path(ctx["data_dir"])
    data_dir.mkdir(parents=True, exist_ok=True)
    cache_path = data_dir / f"season_{year}.json"

    cached = _cached(cache_path)
    if cached is None:
        url = f"{SQUIGGLE_BASE}/?q=games;year={year}"
        try:
            payload = fetch_json(url, headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT_S)
        except Exception as err:
            return {"error": f"{type(err).__name__}: {err}"}
        cached = {"games": payload.get("games") or []}
        _write_cache(cache_path, cached)

    games = cached.get("games") or []
    round_n = round_req if round_req > 0 else _auto_round(games)

    in_round = [g for g in games if (g.get("round") or 0) == round_n]
    in_round.sort(key=lambda g: g.get("unixtime") or 0)

    shaped = [_shape_game(g) for g in in_round]

    return {
        "year": year,
        "round": round_n,
        "round_name": (in_round[0].get("roundname") if in_round else f"Round {round_n}"),
        "games": shaped,
        "now_ts": int(time.time()),
    }


def _shape_game(g: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": g.get("id"),
        "hteam": g.get("hteam"),
        "ateam": g.get("ateam"),
        "hteamid": g.get("hteamid"),
        "ateamid": g.get("ateamid"),
        "hscore": g.get("hscore"),
        "ascore": g.get("ascore"),
        "hgoals": g.get("hgoals"),
        "hbehinds": g.get("hbehinds"),
        "agoals": g.get("agoals"),
        "abehinds": g.get("abehinds"),
        "complete": int(g.get("complete") or 0),
        "venue": g.get("venue"),
        "unixtime": g.get("unixtime"),
        "winner": g.get("winner"),
        "is_grand_final": bool(g.get("is_grand_final")),
        "is_final": bool(g.get("is_final")),
    }

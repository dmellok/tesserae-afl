"""afl_last_game, your club's most recent completed AFL match.

Same fetch shape as afl_next_game: pull the season's games-by-team once
per 10 minutes, then pick the most recent ``complete: 100`` entry.
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

TEAM_IDS = {
    "Adelaide": 1,
    "Brisbane Lions": 2,
    "Carlton": 3,
    "Collingwood": 4,
    "Essendon": 5,
    "Fremantle": 6,
    "Geelong": 7,
    "Gold Coast": 8,
    "Greater Western Sydney": 9,
    "Hawthorn": 10,
    "Melbourne": 11,
    "North Melbourne": 12,
    "Port Adelaide": 13,
    "Richmond": 14,
    "St Kilda": 15,
    "Sydney": 16,
    "West Coast": 17,
    "Western Bulldogs": 18,
}


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


def fetch(
    options: dict[str, Any], settings: dict[str, Any], *, ctx: dict[str, Any]
) -> dict[str, Any]:
    del settings
    team = str(options.get("team") or "Geelong").strip()
    team_id = TEAM_IDS.get(team)
    if team_id is None:
        return {"error": f"Unknown team: {team}"}

    year = _dt.datetime.now().year
    data_dir = Path(ctx["data_dir"])
    data_dir.mkdir(parents=True, exist_ok=True)
    cache_path = data_dir / f"team_{team_id}_{year}.json"

    cached = _cached(cache_path)
    if cached is None:
        url = f"{SQUIGGLE_BASE}/?q=games;year={year};team={team_id}"
        try:
            payload = fetch_json(url, headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT_S)
        except Exception as err:
            return {"error": f"{type(err).__name__}: {err}"}
        cached = {"games": payload.get("games") or []}
        _write_cache(cache_path, cached)

    games = cached.get("games") or []
    complete = [g for g in games if g.get("complete") and (g.get("unixtime") or 0) > 0]
    complete.sort(key=lambda g: g.get("unixtime") or 0, reverse=True)
    last = complete[0] if complete else None

    return {
        "team": team,
        "team_id": team_id,
        "now_ts": int(time.time()),
        "last": _shape_game(last) if last else None,
    }


def _shape_game(g: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": g.get("id"),
        "round": g.get("round"),
        "round_name": g.get("roundname") or (f"Round {g['round']}" if g.get("round") else ""),
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
        "venue": g.get("venue"),
        "unixtime": g.get("unixtime"),
        "winner": g.get("winner"),
        "is_final": bool(g.get("is_final")),
        "is_grand_final": bool(g.get("is_grand_final")),
    }

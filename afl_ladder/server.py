"""afl_ladder, current AFL home-and-away standings.

Squiggle (https://api.squiggle.com.au) exposes a live ``q=standings``
endpoint with the official ladder: rank, wins, losses, draws,
percentage, points. We pull it once per ``(year)`` and cache to disk
for 10 minutes so several cells viewing the same season share a single
upstream call.

Squiggle bans the default ``curl``/``python-urllib`` User-Agent strings.
We send a properly-identifying UA naming the widget and a contact URL,
per their published guidance.
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


def fetch(
    options: dict[str, Any], settings: dict[str, Any], *, ctx: dict[str, Any]
) -> dict[str, Any]:
    del settings
    year = _resolve_year(options.get("year"))

    data_dir = Path(ctx["data_dir"])
    data_dir.mkdir(parents=True, exist_ok=True)
    cache_path = data_dir / f"standings_{year}.json"

    cached = _cached(cache_path)
    if cached is not None:
        return cached

    url = f"{SQUIGGLE_BASE}/?q=standings;year={year}"
    try:
        payload = fetch_json(url, headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT_S)
    except Exception as err:
        return {"error": f"{type(err).__name__}: {err}"}

    standings = payload.get("standings") or []
    teams = []
    for row in standings:
        try:
            rank = int(row.get("rank") or 0)
        except (TypeError, ValueError):
            rank = 0
        try:
            wins = int(row.get("wins") or 0)
            losses = int(row.get("losses") or 0)
            draws = int(row.get("draws") or 0)
            played = int(row.get("played") or 0)
            pts = int(row.get("pts") or 0)
        except (TypeError, ValueError):
            wins = losses = draws = played = pts = 0
        try:
            percentage = float(row.get("percentage") or 0.0)
        except (TypeError, ValueError):
            percentage = 0.0
        name = str(row.get("name") or "").strip()
        if not name:
            continue
        teams.append(
            {
                "rank": rank,
                "name": name,
                "abbrev": _ABBREVS.get(name, name[:3].upper()),
                "wins": wins,
                "losses": losses,
                "draws": draws,
                "played": played,
                "points": pts,
                "percentage": round(percentage, 1),
            }
        )

    teams.sort(key=lambda t: t["rank"] or 999)
    result: dict[str, Any] = {
        "year": year,
        "teams": teams,
        "updated_at": int(time.time()),
    }
    if not teams:
        result["error"] = "Squiggle returned no standings for that season."
    _write_cache(cache_path, result)
    return result


_ABBREVS = {
    "Adelaide": "ADE",
    "Brisbane Lions": "BRL",
    "Carlton": "CAR",
    "Collingwood": "COL",
    "Essendon": "ESS",
    "Fremantle": "FRE",
    "Geelong": "GEE",
    "Gold Coast": "GCS",
    "Greater Western Sydney": "GWS",
    "Hawthorn": "HAW",
    "Melbourne": "MEL",
    "North Melbourne": "NTH",
    "Port Adelaide": "PTA",
    "Richmond": "RIC",
    "St Kilda": "STK",
    "Sydney": "SYD",
    "West Coast": "WCE",
    "Western Bulldogs": "WBD",
}

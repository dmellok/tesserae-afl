"""afl_next_game smoke: composer renders the next-match cell across sizes
with the Squiggle games-by-team payload threaded through ctx.data."""

from __future__ import annotations

import json
import time
from unittest.mock import patch

import pytest
from flask.testing import FlaskClient

_FUTURE_TS = int(time.time()) + 86400 * 2
_PAST_TS = int(time.time()) - 86400 * 7
_FAKE_PAYLOAD = json.dumps(
    {
        "games": [
            {
                "id": 1,
                "complete": 100,
                "winner": "Geelong",
                "winnerteamid": 7,
                "hteam": "Geelong",
                "hteamid": 7,
                "ateam": "Gold Coast",
                "ateamid": 8,
                "hscore": 105,
                "ascore": 60,
                "round": 14,
                "roundname": "Round 14",
                "venue": "Kardinia Park",
                "unixtime": _PAST_TS,
                "is_final": 0,
                "is_grand_final": 0,
            },
            {
                "id": 2,
                "complete": 0,
                "hteam": "Fremantle",
                "hteamid": 6,
                "ateam": "Geelong",
                "ateamid": 7,
                "round": 15,
                "roundname": "Round 15",
                "venue": "Perth Stadium",
                "unixtime": _FUTURE_TS,
                "is_final": 0,
                "is_grand_final": 0,
            },
        ]
    }
).encode()


class _FakeResp:
    def read(self) -> bytes:
        return _FAKE_PAYLOAD

    def __enter__(self):
        return self

    def __exit__(self, *a) -> bool:
        return False


@pytest.mark.parametrize("size", ["sm", "md", "lg"])
def test_afl_next_game_renders(client: FlaskClient, size: str) -> None:
    with patch("urllib.request.urlopen", return_value=_FakeResp()):
        resp = client.get(f"/_test/render?plugin=afl_next_game&size={size}")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert 'data-plugin="afl_next_game"' in body
    assert "Fremantle" in body
    assert "Perth Stadium" in body

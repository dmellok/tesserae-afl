"""afl_round smoke: composer renders the round-fixtures cell across sizes."""

from __future__ import annotations

import json
import time
from unittest.mock import patch

import pytest
from flask.testing import FlaskClient

_NOW = int(time.time())
_FAKE_PAYLOAD = json.dumps(
    {
        "games": [
            {
                "id": 1,
                "complete": 100,
                "winner": "Geelong",
                "hteam": "Geelong",
                "ateam": "Gold Coast",
                "hteamid": 7,
                "ateamid": 8,
                "hscore": 105,
                "ascore": 60,
                "round": 14,
                "roundname": "Round 14",
                "venue": "Kardinia Park",
                "unixtime": _NOW - 86400 * 7,
                "is_final": 0,
                "is_grand_final": 0,
            },
            {
                "id": 2,
                "complete": 0,
                "hteam": "Fremantle",
                "ateam": "Geelong",
                "hteamid": 6,
                "ateamid": 7,
                "round": 15,
                "roundname": "Round 15",
                "venue": "Perth Stadium",
                "unixtime": _NOW + 86400,
                "is_final": 0,
                "is_grand_final": 0,
            },
            {
                "id": 3,
                "complete": 0,
                "hteam": "Sydney",
                "ateam": "Melbourne",
                "hteamid": 16,
                "ateamid": 11,
                "round": 15,
                "roundname": "Round 15",
                "venue": "SCG",
                "unixtime": _NOW + 86400 * 2,
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
def test_afl_round_renders(client: FlaskClient, size: str) -> None:
    with patch("urllib.request.urlopen", return_value=_FakeResp()):
        resp = client.get(f"/_test/render?plugin=afl_round&size={size}")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert 'data-plugin="afl_round"' in body
    # Auto-round picks 15 (lowest incomplete); two games in that round.
    assert "Fremantle" in body
    assert "Sydney" in body

"""afl_ladder smoke: composer renders cells across every supported size
with the Squiggle standings payload threaded through ctx.data; no real
network call."""

from __future__ import annotations

import json
from unittest.mock import patch

import pytest
from flask.testing import FlaskClient

_FAKE_PAYLOAD = json.dumps(
    {
        "standings": [
            {
                "id": 6,
                "name": "Fremantle",
                "rank": 1,
                "wins": 12,
                "losses": 1,
                "draws": 0,
                "played": 13,
                "pts": 48,
                "percentage": 147.91,
                "goals_for": 192,
                "goals_against": 125,
            },
            {
                "id": 16,
                "name": "Sydney",
                "rank": 2,
                "wins": 12,
                "losses": 2,
                "draws": 0,
                "played": 14,
                "pts": 48,
                "percentage": 143.72,
            },
            {
                "id": 7,
                "name": "Geelong",
                "rank": 3,
                "wins": 9,
                "losses": 5,
                "draws": 0,
                "played": 14,
                "pts": 36,
                "percentage": 123.13,
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


@pytest.mark.parametrize("size", ["xs", "sm", "md", "lg"])
def test_afl_ladder_renders(client: FlaskClient, size: str) -> None:
    with patch("urllib.request.urlopen", return_value=_FakeResp()):
        resp = client.get(f"/_test/render?plugin=afl_ladder&size={size}")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert 'data-plugin="afl_ladder"' in body
    assert "Fremantle" in body
    assert "Sydney" in body

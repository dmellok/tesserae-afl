# tesserae-afl

AFL widgets for [Tesserae](https://github.com/dmellok/tesserae). Powered
by the public [Squiggle API](https://api.squiggle.com.au) (free, no key).

## Included

| Widget | Description |
|---|---|
| `afl_ladder` | Current home-and-away ladder: rank, club, wins, losses, percentage. Top 8 highlighted as the finals zone. |

More to come (round fixtures, finals bracket).

## Install

Tesserae users: install from **Settings → Widgets → Browse community
widgets** once this bundle is in the catalog. The widget appears as
"AFL, Ladder" with year + max-clubs + optional highlight-club options.

Manual install (dev):

```sh
git clone https://github.com/dmellok/tesserae-afl
ln -s "$(pwd)/tesserae-afl/afl_ladder" /path/to/tesserae/plugins/afl_ladder
```

## Data source

The Squiggle API requires an identifying User-Agent header; the widget
sends `tesserae-afl/<version> (+repo URL)`. Standings cache to disk for
10 minutes, so several cells viewing the same season share a single
upstream call.

## Licence

[AGPL-3.0-or-later](LICENSE), matching Tesserae itself.

// afl_round, Spectra fixtures-list archetype.
//
// One row per game: home guernsey, score (or kickoff time), away
// guernsey, venue. Complete games show the final scoreline with
// the winner in bold; upcoming games show kickoff time + venue.

import { guernseySvg, badgeSvg, teamAbbrev } from "../afl_core/static/guernsey.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtTime(unixSec) {
  if (!Number.isFinite(unixSec) || unixSec <= 0) return "";
  const d = new Date(unixSec * 1000);
  const wd = WEEKDAY[d.getDay()];
  const day = d.getDate();
  const mon = MONTH[d.getMonth()];
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${wd} ${day} ${mon} · ${h}:${mm} ${ampm}`;
}

export default function render(shadow, ctx) {
  const data = ctx?.data ?? {};
  const css = '<link rel="stylesheet" href="/static/style/spectra-widgets.css">';

  if (data.error) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_round">
        <div class="w-title"><i class="ph-bold ph-warning-circle"></i><h3>AFL Fixtures</h3></div>
        <div class="w-body"><p class="u-muted">${escapeHtml(data.error)}</p></div>
      </div>`;
    return;
  }

  const games = Array.isArray(data.games) ? data.games : [];
  const subtitle = data.round_name || (data.round ? `Round ${data.round}` : "");
  const options = ctx?.cell?.options ?? {};
  const drawClub = String(options.club_icon || "guernsey") === "badge" ? badgeSvg : guernseySvg;

  if (games.length === 0) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_round">
        <div class="w-title">
          <i class="ph-bold ph-list-checks" style="color:var(--accent-2)"></i>
          <h3>AFL Fixtures</h3>
          <span class="w-title-meta">${escapeHtml(subtitle)}</span>
        </div>
        <div class="w-body"><p class="u-muted">No fixtures scheduled.</p></div>
      </div>`;
    return;
  }

  const rows = games.map((g) => {
    const complete = g.complete >= 100;
    const hWon = complete && g.winner === g.hteam;
    const aWon = complete && g.winner === g.ateam;
    const middle = complete
      ? `<span class="afr-score"><strong class="${hWon ? "is-winner" : ""}">${escapeHtml(String(g.hscore ?? 0))}</strong>
         <span class="afr-dash">-</span>
         <strong class="${aWon ? "is-winner" : ""}">${escapeHtml(String(g.ascore ?? 0))}</strong></span>`
      : `<span class="afr-time">${escapeHtml(fmtTime(g.unixtime))}</span>`;
    const meta = complete
      ? `<span class="afr-venue">${escapeHtml(g.venue || "")}</span>`
      : `<span class="afr-venue">${escapeHtml(g.venue || "")}</span>`;
    return `
      <div class="afr-row">
        <span class="afr-side afr-side-home${hWon ? " is-winner" : ""}">
          <span class="afr-name">${escapeHtml(teamAbbrev(g.hteam))}</span>
          <span class="afr-guernsey">${drawClub(g.hteam)}</span>
        </span>
        <span class="afr-middle">${middle}</span>
        <span class="afr-side afr-side-away${aWon ? " is-winner" : ""}">
          <span class="afr-guernsey">${drawClub(g.ateam)}</span>
          <span class="afr-name">${escapeHtml(teamAbbrev(g.ateam))}</span>
        </span>
        <span class="afr-meta">${meta}</span>
      </div>`;
  }).join("");

  const layout = `
    .w-body { container-type: inline-size; }
    .afr-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    /* Default (sm/md): single-line layout, venue hidden. The lg @container
       block below opens up a second grid row for the venue line so the
       extra real-estate isn't wasted. */
    .afr-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      column-gap: var(--space-2);
      padding: 3px var(--space-2);
      border-radius: var(--radius-1);
      border-top: 1px solid color-mix(in oklab, var(--text-muted) 16%, transparent);
    }
    .afr-row:first-child { border-top: 0; }
    .afr-side {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: var(--fw-bold);
      font-variant-numeric: tabular-nums;
      min-width: 0;
    }
    .afr-side-home { justify-content: flex-end; }
    .afr-side-away { justify-content: flex-start; }
    .afr-name {
      font-size: var(--fs-h5);
      letter-spacing: var(--ls-label);
    }
    .afr-side:not(.is-winner) .afr-name {
      color: var(--text-secondary);
    }
    .afr-guernsey {
      display: inline-flex;
      flex: 0 0 auto;
      width: 20px;
      height: 24px;
    }
    .afr-guernsey svg { width: 100%; height: 100%; display: block; }
    .afr-middle {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 4.5em;
      font-variant-numeric: tabular-nums;
    }
    .afr-score {
      font-weight: var(--fw-bold);
      font-size: var(--fs-h5);
      display: inline-flex;
      align-items: baseline;
      gap: 3px;
    }
    .afr-score .is-winner { color: var(--accent-1); }
    .afr-score strong:not(.is-winner) { color: var(--text-muted); font-weight: var(--fw-bold); }
    .afr-dash { color: var(--text-muted); }
    .afr-time {
      font-weight: var(--fw-bold);
      font-size: var(--fs-meta);
      letter-spacing: var(--ls-label);
      color: var(--text-secondary);
      white-space: nowrap;
    }
    .afr-meta { display: none; }

    /* sm (~380px) and below: shrink everything one more notch. */
    @container (max-width: 420px) {
      .afr-row { padding: 2px var(--space-2); }
      .afr-guernsey { width: 16px; height: 20px; }
      .afr-name { font-size: var(--fs-meta); }
      .afr-score { font-size: var(--fs-meta); }
      .afr-middle { min-width: 4em; }
      .afr-side { gap: 4px; }
    }

    /* lg (>= 700px): two-row layout with the venue line beneath. */
    @container (min-width: 700px) {
      .afr-row {
        grid-template-rows: auto auto;
        grid-template-areas:
          "home middle away"
          "meta meta meta";
        row-gap: 1px;
        padding: 4px var(--space-2);
      }
      .afr-side-home { grid-area: home; }
      .afr-side-away { grid-area: away; }
      .afr-middle { grid-area: middle; }
      .afr-score { font-size: var(--fs-h4); }
      .afr-guernsey { width: 24px; height: 30px; }
      .afr-meta {
        display: block;
        grid-area: meta;
        text-align: center;
        font-size: var(--fs-caption);
        color: var(--text-muted);
      }
    }
  `;

  shadow.innerHTML = `
    ${css}
    <style>${layout}</style>
    <div class="w" data-widget="afl_round">
      <div class="w-title">
        <i class="ph-bold ph-list-checks" style="color:var(--accent-2)"></i>
        <h3>Fixtures</h3>
        <span class="w-title-meta">${escapeHtml(subtitle)}</span>
      </div>
      <div class="w-body">
        <div class="afr-list">${rows}</div>
      </div>
    </div>`;
}

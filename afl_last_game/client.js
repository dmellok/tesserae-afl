// afl_last_game, Spectra final-scoreline archetype.
//
// Single match recap: two guernseys, final score with the winner
// highlighted, venue, "N days ago" tag. Optional goals.behinds
// breakdown (e.g. "15.15") underneath the score for AFL-natives.

import { guernseySvg, badgeSvg, teamAbbrev } from "../afl_core/static/guernsey.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(unixSec) {
  if (!Number.isFinite(unixSec) || unixSec <= 0) return "";
  const d = new Date(unixSec * 1000);
  return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
}

function fmtAgo(unixSec, nowSec) {
  if (!Number.isFinite(unixSec) || unixSec <= 0) return "";
  const diffSec = nowSec - unixSec;
  if (diffSec < 3600) return "just now";
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "last week" : `${weeks} weeks ago`;
}

export default function render(shadow, ctx) {
  const data = ctx?.data ?? {};
  const css = '<link rel="stylesheet" href="/static/style/spectra-widgets.css">';
  const options = ctx?.cell?.options ?? {};
  const showBreakdown = options.show_breakdown !== false;
  const drawClub = String(options.club_icon || "guernsey") === "badge" ? badgeSvg : guernseySvg;

  if (data.error) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_last_game">
        <div class="w-title"><i class="ph-bold ph-warning-circle"></i><h3>AFL · Last match</h3></div>
        <div class="w-body"><p class="u-muted">${escapeHtml(data.error)}</p></div>
      </div>`;
    return;
  }

  const team = String(data.team || "");
  const game = data.last || null;

  if (!game) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_last_game">
        <div class="w-title">
          <i class="ph-bold ph-flag-checkered" style="color:var(--accent-2)"></i>
          <h3>AFL · Last match</h3>
          <span class="w-title-meta">${escapeHtml(team)}</span>
        </div>
        <div class="w-body"><p class="u-muted">No completed match yet this season.</p></div>
      </div>`;
    return;
  }

  const home = game.hteam || "";
  const away = game.ateam || "";
  const hWon = game.winner === home;
  const aWon = game.winner === away;
  const yourWon = game.winner === team;
  const drew = !game.winner;
  const margin = Math.abs((game.hscore ?? 0) - (game.ascore ?? 0));

  const subtitle = game.is_grand_final
    ? "Grand Final"
    : game.is_final
    ? game.round_name || "Final"
    : game.round_name || "";

  const verdict = drew
    ? "Drew"
    : yourWon
    ? `Won by ${margin}`
    : `Lost by ${margin}`;
  const verdictTone = drew
    ? "var(--accent-5)"
    : yourWon
    ? "var(--accent-1)"
    : "var(--text-muted)";

  const breakdown = showBreakdown
    ? `<div class="alg-breakdown">
        <span class="alg-bd-side${hWon ? " is-winner" : ""}">${escapeHtml(String(game.hgoals ?? 0))}.${escapeHtml(String(game.hbehinds ?? 0))}</span>
        <span class="alg-bd-sep"></span>
        <span class="alg-bd-side${aWon ? " is-winner" : ""}">${escapeHtml(String(game.agoals ?? 0))}.${escapeHtml(String(game.abehinds ?? 0))}</span>
      </div>`
    : "";

  const layout = `
    .w-body { container-type: inline-size; }
    .alg-verdict {
      text-align: center;
      font-weight: var(--fw-black);
      font-size: var(--fs-h5);
      letter-spacing: var(--ls-label);
      text-transform: uppercase;
      padding: 2px var(--space-2);
      color: ${verdictTone};
    }
    .alg-stage {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) 0;
    }
    .alg-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }
    .alg-guernsey {
      width: 68px;
      height: 82px;
    }
    .alg-guernsey svg { width: 100%; height: 100%; display: block; }
    .alg-side-name {
      font-weight: var(--fw-bold);
      font-size: var(--fs-h5);
      text-align: center;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .alg-side:not(.is-winner) .alg-score {
      color: var(--text-muted);
    }
    .alg-side.is-winner .alg-score {
      color: var(--accent-1);
    }
    .alg-score {
      font-weight: var(--fw-black);
      font-size: var(--fs-display);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .alg-vs {
      font-weight: var(--fw-black);
      font-size: var(--fs-h4);
      color: var(--text-muted);
      letter-spacing: 0.06em;
    }
    .alg-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding-top: var(--space-2);
      border-top: 1px solid color-mix(in oklab, var(--text-muted) 25%, transparent);
    }
    .alg-when {
      font-weight: var(--fw-bold);
      font-size: var(--fs-h5);
    }
    .alg-venue {
      font-size: var(--fs-meta);
      color: var(--text-secondary);
    }
    .alg-ago {
      font-size: var(--fs-meta);
      font-weight: var(--fw-bold);
      letter-spacing: var(--ls-label);
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .alg-breakdown {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding-top: 4px;
      font-size: var(--fs-meta);
      font-variant-numeric: tabular-nums;
      color: var(--text-secondary);
    }
    .alg-bd-side.is-winner { color: var(--text-primary); font-weight: var(--fw-bold); }
    .alg-bd-sep {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--text-muted);
    }

    @container (max-width: 320px) {
      .alg-guernsey { width: 48px; height: 58px; }
      .alg-side-name { font-size: var(--fs-meta); }
      .alg-score { font-size: var(--fs-h2); }
      .alg-venue { display: none; }
      .alg-breakdown { display: none; }
    }
    @container (min-width: 321px) and (max-width: 460px) {
      .alg-guernsey { width: 56px; height: 68px; }
      .alg-breakdown { display: none; }
    }
  `;

  shadow.innerHTML = `
    ${css}
    <style>${layout}</style>
    <div class="w" data-widget="afl_last_game">
      <div class="w-title">
        <i class="ph-bold ph-flag-checkered" style="color:var(--accent-2)"></i>
        <h3>Last match</h3>
        <span class="w-title-meta">${escapeHtml(subtitle)}</span>
      </div>
      <div class="w-body">
        <div class="alg-verdict">${escapeHtml(verdict)}</div>
        <div class="alg-stage">
          <div class="alg-side${hWon ? " is-winner" : ""}" data-pos="home">
            <span class="alg-guernsey">${drawClub(home)}</span>
            <span class="alg-side-name">${escapeHtml(teamAbbrev(home))}</span>
            <span class="alg-score">${escapeHtml(String(game.hscore ?? 0))}</span>
          </div>
          <div class="alg-vs">–</div>
          <div class="alg-side${aWon ? " is-winner" : ""}" data-pos="away">
            <span class="alg-guernsey">${drawClub(away)}</span>
            <span class="alg-side-name">${escapeHtml(teamAbbrev(away))}</span>
            <span class="alg-score">${escapeHtml(String(game.ascore ?? 0))}</span>
          </div>
        </div>
        ${breakdown}
        <div class="alg-meta">
          <span class="alg-when">${escapeHtml(fmtDate(game.unixtime))}</span>
          <span class="alg-venue">${escapeHtml(game.venue || "")}</span>
          <span class="alg-ago">${escapeHtml(fmtAgo(game.unixtime, data.now_ts))}</span>
        </div>
      </div>
    </div>`;
}

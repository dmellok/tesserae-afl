// afl_ladder, Spectra list archetype.
//
// One row per club: a bold accent rank tile (top 8 sit in the finals
// zone and get the accent palette; 9-18 fade to muted text), then
// club name + record (W-L-D), points, percentage. Optional highlight
// club gets a tinted background so a Cats fan can spot Geelong in
// one glance.
//
// Team palette + guernsey art live in afl_core so every afl_* widget
// in the bundle pulls from one source.

import { guernseySvg, badgeSvg, teamPrimary } from "../afl_core/static/guernsey.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function fmtPct(p) {
  if (!Number.isFinite(p)) return "-";
  return p.toFixed(1);
}

function rankAccent(rank) {
  if (rank >= 1 && rank <= 4) return "var(--accent-1)";
  if (rank >= 5 && rank <= 8) return "var(--accent-2)";
  return "var(--text-muted)";
}


export default function render(shadow, ctx) {
  const data = ctx?.data ?? {};
  const css = '<link rel="stylesheet" href="/static/style/spectra-widgets.css">';

  if (data.error) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_ladder">
        <div class="w-title"><i class="ph-bold ph-warning-circle"></i><h3>AFL Ladder</h3></div>
        <div class="w-body"><p class="u-muted">${escapeHtml(data.error)}</p></div>
      </div>`;
    return;
  }

  const teams = Array.isArray(data.teams) ? data.teams : [];
  const year = Number.isFinite(data.year) ? data.year : "";

  if (teams.length === 0) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_ladder">
        <div class="w-title">
          <i class="ph-bold ph-trophy" style="color:var(--accent-2)"></i>
          <h3>AFL Ladder</h3>
          <span class="w-title-meta">${escapeHtml(String(year))}</span>
        </div>
        <div class="w-body"><p class="u-muted">No standings yet.</p></div>
      </div>`;
    return;
  }

  const options = ctx?.cell?.options ?? {};
  const highlight = String(options.highlight_team || "").trim();
  const rowIcon = String(options.row_icon || "guernsey");
  let maxTeams = Number(options.max_teams) || 8;
  if (maxTeams < 1) maxTeams = 1;
  if (maxTeams > 18) maxTeams = 18;
  const visible = teams.slice(0, maxTeams);

  const rows = visible.map((t) => {
    const rank = Number(t.rank) || 0;
    const accent = rankAccent(rank);
    const isHi = highlight && t.name === highlight;
    const record = `${t.wins ?? 0}-${t.losses ?? 0}-${t.draws ?? 0}`;
    let icon = "";
    if (rowIcon === "guernsey") {
      icon = `<span class="afl-icon afl-icon-guernsey">${guernseySvg(t.name)}</span>`;
    } else if (rowIcon === "badge") {
      icon = `<span class="afl-icon afl-icon-badge">${badgeSvg(t.name)}</span>`;
    } else if (rowIcon === "dot") {
      icon = `<span class="afl-icon afl-icon-dot" style="background:${teamPrimary(t.name)}"></span>`;
    }
    return `
      <div class="afl-row${isHi ? " is-hi" : ""}">
        <div class="afl-rank" style="background:${accent}">${escapeHtml(String(rank))}</div>
        ${icon}
        <div class="afl-club">
          <span class="afl-name">${escapeHtml(t.name)}</span>
          <span class="afl-abbrev">${escapeHtml(t.abbrev || "")}</span>
        </div>
        <div class="afl-stat afl-record">${escapeHtml(record)}</div>
        <div class="afl-stat afl-points">${escapeHtml(String(t.points ?? 0))}</div>
        <div class="afl-stat afl-pct">${escapeHtml(fmtPct(Number(t.percentage)))}</div>
      </div>`;
  }).join("");

  const headerIcon =
    rowIcon === "none" ? "" : `<span class="afl-icon afl-icon-head"></span>`;
  const header = `
    <div class="afl-row afl-row-head">
      <div class="afl-rank afl-rank-head">#</div>
      ${headerIcon}
      <div class="afl-club"><span class="afl-name">Club</span><span class="afl-abbrev">CLUB</span></div>
      <div class="afl-stat afl-record">W-L-D</div>
      <div class="afl-stat afl-points">PTS</div>
      <div class="afl-stat afl-pct">%</div>
    </div>`;

  const layout = `
    .w-body { container-type: inline-size; }
    /* Parent owns the column tracks so stat columns line up across rows
       (subgrid below). With/without icon column toggles at this level
       since every row shares the same icon mode for a given render. */
    .afl-list {
      display: grid;
      grid-template-columns: auto auto 1fr auto auto auto;
      row-gap: 2px;
    }
    .afl-list:not(:has(.afl-icon)) {
      grid-template-columns: auto 1fr auto auto auto;
    }
    .afl-row {
      display: grid;
      grid-template-columns: subgrid;
      grid-column: 1 / -1;
      align-items: center;
      column-gap: var(--space-3);
      padding: 4px var(--space-2);
      border-radius: var(--radius-1);
      font-variant-numeric: tabular-nums;
    }
    .afl-row-head {
      font-size: var(--fs-caption);
      letter-spacing: var(--ls-label);
      text-transform: uppercase;
      color: var(--text-muted);
      padding-top: 0;
      padding-bottom: 6px;
      border-bottom: 1px solid color-mix(in oklab, var(--text-muted) 35%, transparent);
      margin-bottom: 4px;
    }
    .afl-row-head .afl-name {
      font-weight: var(--fw-black);
      color: var(--text-muted);
    }
    .afl-row-head .afl-abbrev { display: none; }
    .afl-row-head .afl-stat {
      color: var(--text-muted) !important;
      font-weight: var(--fw-black);
    }
    .afl-rank-head {
      background: transparent !important;
      color: var(--text-muted) !important;
    }
    .afl-icon-head {
      width: 18px;
      height: 22px;
    }
    .afl-list:has(.afl-icon-badge) .afl-icon-head {
      width: 20px;
      height: 20px;
    }
    .afl-list:has(.afl-icon-dot) .afl-icon-head {
      width: 12px;
      height: 12px;
    }
    .afl-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }
    .afl-icon-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .afl-icon-guernsey {
      width: 18px;
      height: 22px;
    }
    .afl-icon-badge {
      width: 20px;
      height: 20px;
    }
    .afl-guernsey, .afl-badge {
      width: 100%;
      height: 100%;
      display: block;
    }
    .afl-row.is-hi {
      background: color-mix(in oklab, var(--accent-2) 18%, transparent);
    }
    .afl-rank {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2ch;
      padding: 2px var(--space-1);
      border-radius: var(--radius-1);
      color: var(--surface);
      font-weight: var(--fw-black);
      font-size: var(--fs-meta);
      letter-spacing: var(--ls-label);
    }
    .afl-club {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      min-width: 0;
      overflow: hidden;
    }
    .afl-name {
      font-weight: var(--fw-bold);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .afl-abbrev {
      font-size: var(--fs-caption);
      font-weight: var(--fw-black);
      letter-spacing: var(--ls-label);
      color: var(--text-muted);
    }
    .afl-stat {
      font-weight: var(--fw-bold);
      text-align: right;
      white-space: nowrap;
    }
    .afl-pct { color: var(--text-secondary); }
    .afl-points { color: var(--accent-5); }

    /* Size tiers drop columns from the parent grid; rows inherit via subgrid. */
    @container (max-width: 280px) {
      .afl-list { grid-template-columns: auto auto 1fr auto; column-gap: var(--space-1); }
      .afl-list:not(:has(.afl-icon)) { grid-template-columns: auto 1fr auto; }
      .afl-name, .afl-pct, .afl-points { display: none; }
    }
    @container (min-width: 281px) and (max-width: 460px) {
      .afl-list { grid-template-columns: auto auto 1fr auto auto; }
      .afl-list:not(:has(.afl-icon)) { grid-template-columns: auto 1fr auto auto; }
      .afl-points { display: none; }
      .afl-abbrev { display: none; }
    }
    @container (min-width: 461px) {
      .afl-abbrev { display: none; }
    }
  `;

  shadow.innerHTML = `
    ${css}
    <style>${layout}</style>
    <div class="w" data-widget="afl_ladder">
      <div class="w-title">
        <i class="ph-bold ph-trophy" style="color:var(--accent-2)"></i>
        <h3>AFL Ladder</h3>
        <span class="w-title-meta">${escapeHtml(String(year))}</span>
      </div>
      <div class="w-body">
        <div class="afl-list">${header}${rows}</div>
      </div>
    </div>`;
}

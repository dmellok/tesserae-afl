// afl_ladder, Spectra list archetype.
//
// One row per club: a bold accent rank tile (top 8 sit in the finals
// zone and get the accent palette; 9-18 fade to muted text), then
// club name + record (W-L-D), points, percentage. Optional highlight
// club gets a tinted background so a Cats fan can spot Geelong in
// one glance.
//
// Size tiers via container queries on .w-body:
//   narrow  rank + abbrev + W-L only.
//   medium  rank + name + W-L-D + percentage.
//   wide    rank + name + W-L-D + points + percentage.

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

  const options = ctx?.options ?? {};
  const highlight = String(options.highlight_team || "").trim();
  let maxTeams = Number(options.max_teams) || 8;
  if (maxTeams < 1) maxTeams = 1;
  if (maxTeams > 18) maxTeams = 18;
  const visible = teams.slice(0, maxTeams);

  const rows = visible.map((t) => {
    const rank = Number(t.rank) || 0;
    const accent = rankAccent(rank);
    const isHi = highlight && t.name === highlight;
    const recordParts = [t.wins ?? 0, t.losses ?? 0];
    if ((t.draws ?? 0) > 0) recordParts.push(t.draws);
    const record = recordParts.join("-");
    return `
      <div class="afl-row${isHi ? " is-hi" : ""}">
        <div class="afl-rank" style="background:${accent}">${escapeHtml(String(rank))}</div>
        <div class="afl-club">
          <span class="afl-name">${escapeHtml(t.name)}</span>
          <span class="afl-abbrev">${escapeHtml(t.abbrev || "")}</span>
        </div>
        <div class="afl-stat afl-record">${escapeHtml(record)}</div>
        <div class="afl-stat afl-points">${escapeHtml(String(t.points ?? 0))}</div>
        <div class="afl-stat afl-pct">${escapeHtml(fmtPct(Number(t.percentage)))}</div>
      </div>`;
  }).join("");

  const layout = `
    .w-body { container-type: inline-size; }
    .afl-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .afl-row {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: var(--space-2);
      padding: 4px var(--space-2);
      border-radius: var(--radius-1);
      font-variant-numeric: tabular-nums;
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
    }
    .afl-pct { color: var(--text-secondary); }
    .afl-points { color: var(--accent-5); }

    @container (max-width: 280px) {
      .afl-row { grid-template-columns: auto auto 1fr auto; gap: var(--space-1); }
      .afl-name, .afl-pct, .afl-points { display: none; }
    }
    @container (min-width: 281px) and (max-width: 460px) {
      .afl-row { grid-template-columns: auto 1fr auto auto; }
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
        <div class="afl-list">${rows}</div>
      </div>
    </div>`;
}

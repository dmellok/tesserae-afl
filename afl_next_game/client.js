// afl_next_game, Spectra hero-duel archetype.
//
// Two big guernseys facing off across a VS divider, with kickoff
// date/time, venue, and an optional countdown line. A 5-cell strip
// at the bottom shows the chosen team's last-five form.
//
// Size tiers via container queries on .w-body:
//   sm  small guernseys, abbrev + time only.
//   md  full-name guernseys, time + venue + countdown.
//   lg  +form strip at the bottom.

import { guernseySvg, badgeSvg, teamAbbrev } from "../afl_core/static/guernsey.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtKickoff(unixSec) {
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

function fmtCountdown(unixSec, nowSec) {
  if (!Number.isFinite(unixSec) || unixSec <= 0) return "";
  const diffSec = unixSec - nowSec;
  if (diffSec <= 0) return "Now";
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  if (days >= 2) return `in ${days} days`;
  if (days === 1) return hours > 0 ? `in 1 day ${hours}h` : "tomorrow";
  if (hours >= 2) return `in ${hours} hours`;
  if (hours === 1) return "in 1 hour";
  const mins = Math.max(1, Math.floor(diffSec / 60));
  return `in ${mins} min`;
}

function isHome(team, game) {
  return team === game.hteam;
}

export default function render(shadow, ctx) {
  const data = ctx?.data ?? {};
  const css = '<link rel="stylesheet" href="/static/style/spectra-widgets.css">';
  const options = ctx?.cell?.options ?? {};
  const showForm = options.show_form !== false;
  const showCountdown = options.show_countdown !== false;
  const clubIcon = String(options.club_icon || "guernsey");
  const drawClub = clubIcon === "badge" ? badgeSvg : guernseySvg;

  if (data.error) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_next_game">
        <div class="w-title"><i class="ph-bold ph-warning-circle"></i><h3>AFL · Next match</h3></div>
        <div class="w-body"><p class="u-muted">${escapeHtml(data.error)}</p></div>
      </div>`;
    return;
  }

  const team = String(data.team || "");
  const game = data.next || null;

  if (!game) {
    shadow.innerHTML = `
      ${css}
      <div class="w" data-widget="afl_next_game">
        <div class="w-title">
          <i class="ph-bold ph-football" style="color:var(--accent-2)"></i>
          <h3>AFL · Next match</h3>
          <span class="w-title-meta">${escapeHtml(team)}</span>
        </div>
        <div class="w-body"><p class="u-muted">No upcoming fixtures.</p></div>
      </div>`;
    return;
  }

  const home = game.hteam || "";
  const away = game.ateam || "";
  const yourSide = isHome(team, game) ? "home" : "away";

  const subtitle = game.is_grand_final
    ? "Grand Final"
    : game.is_final
    ? game.round_name || "Final"
    : game.round_name || "";

  const kickoff = fmtKickoff(game.unixtime);
  const countdown = showCountdown ? fmtCountdown(game.unixtime, data.now_ts) : "";

  const form = Array.isArray(data.form) ? data.form : [];
  const formStrip = showForm && form.length
    ? `<div class="anx-form">
        <span class="anx-form-label">Form</span>
        <div class="anx-form-dots">
          ${form.map((f) => {
            const r = f.result || "-";
            const cls = r === "W" ? "is-w" : r === "L" ? "is-l" : "is-d";
            return `<span class="anx-form-dot ${cls}" title="${escapeHtml((f.opponent || "") + " R" + (f.round ?? ""))}">${escapeHtml(r)}</span>`;
          }).join("")}
        </div>
      </div>`
    : "";

  const layout = `
    .w-body { container-type: inline-size; }
    .anx-stage {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) 0 var(--space-3);
    }
    .anx-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }
    .anx-guernsey {
      width: 80px;
      height: 96px;
      display: block;
    }
    .anx-guernsey svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .anx-side.is-you .anx-guernsey {
      filter: drop-shadow(0 0 0 var(--accent-2));
    }
    .anx-side-name {
      font-weight: var(--fw-bold);
      font-size: var(--fs-h4);
      line-height: 1.1;
      text-align: center;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .anx-side-label {
      font-size: var(--fs-caption);
      font-weight: var(--fw-black);
      letter-spacing: var(--ls-label);
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .anx-vs {
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--fw-black);
      font-size: var(--fs-h3);
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .anx-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding-top: var(--space-2);
      border-top: 1px solid color-mix(in oklab, var(--text-muted) 25%, transparent);
    }
    .anx-kickoff {
      font-weight: var(--fw-bold);
      font-size: var(--fs-h5);
      font-variant-numeric: tabular-nums;
    }
    .anx-venue {
      font-size: var(--fs-meta);
      color: var(--text-secondary);
    }
    .anx-countdown {
      font-size: var(--fs-meta);
      font-weight: var(--fw-bold);
      letter-spacing: var(--ls-label);
      color: var(--accent-2);
      text-transform: uppercase;
    }
    .anx-form {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding-top: var(--space-2);
    }
    .anx-form-label {
      font-size: var(--fs-caption);
      font-weight: var(--fw-black);
      letter-spacing: var(--ls-label);
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .anx-form-dots {
      display: flex;
      gap: 4px;
    }
    .anx-form-dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: var(--radius-1);
      font-weight: var(--fw-black);
      font-size: var(--fs-meta);
      color: var(--surface);
    }
    .anx-form-dot.is-w { background: var(--accent-1); }
    .anx-form-dot.is-l { background: var(--text-muted); }
    .anx-form-dot.is-d { background: var(--accent-5); }

    @container (max-width: 320px) {
      .anx-guernsey { width: 56px; height: 68px; }
      .anx-side-name { font-size: var(--fs-h5); }
      .anx-vs { font-size: var(--fs-h4); }
      .anx-venue { display: none; }
      .anx-form { display: none; }
    }
    @container (min-width: 321px) and (max-width: 460px) {
      .anx-guernsey { width: 70px; height: 84px; }
      .anx-form { display: none; }
    }
  `;

  const clubArt = (name) =>
    `<span class="anx-guernsey">${drawClub(name)}</span>`;

  shadow.innerHTML = `
    ${css}
    <style>${layout}</style>
    <div class="w" data-widget="afl_next_game">
      <div class="w-title">
        <i class="ph-bold ph-football" style="color:var(--accent-2)"></i>
        <h3>Next match</h3>
        <span class="w-title-meta">${escapeHtml(subtitle)}</span>
      </div>
      <div class="w-body">
        <div class="anx-stage">
          <div class="anx-side${yourSide === "home" ? " is-you" : ""}" data-pos="home">
            ${clubArt(home)}
            <span class="anx-side-name">${escapeHtml(home)}</span>
            <span class="anx-side-label">${escapeHtml(teamAbbrev(home))} · Home</span>
          </div>
          <div class="anx-vs">VS</div>
          <div class="anx-side${yourSide === "away" ? " is-you" : ""}" data-pos="away">
            ${clubArt(away)}
            <span class="anx-side-name">${escapeHtml(away)}</span>
            <span class="anx-side-label">${escapeHtml(teamAbbrev(away))} · Away</span>
          </div>
        </div>
        <div class="anx-meta">
          <span class="anx-kickoff">${escapeHtml(kickoff)}</span>
          <span class="anx-venue">${escapeHtml(game.venue || "")}</span>
          ${countdown ? `<span class="anx-countdown">${escapeHtml(countdown)}</span>` : ""}
        </div>
        ${formStrip}
      </div>
    </div>`;
}

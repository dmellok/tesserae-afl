// Shared AFL team palette + guernsey SVG generator, imported by every
// afl_* widget so palette tweaks land in one place. Patterns are
// original art evoking each club's traditional guernsey rather than
// reproducing the trademarked design; after dither at panel
// resolution, silhouette + 2-3 colour blocks is what survives.

export const TEAM_GUERNSEY = {
  "Adelaide":               { pattern: "v_yoke",   colours: ["#002b5c", "#e21937", "#ffd200"] },
  "Brisbane Lions":         { pattern: "tri_band", colours: ["#7a0019", "#003087", "#ffd200"] },
  "Carlton":                { pattern: "solid",    colours: ["#031a40"] },
  "Collingwood":            { pattern: "stripes",  colours: ["#1a1a1a", "#ffffff"] },
  "Essendon":               { pattern: "sash",     colours: ["#1a1a1a", "#cc2031"] },
  "Fremantle":              { pattern: "solid",    colours: ["#2a0d54"] },
  "Geelong":                { pattern: "hoops",    colours: ["#0b3a72", "#ffffff"] },
  "Gold Coast":             { pattern: "solid",    colours: ["#d71920"] },
  "Greater Western Sydney": { pattern: "split_v",  colours: ["#f47920", "#4d5358"] },
  "Hawthorn":               { pattern: "stripes",  colours: ["#4d2004", "#ffd200"] },
  "Melbourne":              { pattern: "v_yoke",   colours: ["#0f1f51", "#cc2031"] },
  "North Melbourne":        { pattern: "stripes",  colours: ["#003c7e", "#ffffff"] },
  "Port Adelaide":          { pattern: "stripes",  colours: ["#008797", "#1a1a1a"] },
  "Richmond":               { pattern: "sash",     colours: ["#1a1a1a", "#ffd200"] },
  "St Kilda":               { pattern: "tri_band", colours: ["#ed1c24", "#1a1a1a", "#ffffff"] },
  "Sydney":                 { pattern: "v_yoke",   colours: ["#ed1c24", "#ffffff"] },
  "West Coast":             { pattern: "v_yoke",   colours: ["#003087", "#ffd200"] },
  "Western Bulldogs":       { pattern: "tri_band", colours: ["#003087", "#cc2031", "#ffffff"] },
};

export const TEAM_ABBREV = {
  "Adelaide": "ADE",               "Brisbane Lions": "BRL",
  "Carlton": "CAR",                "Collingwood": "COL",
  "Essendon": "ESS",               "Fremantle": "FRE",
  "Geelong": "GEE",                "Gold Coast": "GCS",
  "Greater Western Sydney": "GWS", "Hawthorn": "HAW",
  "Melbourne": "MEL",              "North Melbourne": "NTH",
  "Port Adelaide": "PTA",          "Richmond": "RIC",
  "St Kilda": "STK",               "Sydney": "SYD",
  "West Coast": "WCE",             "Western Bulldogs": "WBD",
};

// Singlet silhouette: shoulder caps with a V-neck cut.
const SILHOUETTE = "M 22 8 L 38 4 L 50 14 L 62 4 L 78 8 L 92 26 L 80 38 L 80 112 L 20 112 L 20 38 L 8 26 Z";

let _gcCounter = 0;

export function guernseySvg(name) {
  const def = TEAM_GUERNSEY[name];
  if (!def) {
    return `<svg viewBox="0 0 100 120" class="afl-guernsey" aria-hidden="true">
      <path d="${SILHOUETTE}" fill="var(--text-muted)" stroke="var(--text-secondary)" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;
  }
  const [c1, c2 = c1, c3 = c2] = def.colours;
  const clipId = `gc-${++_gcCounter}`;
  let inner = "";
  switch (def.pattern) {
    case "hoops":
      inner = [30, 52, 74, 96]
        .map((y) => `<rect x="0" y="${y}" width="100" height="11" fill="${c2}"/>`)
        .join("");
      break;
    case "stripes":
      inner = [16, 36, 56, 76]
        .map((x) => `<rect x="${x}" y="0" width="11" height="120" fill="${c2}"/>`)
        .join("");
      break;
    case "sash":
      inner = `<polygon points="55,0 80,0 25,120 0,120" fill="${c2}"/>`;
      break;
    case "v_yoke":
      inner = `<polygon points="0,0 100,0 100,28 50,52 0,28" fill="${c2}"/>`;
      break;
    case "tri_band":
      inner = `
        <rect x="0" y="40" width="100" height="36" fill="${c2}"/>
        <rect x="0" y="76" width="100" height="44" fill="${c3}"/>`;
      break;
    case "split_v":
      inner = `<rect x="50" y="0" width="50" height="120" fill="${c2}"/>`;
      break;
    case "solid":
    default:
      inner = "";
  }
  return `<svg viewBox="0 0 100 120" class="afl-guernsey" aria-hidden="true">
    <defs><clipPath id="${clipId}"><path d="${SILHOUETTE}"/></clipPath></defs>
    <g clip-path="url(#${clipId})">
      <rect x="0" y="0" width="100" height="120" fill="${c1}"/>
      ${inner}
    </g>
    <path d="${SILHOUETTE}" fill="none" stroke="var(--text-primary)" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
}

export function teamPrimary(name) {
  return TEAM_GUERNSEY[name]?.colours?.[0] || "var(--text-secondary)";
}

export function teamAbbrev(name) {
  return TEAM_ABBREV[name] || (name || "").slice(0, 3).toUpperCase();
}

// Perceived luminance: 0 = black, 1 = white. Used to flip badge text
// colour to dark when the primary background is light (orange, yellow).
function _isLight(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#") || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

// Circular club badge: primary-coloured disc with the 3-letter
// monogram. Trademark-safe stand-in for the club logo (the actual
// logos are AFL/club marks we can't redistribute).
export function badgeSvg(name) {
  const def = TEAM_GUERNSEY[name];
  const primary = def?.colours?.[0] || "#666666";
  const hasSecondary = def && def.colours.length > 1;
  const onLight = _isLight(primary);
  const text = onLight ? "#1a1a1a" : hasSecondary ? def.colours[1] : "#ffffff";
  const stroke = onLight ? "#1a1a1a" : "#ffffff";
  const abbrev = teamAbbrev(name);
  return `<svg viewBox="0 0 100 100" class="afl-badge" aria-hidden="true">
    <circle cx="50" cy="50" r="46" fill="${primary}" stroke="${stroke}" stroke-width="2" stroke-opacity="0.25"/>
    <text x="50" y="63" text-anchor="middle" fill="${text}" font-weight="900" font-size="34" letter-spacing="-1.5" font-family="'Archivo Black', 'Anton', 'Bebas Neue', system-ui, sans-serif">${abbrev}</text>
  </svg>`;
}

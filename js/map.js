/**
 * מפת סככות אינטראקטיבית (SVG) — נאמנה לסידור הפיזי בתרשים המקור.
 */
import {
  DAY_BY_ID,
  MAP_LAYOUT,
  MAP_TRAFFIC,
  MAP_VIEWBOX,
  PLATFORM_LABELS,
} from "./data.js";
import { linesAtPlatform } from "./engine.js";

const COLORS = {
  active: { fill: "#E8F1F7", stroke: "#7A96A8", text: "#073b68" },
  closed: { fill: "#EEF0F2", stroke: "#B0B8C0", text: "#5B6570" },
  alternate: { fill: "#1A6FA0", stroke: "#0B4A70", text: "#fff" },
  original: { fill: "#FFF0E0", stroke: "#EF842C", text: "#7A3E08" },
  dim: { fill: "#F7F9FB", stroke: "#D5DEE5", text: "#8A9AA8" },
  your: { fill: "#0B5F8A", stroke: "#EF842C", text: "#fff" },
};

function box(id) {
  const [x, y, w, h] = MAP_LAYOUT[id];
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
}

function roleFor(id, day, highlight) {
  const closed = day.closedPlatforms.includes(id);
  if (highlight) {
    if (highlight.to === id) return "your";
    if (highlight.changed && highlight.from === id) return "original";
  }
  if (closed) return "closed";
  if (highlight && highlight.to != null) return "dim";
  if (day.alternatePlatforms.includes(id)) return "alternate";
  return "active";
}

/**
 * @param {object} opts
 * @param {string} opts.dayId
 * @param {object|null} opts.highlight { from, to, changed }
 * @param {function} opts.onSelectPlatform (id) => void
 */
export function buildPlatformMap({ dayId, highlight = null, onSelectPlatform = null }) {
  const day = DAY_BY_ID[dayId];
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`);
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "מפת הסככות בתחנה המרכזית");
  svg.classList.add("platform-map-svg");
  svg.style.fontFamily = 'Assistant, "Arial Hebrew", Arial, sans-serif';

  const add = (name, attrs, text) => {
    const el = document.createElementNS(svgNS, name);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    if (text != null) el.textContent = text;
    svg.appendChild(el);
    return el;
  };

  const defs = document.createElementNS(svgNS, "defs");
  const hatch = document.createElementNS(svgNS, "pattern");
  hatch.setAttribute("id", `hatch-${dayId}`);
  hatch.setAttribute("patternUnits", "userSpaceOnUse");
  hatch.setAttribute("width", "10");
  hatch.setAttribute("height", "10");
  hatch.setAttribute("patternTransform", "rotate(45)");
  const hatchLine = document.createElementNS(svgNS, "line");
  ["x1", "y1", "x2", "y2"].forEach((a, i) => hatchLine.setAttribute(a, String([0, 0, 0, 10][i])));
  hatchLine.setAttribute("stroke", "#94A3B0");
  hatchLine.setAttribute("stroke-width", "1.4");
  hatchLine.setAttribute("opacity", "0.55");
  hatch.appendChild(hatchLine);
  defs.appendChild(hatch);

  const marker = document.createElementNS(svgNS, "marker");
  marker.setAttribute("id", `arrow-${dayId}`);
  marker.setAttribute("viewBox", "0 0 10 10");
  marker.setAttribute("refX", "9");
  marker.setAttribute("refY", "5");
  marker.setAttribute("markerWidth", "14");
  marker.setAttribute("markerHeight", "14");
  marker.setAttribute("orient", "auto");
  const tip = document.createElementNS(svgNS, "path");
  tip.setAttribute("d", "M0 0 L10 5 L0 10 z");
  tip.setAttribute("fill", "#EF842C");
  marker.appendChild(tip);
  defs.appendChild(marker);

  const tMarker = document.createElementNS(svgNS, "marker");
  tMarker.setAttribute("id", `traffic-${dayId}`);
  tMarker.setAttribute("viewBox", "0 0 10 10");
  tMarker.setAttribute("refX", "9");
  tMarker.setAttribute("refY", "5");
  tMarker.setAttribute("markerWidth", "12");
  tMarker.setAttribute("markerHeight", "12");
  tMarker.setAttribute("orient", "auto");
  const tTip = document.createElementNS(svgNS, "path");
  tTip.setAttribute("d", "M0 0 L10 5 L0 10 z");
  tTip.setAttribute("fill", "#1F2933");
  tMarker.appendChild(tTip);
  defs.appendChild(tMarker);
  svg.appendChild(defs);

  add("rect", { x: 0, y: 0, width: MAP_VIEWBOX.w, height: MAP_VIEWBOX.h, fill: "#F5F8FA" });

  /* סימני התמצאות */
  add("rect", { x: 4, y: 58, width: 60, height: 1426, fill: "#B42318", rx: 6 });
  add(
    "text",
    {
      x: 34,
      y: 770,
      "text-anchor": "middle",
      fill: "#fff",
      "font-size": "20",
      "font-weight": "800",
      transform: "rotate(-90 34 770)",
    },
    "התחנה המרכזית"
  );
  add("rect", { x: 972, y: 58, width: 44, height: 1426, fill: "#B42318", rx: 6 });
  add(
    "text",
    {
      x: 994,
      y: 770,
      "text-anchor": "middle",
      fill: "#fff",
      "font-size": "17",
      "font-weight": "800",
      transform: "rotate(-90 994 770)",
    },
    "תחנת רכבת מרכז"
  );
  add("rect", { x: 596, y: 2, width: 364, height: 40, fill: "#073b68", rx: 4 });
  add(
    "text",
    { x: 778, y: 30, "text-anchor": "middle", fill: "#fff", "font-size": "20", "font-weight": "800" },
    "רחוב יצחק בן צבי"
  );

  MAP_TRAFFIC.forEach((a) => {
    add("line", {
      x1: a.x,
      y1: a.y1,
      x2: a.x,
      y2: a.y2,
      stroke: "#1F2933",
      "stroke-width": "4",
      "stroke-linecap": "round",
      "marker-end": `url(#traffic-${dayId})`,
      opacity: "0.55",
    });
  });

  /* קו מחבר סכמטי מסככה מקורית לחלופי */
  if (highlight && highlight.changed && highlight.from !== highlight.to) {
    const a = box(highlight.from);
    const b = box(highlight.to);
    add("line", {
      x1: a.cx,
      y1: a.cy,
      x2: b.cx,
      y2: b.cy,
      stroke: "#EF842C",
      "stroke-width": "5",
      "stroke-dasharray": "10 8",
      "marker-end": `url(#arrow-${dayId})`,
      opacity: "0.9",
      "aria-hidden": "true",
    });
  }

  Object.keys(MAP_LAYOUT)
    .map(Number)
    .forEach((id) => {
      const b = box(id);
      const role = roleFor(id, day, highlight);
      const pal = COLORS[role];
      const label = PLATFORM_LABELS[id] || {};
      const g = document.createElementNS(svgNS, "g");
      g.setAttribute("data-platform", String(id));
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      const lines = linesAtPlatform(dayId, id);
      const lineHint = lines
        .filter((l) => l.role !== "displaced")
        .map((l) => (l.directionLabel ? `${l.line} ${l.directionLabel}` : l.line))
        .join(", ");
      let aria = `סככה ${id}`;
      if (role === "closed") aria += ", סגור";
      if (role === "your") aria += ", הסככה שלך";
      if (role === "original") aria += `, סככה מקורית שעברה לסככה ${highlight.to}`;
      if (lineHint) aria += `. קווים: ${lineHint}`;
      g.setAttribute("aria-label", aria);

      const r = document.createElementNS(svgNS, "rect");
      r.setAttribute("x", b.x);
      r.setAttribute("y", b.y);
      r.setAttribute("width", b.w);
      r.setAttribute("height", b.h);
      r.setAttribute("rx", "14");
      r.setAttribute("fill", pal.fill);
      r.setAttribute("stroke", pal.stroke);
      r.setAttribute("stroke-width", role === "your" ? "8" : role === "original" ? "5" : "2");
      g.appendChild(r);

      if (role === "closed") {
        const ov = document.createElementNS(svgNS, "rect");
        ov.setAttribute("x", b.x);
        ov.setAttribute("y", b.y);
        ov.setAttribute("width", b.w);
        ov.setAttribute("height", b.h);
        ov.setAttribute("rx", "14");
        ov.setAttribute("fill", `url(#hatch-${dayId})`);
        ov.setAttribute("pointer-events", "none");
        g.appendChild(ov);

        const x1 = document.createElementNS(svgNS, "line");
        x1.setAttribute("x1", b.cx - 18);
        x1.setAttribute("y1", b.y + 44);
        x1.setAttribute("x2", b.cx + 18);
        x1.setAttribute("y2", b.y + 72);
        x1.setAttribute("stroke", "#C45D0E");
        x1.setAttribute("stroke-width", "4");
        x1.setAttribute("stroke-linecap", "round");
        x1.setAttribute("opacity", "0.75");
        g.appendChild(x1);
        const x2 = document.createElementNS(svgNS, "line");
        x2.setAttribute("x1", b.cx + 18);
        x2.setAttribute("y1", b.y + 44);
        x2.setAttribute("x2", b.cx - 18);
        x2.setAttribute("y2", b.y + 72);
        x2.setAttribute("stroke", "#C45D0E");
        x2.setAttribute("stroke-width", "4");
        x2.setAttribute("stroke-linecap", "round");
        x2.setAttribute("opacity", "0.75");
        g.appendChild(x2);
      }

      const num = document.createElementNS(svgNS, "text");
      num.setAttribute("x", b.cx);
      num.setAttribute("y", b.y + (role === "your" ? 52 : 42));
      num.setAttribute("text-anchor", "middle");
      num.setAttribute("fill", pal.text);
      num.setAttribute("font-size", role === "your" ? "48" : "28");
      num.setAttribute("font-weight", "800");
      num.textContent = String(id);
      g.appendChild(num);

      if (role === "your") {
        const badge = document.createElementNS(svgNS, "text");
        badge.setAttribute("x", b.cx);
        badge.setAttribute("y", b.y + 78);
        badge.setAttribute("text-anchor", "middle");
        badge.setAttribute("fill", "#FFE08A");
        badge.setAttribute("font-size", "16");
        badge.setAttribute("font-weight", "800");
        badge.textContent = "הסככה שלך";
        g.appendChild(badge);
      } else if (role === "original") {
        const badge = document.createElementNS(svgNS, "text");
        badge.setAttribute("x", b.cx);
        badge.setAttribute("y", b.y + 68);
        badge.setAttribute("text-anchor", "middle");
        badge.setAttribute("fill", pal.text);
        badge.setAttribute("font-size", "14");
        badge.setAttribute("font-weight", "700");
        badge.textContent = `→ ${highlight.to}`;
        g.appendChild(badge);
      } else {
        const sub = document.createElementNS(svgNS, "text");
        sub.setAttribute("x", b.cx);
        sub.setAttribute("y", b.y + 68);
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("fill", pal.text);
        sub.setAttribute("font-size", "13");
        sub.setAttribute("font-weight", "600");
        sub.setAttribute("opacity", role === "dim" ? "0.55" : "0.9");
        const t = label.title || (label.drop ? "הורדה" : "");
        sub.textContent = t || (label.lines ? String(label.lines).slice(0, 18) : "");
        g.appendChild(sub);
      }

      const activate = () => {
        if (typeof onSelectPlatform === "function") onSelectPlatform(id);
      };
      g.addEventListener("click", activate);
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });

      svg.appendChild(g);
    });

  return svg;
}

/** התאמת תצוגה לנייד — גלילה למרכז הסככה הנבחר */
export function focusMapOnPlatform(scroller, svg, platformId) {
  if (!scroller || !svg || !platformId || !MAP_LAYOUT[platformId]) return;
  const [x, y, w, h] = MAP_LAYOUT[platformId];
  const vb = MAP_VIEWBOX;
  const scaleX = svg.clientWidth / vb.w;
  const scaleY = svg.clientHeight / vb.h;
  const cx = (x + w / 2) * scaleX;
  const cy = (y + h / 2) * scaleY;
  const left = Math.max(0, cx - scroller.clientWidth / 2);
  const top = Math.max(0, cy - scroller.clientHeight / 2);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller.scrollTo({ left, top, behavior: reduce ? "auto" : "smooth" });
}

export function mapTextAlternative(dayId, highlight) {
  const day = DAY_BY_ID[dayId];
  const parts = [
    `מפת הסככות ל${day.weekdayHe} ${day.shortDate}.`,
    day.note,
    `סככות סגורות: ${day.closedPlatforms.join(", ")}.`,
  ];
  if (highlight) {
    if (highlight.changed) {
      parts.push(`הסככה שלך: ${highlight.to}. מעבר מסככה ${highlight.from} לסככה ${highlight.to}.`);
    } else {
      parts.push(`הסככה שלך: ${highlight.to}.`);
    }
  }
  return parts.join(" ");
}

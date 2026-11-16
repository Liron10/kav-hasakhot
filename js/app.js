import {
  DATA_NOTES,
  DAY_BY_ID,
  DAYS,
  META,
  QUICK_LINES,
} from "./data.js";
import {
  allChangesForDay,
  defaultDayId,
  dropoffsForDay,
  formatResultDetail,
  formatResultTitle,
  isWorkDate,
  jerusalemNow,
  normalize,
  normalizeLine,
  linesAtPlatform,
  resolveSelection,
  runMandatoryTests,
  search,
  shareText,
} from "./engine.js";
import { buildPlatformMap, focusMapOnPlatform, mapTextAlternative } from "./map.js";

const SAVED_LINE_KEY = "br7tnuaupdate-saved-line-v1";
const LEGACY_FAV_KEY = "kav-hasakhot-favorites-v2";
const state = {
  day: defaultDayId(),
  query: "",
  line: "",
  directionId: "",
  option: null,
  platformInspect: null,
};

let savedLine = loadSavedLine();

const $ = (id) => document.getElementById(id);
const els = {
  dayTabs: $("day-tabs"),
  search: $("search"),
  clearBtn: $("clear-btn"),
  quickLines: $("quick-lines"),
  directionPanel: $("direction-panel"),
  resultCard: $("result-card"),
  liveRegion: $("live-region"),
  mapMount: $("map-mount"),
  mapAlt: $("map-alt"),
  mapScroller: $("map-scroller"),
  changesList: $("changes-list"),
  savedPanel: $("saved-line-panel"),
  toast: $("toast"),
  platformPanel: $("platform-panel"),
  statusBanner: $("status-banner"),
};

/** שמירת קו אחד בלבד במכשיר */
function loadSavedLine() {
  try {
    const one = localStorage.getItem(SAVED_LINE_KEY);
    if (one && QUICK_LINES.includes(one)) return one;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_FAV_KEY) || "[]");
    if (Array.isArray(legacy) && legacy.length) {
      const first = legacy.find((x) => QUICK_LINES.includes(x)) || null;
      if (first) {
        localStorage.setItem(SAVED_LINE_KEY, first);
        localStorage.removeItem(LEGACY_FAV_KEY);
        return first;
      }
    }
  } catch {}
  return null;
}
function persistSavedLine() {
  try {
    if (savedLine) localStorage.setItem(SAVED_LINE_KEY, savedLine);
    else localStorage.removeItem(SAVED_LINE_KEY);
  } catch {}
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function readParams() {
  const params = new URLSearchParams(location.search);
  const hash = new URLSearchParams((location.hash || "").replace(/^#/, "").includes("=") ? (location.hash || "").replace(/^#/, "") : "");
  const get = (k) => params.get(k) || hash.get(k);
  const day = get("day");
  const line = get("line");
  const dir = get("dir") || get("direction");
  const q = get("q");
  if (day && DAY_BY_ID[day]) state.day = day;
  if (line) {
    state.line = normalizeLine(line);
    state.query = state.line;
  } else if (q) {
    state.query = q;
  }
  if (dir) state.directionId = dir;
}

function writeParams() {
  const params = new URLSearchParams();
  if (state.day) params.set("day", state.day);
  if (state.line) params.set("line", state.line);
  if (state.directionId) params.set("dir", state.directionId);
  else if (state.query && !state.line) params.set("q", state.query);
  const next = params.toString();
  const url = `${location.pathname}${next ? "?" + next : ""}`;
  if (location.pathname + location.search !== url) {
    history.replaceState(null, "", url);
  }
}

function renderStatus() {
  const now = jerusalemNow();
  const banner = els.statusBanner;
  if (!banner) return;
  const work = isWorkDate(now.date);
  if (!work) {
    if (now.date < META.workStart) {
      banner.hidden = false;
      banner.dataset.state = "upcoming";
      banner.innerHTML = `<p><strong>לקראת העבודות</strong> — ${escapeHtml(META.siteTitle)}, ${escapeHtml(META.hoursShort)}. בחרו יום וקו כדי להיערך מראש.</p>`;
    } else {
      banner.hidden = false;
      banner.dataset.state = "ended";
      banner.innerHTML = `<p><strong>תקופת העבודות הסתיימה</strong> — הפרטים נשארו זמינים בעמוד לעיון.</p>`;
    }
    return;
  }
  const day = DAY_BY_ID[ISO_DAY(now.date)];
  const mins = now.minutes;
  const start = 9 * 60;
  const end = 17 * 60;
  banner.hidden = false;
  if (mins < start) {
    banner.dataset.state = "later";
    banner.innerHTML = `<p><strong>העבודות מתחילות היום</strong> בשעה 09:00. ${escapeHtml(day.note)}</p>`;
  } else if (mins < end) {
    banner.dataset.state = "active";
    banner.innerHTML = `<p><strong>העבודות מתקיימות עכשיו</strong> (עד 17:00 המתוכננות). ${escapeHtml(day.note)} ${escapeHtml(META.hoursNote)}</p>`;
  } else {
    banner.dataset.state = "paused";
    banner.innerHTML = `<p><strong>סיום העבודות היומי המתוכנן</strong> — ${escapeHtml(META.hoursNote)}</p>`;
  }
}

function ISO_DAY(iso) {
  const d = DAYS.find((x) => x.iso === iso);
  return d ? d.id : null;
}

function renderDayTabs() {
  els.dayTabs.innerHTML = "";
  DAYS.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-btn";
    btn.dataset.day = d.id;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", state.day === d.id ? "true" : "false");
    btn.innerHTML = `<span class="day-name">${escapeHtml(d.weekdayHe)}</span><span class="day-date" dir="ltr">${escapeHtml(d.shortDate)}</span>`;
    if (isWorkDate(jerusalemNow().date) && ISO_DAY(jerusalemNow().date) === d.id) {
      const badge = document.createElement("span");
      badge.className = "today-badge";
      badge.textContent = "היום";
      btn.appendChild(badge);
    }
    btn.addEventListener("click", () => {
      state.day = d.id;
      state.platformInspect = null;
      /* שמירת קו וכיוון — עדכון אוטומטי */
      syncAndAnnounce();
      render();
    });
    els.dayTabs.appendChild(btn);
  });
}

function renderQuickLines() {
  const wrap = els.quickLines;
  wrap.innerHTML = "";
  const ordered = savedLine
    ? [savedLine, ...QUICK_LINES.filter((l) => l !== savedLine)]
    : QUICK_LINES.slice();
  ordered.forEach((line) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "line-chip" +
      (state.line === normalizeLine(line) ? " is-active" : "") +
      (savedLine === line ? " is-fav" : "");
    btn.setAttribute("aria-pressed", state.line === normalizeLine(line) ? "true" : "false");
    btn.innerHTML = `<span>קו ${escapeHtml(line)}</span>`;
    btn.addEventListener("click", () => selectLine(line));
    wrap.appendChild(btn);
  });
  renderSavedPanel();
}

function toggleSavedLine(line) {
  const n = normalizeLine(line);
  if (savedLine === n) {
    savedLine = null;
    showToast("הקו נמחק מהשמירה");
  } else {
    savedLine = n;
    showToast(`נשמר קו ${n} בלבד במכשיר זה`);
  }
  persistSavedLine();
  renderQuickLines();
  renderResultCard();
}

function renderSavedPanel() {
  const panel = els.savedPanel;
  if (!panel) return;
  if (!savedLine) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="saved-line-card">
      <p class="saved-kicker">הקו ששמרתם במכשיר</p>
      <p class="saved-line-name">קו ${escapeHtml(savedLine)}</p>
      <div class="saved-actions">
        <button type="button" class="btn-primary" id="open-saved-line">הציגו את הסככה שלי</button>
        <button type="button" class="btn-secondary" id="clear-saved-line">מחיקת שמירה</button>
      </div>
    </div>`;
  $("open-saved-line")?.addEventListener("click", () => selectLine(savedLine));
  $("clear-saved-line")?.addEventListener("click", () => toggleSavedLine(savedLine));
}

function selectLine(line) {
  state.line = normalizeLine(line);
  state.query = state.line;
  state.directionId = "";
  state.option = null;
  state.platformInspect = null;
  els.search.value = state.line;
  syncAndAnnounce();
  render();
  $("search-section")?.scrollIntoView({ behavior: prefersReduce() ? "auto" : "smooth", block: "start" });
}

function prefersReduce() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncFromLine() {
  if (!state.line) {
    state.option = null;
    return;
  }
  const r = resolveSelection(state.day, state.line, state.directionId || null);
  if (r.status === "ready") {
    state.option = r.option;
    state.directionId = r.option.directionId;
  } else if (r.status === "need-direction") {
    state.option = null;
  } else {
    state.option = null;
  }
}

function syncAndAnnounce() {
  syncFromLine();
  if (state.option) announceResult(state.option);
}

function renderDirectionPanel() {
  const panel = els.directionPanel;
  if (!state.line) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  const r = resolveSelection(state.day, state.line, state.directionId || null);
  if (r.status === "not-found") {
    panel.hidden = false;
    panel.innerHTML = `<div class="empty-box" role="status">
      <p><strong>קו ${escapeHtml(state.line)} אינו מופיע בשינויים ליום זה.</strong></p>
      <p>ייתכן שהוא פועל מהסככה הרגילה. אין בידינו סככה מאומתת להצגה — בדקו את השילוט בשטח.</p>
    </div>`;
    return;
  }
  if (r.status !== "need-direction") {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `<h3 class="dir-title">קו ${escapeHtml(state.line)} — לאן נוסעים?</h3>
    <div class="dir-options" role="group" aria-label="בחירת יעד"></div>`;
  const group = panel.querySelector(".dir-options");
  r.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dir-btn";
    const letter = String.fromCharCode(1488 + i); // א, ב, ...
    const label = opt.directionLabel ? `ל${opt.directionLabel}` : "בלי יעד מאומת";
    btn.innerHTML = `<span class="dir-letter">אפשרות ${letter}</span><span class="dir-label">${escapeHtml(label)}</span>`;
    btn.addEventListener("click", () => {
      state.directionId = opt.directionId;
      state.option = opt;
      render();
      announceResult(opt);
    });
    group.appendChild(btn);
  });
}

function announceResult(opt) {
  const title = formatResultTitle(opt);
  if (opt.changed) {
    els.liveRegion.textContent = `${title}. סככה קודמת ${opt.from}, סככה חדשה ${opt.to}.`;
  } else {
    els.liveRegion.textContent = `${title}, סככה ${opt.to}. ${formatResultDetail(state.day, opt)}`;
  }
}

function renderResultCard() {
  const card = els.resultCard;
  if (!state.option) {
    card.hidden = true;
    card.innerHTML = "";
    return;
  }
  const opt = state.option;
  const title = formatResultTitle(opt);
  const day = DAY_BY_ID[state.day];
  const dayLabel = day ? `${day.weekdayHe} ${day.shortDate}` : "";
  const isSaved = state.line && savedLine === normalizeLine(state.line);
  card.hidden = false;

  const compare = opt.changed
    ? `<div class="compare-box" role="group" aria-label="השוואת סככות">
        <div class="compare-col compare-old">
          <span class="compare-label">סככה קודמת</span>
          <span class="compare-num" aria-label="סככה קודמת ${opt.from}">${opt.from}</span>
          <span class="compare-hint">אל תעלו כאן</span>
        </div>
        <div class="compare-arrow" aria-hidden="true">←</div>
        <div class="compare-col compare-new">
          <span class="compare-label">סככה חדשה</span>
          <span class="compare-num" aria-label="סככה חדשה ${opt.to}">${opt.to}</span>
          <span class="compare-hint">כאן עולים</span>
        </div>
      </div>
      <p class="result-instruction"><strong>מה לעשות:</strong> ביום ${escapeHtml(dayLabel)} לכו לסככה <strong>${opt.to}</strong> במקום סככה ${opt.from}.</p>`
    : `<div class="compare-box compare-same" role="group" aria-label="סככה ללא שינוי">
        <div class="compare-col compare-new">
          <span class="compare-label">הסככה שלכם</span>
          <span class="compare-num" aria-label="סככה ${opt.to}">${opt.to}</span>
          <span class="compare-hint">לא השתנתה ביום זה</span>
        </div>
      </div>
      <p class="result-instruction"><strong>מה לעשות:</strong> ביום ${escapeHtml(dayLabel)} עולים מסככה <strong>${opt.to}</strong> כרגיל.</p>`;

  card.innerHTML = `
    <p class="result-kicker">${opt.kind === "dropoff" ? "תחנת הורדה" : "התשובה שלכם"}</p>
    <h2 id="result-heading" class="result-title">${escapeHtml(title)}</h2>
    ${compare}
    ${opt.directionNote ? `<p class="result-note">${escapeHtml(opt.directionNote)}</p>` : ""}
    <div class="result-actions">
      <button type="button" class="btn-primary" id="show-on-map">הציגו לי במפה</button>
      ${
        state.line
          ? `<button type="button" class="btn-secondary" id="save-line-btn">${
              isSaved ? "הסרת הקו השמור" : "שמירת הקו שלי (אחד בלבד)"
            }</button>`
          : ""
      }
      <button type="button" class="btn-secondary" id="copy-result">העתקת הודעה</button>
      <button type="button" class="btn-secondary" id="wa-result">שיתוף בוואטסאפ</button>
    </div>
  `;
  $("show-on-map")?.addEventListener("click", () => {
    $("map-section")?.scrollIntoView({ behavior: prefersReduce() ? "auto" : "smooth", block: "start" });
    const svg = els.mapMount.querySelector("svg");
    focusMapOnPlatform(els.mapScroller, svg, opt.to);
  });
  $("save-line-btn")?.addEventListener("click", () => toggleSavedLine(state.line));
  $("copy-result")?.addEventListener("click", () => copyResult());
  $("wa-result")?.addEventListener("click", () => shareWhatsApp());
}

function resultUrl() {
  const params = new URLSearchParams();
  params.set("day", state.day);
  if (state.line) params.set("line", state.line);
  if (state.directionId) params.set("dir", state.directionId);
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

function copyResult() {
  if (!state.option) return;
  const text = `${shareText(state.day, state.option)}\n${resultUrl()}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast("ההודעה הועתקה")).catch(() => showToast(text));
  } else showToast("העתיקו ידנית מהשיתוף");
}

function shareWhatsApp() {
  if (!state.option) return;
  const text = `${shareText(state.day, state.option)}\n${resultUrl()}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function renderMap() {
  const highlight = state.option
    ? { from: state.option.from, to: state.option.to, changed: state.option.changed }
    : null;
  els.mapMount.innerHTML = "";
  const svg = buildPlatformMap({
    dayId: state.day,
    highlight,
    onSelectPlatform: (id) => {
      state.platformInspect = id;
      renderPlatformPanel();
    },
  });
  els.mapMount.appendChild(svg);
  els.mapAlt.textContent = mapTextAlternative(state.day, highlight);

  if (highlight?.to) {
    requestAnimationFrame(() => focusMapOnPlatform(els.mapScroller, svg, highlight.to));
  }
}

function renderPlatformPanel() {
  const panel = els.platformPanel;
  if (!state.platformInspect) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  const id = state.platformInspect;
  const day = DAY_BY_ID[state.day];
  const closed = day.closedPlatforms.includes(id);
  const lines = linesAtPlatform(state.day, id);
  panel.hidden = false;
  let html = `<div class="platform-inspect">
    <h3>סככה ${id}${closed ? " (סגור היום)" : ""}</h3>`;
  if (!lines.length) {
    html += `<p>אין קווי עלייה מאומתים לסככה זו ביום שנבחר.</p>`;
  } else {
    html += `<ul class="platform-lines">`;
    lines.forEach((l) => {
      const dir = l.directionLabel ? ` לכיוון ${l.directionLabel}` : "";
      const role =
        l.role === "alternate"
          ? " — סככה חלופית"
          : l.role === "displaced"
            ? ` — עבר לסככה ${l.to}`
            : " — סככה רגילה";
      html += `<li><button type="button" class="linkish" data-pick-line="${escapeHtml(l.line)}" data-pick-dir="${escapeHtml(l.directionId)}">קו ${escapeHtml(l.line)}${escapeHtml(dir)}</button>${escapeHtml(role)}</li>`;
    });
    html += `</ul>`;
  }
  html += `<button type="button" class="btn-secondary" id="close-platform">סגירה</button></div>`;
  panel.innerHTML = html;
  panel.querySelectorAll("[data-pick-line]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.line = normalizeLine(btn.dataset.pickLine);
      state.directionId = btn.dataset.pickDir;
      state.query = state.line;
      els.search.value = state.line;
      syncFromLine();
      render();
      if (state.option) announceResult(state.option);
    });
  });
  $("close-platform")?.addEventListener("click", () => {
    state.platformInspect = null;
    renderPlatformPanel();
  });
}

function renderChanges() {
  const root = els.changesList;
  root.innerHTML = "";
  DAYS.forEach((d) => {
    const details = document.createElement("details");
    details.className = "changes-day";
    if (d.id === state.day) details.open = true;
    const summary = document.createElement("summary");
    summary.innerHTML = `<strong>${escapeHtml(d.buttonLabel)}</strong> — ${escapeHtml(d.note)}`;
    details.appendChild(summary);
    const list = document.createElement("ul");
    list.className = "change-items";
    allChangesForDay(d.id).forEach((c) => {
      const li = document.createElement("li");
      if (c.kind === "dropoff") {
        li.innerHTML = `<span class="chg-kind">הורדה</span> מסככה <strong>${c.from}</strong> → סככה <strong>${c.to}</strong>`;
      } else if (c.directionLabel) {
        li.innerHTML = `קו <strong>${escapeHtml(c.line)}</strong> לכיוון ${escapeHtml(c.directionLabel)}: סככה <strong>${c.from}</strong> → <strong>${c.to}</strong>`;
      } else {
        li.innerHTML = `קו <strong>${escapeHtml(c.line)}</strong>: סככה <strong>${c.from}</strong> → <strong>${c.to}</strong> <em>(יעד לא מאומת)</em>`;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "linkish";
      btn.textContent = "בחירה";
      btn.addEventListener("click", () => {
        state.day = d.id;
        if (c.kind === "dropoff") {
          state.line = "";
          state.directionId = "";
          state.query = "הורדה";
          els.search.value = "הורדה";
          const drops = dropoffsForDay(d.id).filter((x) => x.from === c.from);
          state.option = drops[0] || null;
        } else {
          state.line = normalizeLine(c.line);
          state.directionId = c.directionId;
          state.query = state.line;
          els.search.value = state.line;
          syncFromLine();
        }
        render();
      });
      li.appendChild(document.createTextNode(" "));
      li.appendChild(btn);
      list.appendChild(li);
    });
    details.appendChild(list);
    root.appendChild(details);
  });

  const notes = document.createElement("div");
  notes.className = "data-notes";
  notes.innerHTML = `<h3>הערות דיוק</h3><ul>${DATA_NOTES.map((n) => `<li>${escapeHtml(n.text)}</li>`).join("")}</ul>`;
  root.appendChild(notes);
}

function handleSearchInput() {
  const raw = els.search.value;
  state.query = raw;
  state.platformInspect = null;

  const q = normalize(raw);
  if (!q) {
    state.line = "";
    state.directionId = "";
    state.option = null;
    render();
    return;
  }

  const result = search(state.day, raw);

  if (result.type === "line") {
    state.line = result.line;
    if (result.options.length === 1) {
      state.directionId = result.options[0].directionId;
      state.option = result.options[0];
    } else if (state.directionId && result.options.some((o) => o.directionId === state.directionId)) {
      state.option = result.options.find((o) => o.directionId === state.directionId);
    } else {
      state.directionId = "";
      state.option = null;
    }
  } else if (result.type === "line-missing") {
    state.line = result.line;
    state.directionId = "";
    state.option = null;
  } else if (result.type === "dropoffs") {
    state.line = "";
    state.directionId = "";
    /* אם יש כמה הורדות — נציג את הראשונה ונוסיף בחירה בפאנל */
    if (result.items.length === 1) {
      state.option = result.items[0];
    } else {
      state.option = null;
      renderDropoffChooser(result.items);
      renderDayTabs();
      renderQuickLines();
      renderResultCard();
      renderMap();
      renderChanges();
      writeParams();
      return;
    }
  } else if (result.type === "matches") {
    /* אם כל ההתאמות מאותו קו — נבחר קו; אחרת נציג אפשרויות */
    const lines = [...new Set(result.items.map((i) => normalizeLine(i.line)))];
    if (lines.length === 1 && result.items.length === 1) {
      state.line = lines[0];
      state.directionId = result.items[0].directionId;
      state.option = result.items[0];
    } else if (lines.length === 1) {
      state.line = lines[0];
      state.directionId = "";
      state.option = null;
    } else {
      state.line = "";
      state.directionId = "";
      state.option = null;
      renderMatchChooser(result.items);
      renderDayTabs();
      renderQuickLines();
      renderResultCard();
      renderMap();
      renderChanges();
      writeParams();
      return;
    }
  } else {
    state.line = "";
    state.directionId = "";
    state.option = null;
  }

  render();
}

function renderDropoffChooser(items) {
  els.directionPanel.hidden = false;
  els.directionPanel.innerHTML = `<h3 class="dir-title">הורדה — בחרו סככה מקורית</h3><div class="dir-options"></div>`;
  const g = els.directionPanel.querySelector(".dir-options");
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dir-btn";
    btn.innerHTML = `<span class="dir-label">הורדה מסככה ${item.from} → סככה ${item.to}</span>`;
    btn.addEventListener("click", () => {
      state.option = item;
      render();
      announceResult(item);
    });
    g.appendChild(btn);
  });
}

function renderMatchChooser(items) {
  els.directionPanel.hidden = false;
  els.directionPanel.innerHTML = `<h3 class="dir-title">נמצאו כמה התאמות</h3><div class="dir-options"></div>`;
  const g = els.directionPanel.querySelector(".dir-options");
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dir-btn";
    const title = formatResultTitle(item);
    btn.innerHTML = `<span class="dir-label">${escapeHtml(title)} — סככה ${item.to}</span>`;
    btn.addEventListener("click", () => {
      state.line = normalizeLine(item.line);
      state.directionId = item.directionId;
      state.option = item;
      els.search.value = state.line;
      render();
      announceResult(item);
    });
    g.appendChild(btn);
  });
}

function render() {
  renderStatus();
  renderDayTabs();
  renderQuickLines();
  renderDirectionPanel();
  renderResultCard();
  renderMap();
  renderPlatformPanel();
  renderChanges();
  els.clearBtn.hidden = !(state.query || state.line || state.option);
  writeParams();

  const day = DAY_BY_ID[state.day];
  const dayNote = $("day-note");
  if (dayNote) dayNote.textContent = day.note;
}

function bind() {
  els.search.addEventListener("input", handleSearchInput);
  els.clearBtn.addEventListener("click", () => {
    state.query = "";
    state.line = "";
    state.directionId = "";
    state.option = null;
    state.platformInspect = null;
    els.search.value = "";
    render();
    els.search.focus();
  });

  $("zoom-in")?.addEventListener("click", () => zoomMap(1.15));
  $("zoom-out")?.addEventListener("click", () => zoomMap(1 / 1.15));
  $("zoom-reset")?.addEventListener("click", () => {
    const svg = els.mapMount.querySelector("svg");
    if (svg) svg.style.width = "";
    els.mapScroller.scrollTo({ left: 0, top: 0 });
  });
}

let mapZoom = 1;
function zoomMap(factor) {
  mapZoom = Math.min(2.5, Math.max(0.7, mapZoom * factor));
  const svg = els.mapMount.querySelector("svg");
  if (!svg) return;
  svg.style.width = `${mapZoom * 100}%`;
  svg.style.minWidth = `${640 * mapZoom}px`;
}

function boot() {
  readParams();
  if (state.line) syncFromLine();
  else if (state.query) {
    els.search.value = state.query;
    handleSearchInput();
    return;
  }
  els.search.value = state.query || state.line || "";
  bind();
  render();

  /* בדיקות תקינות בקונסול (פיתוח) */
  const failures = runMandatoryTests();
  if (failures.length) {
    console.error("בדיקות תקינות נכשלו:", failures);
  } else {
    console.info("כל בדיקות התקינות המחייבות עברו.");
  }
}

boot();

/**
 * מנוע חיפוש ופתרון סככה — ללא תלות ב-DOM.
 */
import {
  BASELINE,
  CHANGES,
  DAY_BY_ID,
  DAYS,
  ISO_TO_DAY,
  META,
  QUICK_LINES,
} from "./data.js";

export function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\u05f3\u05f4"'\u201c\u201d\u2018\u2019]/g, "")
    .replace(/כיוון/g, "כוון")
    .replace(/מסוף\s*י"?א/g, "מסוף יא")
    .replace(/י"?א/g, "יא")
    .replace(/אצטדיון\s*/g, "")
    .replace(/(\d)\s+([אaא])/gi, "$1$2")
    .replace(/(\d)a\b/gi, "$1א")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLine(value) {
  const n = normalize(value).replace(/\s+/g, "");
  const m = n.match(/^(\d+)([א-תa-z]?)$/i);
  if (!m) return n;
  const suffix = m[2] ? m[2].replace(/a/i, "א") : "";
  return m[1] + suffix;
}

export function jerusalemNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const g = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    date: `${g.year}-${g.month}-${g.day}`,
    minutes: Number(g.hour) * 60 + Number(g.minute),
  };
}

/** ברירת מחדל: יום העבודות הקרוב / הנוכחי לפי שעון ישראל */
export function defaultDayId(now = jerusalemNow()) {
  if (ISO_TO_DAY[now.date]) return ISO_TO_DAY[now.date];
  if (now.date < META.workStart) return "16";
  if (now.date > META.workEnd) return "18";
  return "16";
}

export function isWorkDate(iso = jerusalemNow().date) {
  return Boolean(ISO_TO_DAY[iso]);
}

export function dayMeta(dayId) {
  return DAY_BY_ID[dayId] || null;
}

function isPlatformClosed(dayId, platform) {
  const day = DAY_BY_ID[dayId];
  return day ? day.closedPlatforms.includes(Number(platform)) : false;
}

/**
 * כל האפשרויות לקו ביום נתון (שינויים + סככות רגילות מאומתות כשהסככה פתוחה).
 */
export function optionsForLine(dayId, lineRaw) {
  const line = normalizeLine(lineRaw);
  if (!line) return [];

  const options = [];
  const seen = new Set();

  CHANGES.filter((c) => c.days.includes(dayId) && c.line && normalizeLine(c.line) === line).forEach((c) => {
    const key = c.directionId;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      source: "change",
      kind: c.kind,
      line: c.line,
      directionId: c.directionId,
      directionLabel: c.directionLabel,
      directionNote: c.directionNote || null,
      from: c.from,
      to: c.to,
      changed: true,
      changeId: c.id,
    });
  });

  BASELINE.filter((b) => normalizeLine(b.line) === line).forEach((b) => {
    if (seen.has(b.directionId)) return;
    if (isPlatformClosed(dayId, b.platform)) return;
    seen.add(b.directionId);
    options.push({
      source: "baseline",
      kind: "boarding",
      line: b.line,
      directionId: b.directionId,
      directionLabel: b.directionLabel,
      directionNote: b.note || null,
      from: b.platform,
      to: b.platform,
      changed: false,
      changeId: null,
    });
  });

  return options;
}

export function resolveSelection(dayId, lineRaw, directionId) {
  const opts = optionsForLine(dayId, lineRaw);
  if (!opts.length) return { status: "not-found", options: [] };
  if (opts.length === 1 && !directionId) {
    return { status: "ready", option: opts[0], options: opts };
  }
  if (!directionId) {
    return { status: "need-direction", options: opts };
  }
  const option = opts.find((o) => o.directionId === directionId);
  if (!option) return { status: "need-direction", options: opts };
  return { status: "ready", option, options: opts };
}

export function dropoffsForDay(dayId) {
  return CHANGES.filter((c) => c.days.includes(dayId) && c.kind === "dropoff").map((c) => ({
    source: "change",
    kind: "dropoff",
    line: null,
    directionId: c.directionId,
    directionLabel: null,
    directionNote: null,
    from: c.from,
    to: c.to,
    changed: true,
    changeId: c.id,
    summary: c.summary || "הורדה",
  }));
}

/** קווים העוברים בסככה ביום נתון (עלייה בלבד) */
export function linesAtPlatform(dayId, platformId) {
  const pid = Number(platformId);
  const result = [];

  CHANGES.filter((c) => c.days.includes(dayId) && c.kind === "boarding").forEach((c) => {
    if (c.to === pid) {
      result.push({
        line: c.line,
        directionId: c.directionId,
        directionLabel: c.directionLabel,
        role: "alternate",
        from: c.from,
        to: c.to,
      });
    } else if (c.from === pid) {
      result.push({
        line: c.line,
        directionId: c.directionId,
        directionLabel: c.directionLabel,
        role: "displaced",
        from: c.from,
        to: c.to,
      });
    }
  });

  BASELINE.forEach((b) => {
    if (b.platform !== pid) return;
    if (isPlatformClosed(dayId, pid)) return;
    const already = result.some(
      (r) => normalizeLine(r.line) === normalizeLine(b.line) && r.directionId === b.directionId
    );
    if (already) return;
    const displacedElsewhere = CHANGES.some(
      (c) =>
        c.days.includes(dayId) &&
        c.line &&
        normalizeLine(c.line) === normalizeLine(b.line) &&
        c.directionId === b.directionId
    );
    if (displacedElsewhere) return;
    result.push({
      line: b.line,
      directionId: b.directionId,
      directionLabel: b.directionLabel,
      role: "regular",
      from: b.platform,
      to: b.platform,
    });
  });

  return result;
}

/**
 * חיפוש חופשי: מספר קו, יעד, או "הורדה".
 * מחזיר התאמות ליום.
 */
export function search(dayId, queryRaw) {
  const q = normalize(queryRaw);
  if (!q) return { type: "empty" };

  if (q === "הורדה" || q === "ירידה") {
    return { type: "dropoffs", items: dropoffsForDay(dayId) };
  }

  /* ניסיון כמספר קו (כולל 2א / 2 א) */
  const asLine = normalizeLine(q);
  if (/^\d+[א-ת]?$/.test(asLine)) {
    const options = optionsForLine(dayId, asLine);
    if (options.length) {
      return { type: "line", line: asLine, options };
    }
    /* קו שלא נמצא */
    const known = QUICK_LINES.map(normalizeLine);
    if (known.includes(asLine) || /^\d+[א-ת]?$/.test(asLine)) {
      return { type: "line-missing", line: asLine, options: [] };
    }
  }

  /* חיפוש לפי יעד / מילות מפתח */
  const matches = [];
  const pushUnique = (item) => {
    const key = `${item.line}|${item.directionId}|${item.to}`;
    if (matches.some((m) => `${m.line}|${m.directionId}|${m.to}` === key)) return;
    matches.push(item);
  };

  CHANGES.filter((c) => c.days.includes(dayId) && c.kind === "boarding").forEach((c) => {
    const hay = normalize(
      [c.line, c.directionLabel, ...(c.keywords || [])].filter(Boolean).join(" ")
    );
    if (hay.includes(q) || (c.directionLabel && normalize(c.directionLabel).includes(q))) {
      pushUnique({
        source: "change",
        kind: "boarding",
        line: c.line,
        directionId: c.directionId,
        directionLabel: c.directionLabel,
        directionNote: c.directionNote || null,
        from: c.from,
        to: c.to,
        changed: true,
        changeId: c.id,
      });
    }
  });

  BASELINE.forEach((b) => {
    if (isPlatformClosed(dayId, b.platform)) return;
    const hay = normalize([b.line, b.directionLabel, ...(b.keywords || [])].filter(Boolean).join(" "));
    if (!hay.includes(q) && !(b.directionLabel && normalize(b.directionLabel).includes(q))) return;
    const covered = CHANGES.some(
      (c) =>
        c.days.includes(dayId) &&
        c.line &&
        normalizeLine(c.line) === normalizeLine(b.line) &&
        c.directionId === b.directionId
    );
    if (covered) return;
    pushUnique({
      source: "baseline",
      kind: "boarding",
      line: b.line,
      directionId: b.directionId,
      directionLabel: b.directionLabel,
      directionNote: b.note || null,
      from: b.platform,
      to: b.platform,
      changed: false,
      changeId: null,
    });
  });

  if (!matches.length) return { type: "none", query: queryRaw };
  return { type: "matches", items: matches };
}

export function formatResultTitle(option) {
  if (option.kind === "dropoff") {
    return option.summary || "הורדה";
  }
  if (option.directionLabel) {
    return `קו ${option.line} לכיוון ${option.directionLabel}`;
  }
  return `קו ${option.line}`;
}

export function formatResultDetail(dayId, option) {
  const day = DAY_BY_ID[dayId];
  const dayPart = day ? `${day.weekdayHe} ${day.shortDate}` : "";
  if (option.kind === "dropoff") {
    return `ביום ${dayPart}, במקום סככה ${option.from}`;
  }
  if (option.changed) {
    return `ביום ${dayPart}, במקום סככה ${option.from}`;
  }
  return `ביום ${dayPart} — סככה רגילה (לא שונה)`;
}

export function allChangesForDay(dayId) {
  return CHANGES.filter((c) => c.days.includes(dayId));
}

export function shareText(dayId, option) {
  const day = DAY_BY_ID[dayId];
  const title = formatResultTitle(option);
  const dayPart = day ? `${day.weekdayHe} ${day.shortDate}` : "";
  let text = `שינויים בסככות התחנה המרכזית | באר שבע\n${title}\n`;
  if (option.changed) {
    text += `סככה קודמת: ${option.from}\nסככה חדשה: ${option.to}\nביום ${dayPart} — לכו לסככה ${option.to} במקום סככה ${option.from}.\n`;
  } else {
    text += `סככה: ${option.to}\nביום ${dayPart} — הסככה לא השתנתה.\n`;
  }
  if (option.directionNote) text += `הערה: ${option.directionNote}\n`;
  text += META.hoursNote;
  return text;
}

/** בדיקות תקינות מחייבות — מחזיר מערך כשלונות (ריק = עבר) */
export function runMandatoryTests() {
  const cases = [
    { day: "16", line: "11", dir: "turner", to: 6 },
    { day: "16", line: "13", dir: "big", to: 6 },
    { day: "16", line: "24", dir: "ramot", to: 8 },
    { day: "16", line: "34", dir: "ramot", to: 8 },
    { day: "17", line: "2", dir: "ramot", to: 3 },
    { day: "17", line: "2", dir: "nahal-beka", to: 18 },
    { day: "17", line: "8", dir: "turner", to: 2 },
    { day: "17", line: "8", dir: "terminal-ya", to: 20 },
    { day: "17", line: "13", dir: "big", to: 2 },
    { day: "17", line: "13", dir: "hatzerim-terminal", to: 19 },
    { day: "17", line: "32א", dir: "terminal-ya", to: 2 },
    { day: "17", line: "33", dir: "terminal-ya", to: 2 },
    { day: "18", line: "2", dir: "ramot", to: 3 },
    { day: "18", line: "8", dir: "terminal-ya", to: 20 },
  ];
  const failures = [];
  cases.forEach((t) => {
    const r = resolveSelection(t.day, t.line, t.dir);
    if (r.status !== "ready" || !r.option || r.option.to !== t.to) {
      failures.push({
        ...t,
        got: r.status === "ready" ? r.option && r.option.to : r.status,
      });
    }
  });

  const d4 = dropoffsForDay("17").find((d) => d.from === 4);
  const d15 = dropoffsForDay("17").find((d) => d.from === 15);
  if (!d4 || d4.to !== 1) failures.push({ name: "dropoff-4", got: d4 });
  if (!d15 || d15.to !== 21) failures.push({ name: "dropoff-15", got: d15 });

  /* קו 23 ללא יעד מאומת */
  const r23 = resolveSelection("17", "23", "unverified");
  if (r23.status !== "ready" || r23.option.to !== 3 || r23.option.directionLabel !== null) {
    failures.push({ name: "line-23-no-fake-dest", got: r23.option });
  }

  /* הפרדה 2 vs 2א */
  if (normalizeLine("2 א") !== "2א") failures.push({ name: "normalize-2a" });
  if (normalizeLine("2") === normalizeLine("2א")) failures.push({ name: "2-vs-2a" });

  return failures;
}

export { DAYS, CHANGES, BASELINE, QUICK_LINES, META, DAY_BY_ID };

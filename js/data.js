/**
 * מקור נתונים מרכזי לשינויי סככות בתחנה המרכזית בבאר שבע
 * 16–18.11.2026 | מקורות: הודעת דן/עירייה + תרשימי הסככות
 *
 * עקרון: מזהה משולב של קו + כיוון. מספר קו לבדו אינו מספיק.
 * אין להשלים יעדים או סככות בהשערה.
 */

export const META = {
  workStart: "2026-11-16",
  workEnd: "2026-11-18",
  hoursNote:
    "העבודות מתוכננות בין השעות 09:00–17:00. שעת הסיום היא סיום העבודות היומי המתוכנן, ולא אישור מפורש להחזרת כל הסככות.",
  hoursShort: "09:00–17:00",
  siteName: "br7tnuaupdate",
  siteTitle: "שינויים זמניים בסככות התחנה המרכזית",
  brandTag: "מידע לציבור | התחנה המרכזית",
};

/** ימי העבודות */
export const DAYS = [
  {
    id: "16",
    iso: "2026-11-16",
    weekdayHe: "יום שני",
    shortDate: "16.11",
    buttonLabel: "יום שני 16.11",
    closedPlatforms: [1, 2, 3],
    alternatePlatforms: [4, 6, 8],
    closedBayLabels: ["מפרץ 1"],
    note: "מפרץ 1 הצמוד למסילת הרכבת נסגר. סככות 1, 2 ו-3 מושפעים.",
  },
  {
    id: "17",
    iso: "2026-11-17",
    weekdayHe: "יום שלישי",
    shortDate: "17.11",
    buttonLabel: "יום שלישי 17.11",
    closedPlatforms: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    alternatePlatforms: [1, 2, 3, 17, 18, 19, 20, 21],
    closedBayLabels: ["מפרץ 2", "מפרץ 3"],
    note: "מפרץ 1 נפתח מחדש ומפרצים 2 ו-3 נסגרים. סככות 4–15 מושפעים.",
  },
  {
    id: "18",
    iso: "2026-11-18",
    weekdayHe: "יום רביעי",
    shortDate: "18.11",
    buttonLabel: "יום רביעי 18.11",
    closedPlatforms: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    alternatePlatforms: [1, 2, 3, 17, 18, 19, 20, 21],
    closedBayLabels: ["מפרץ 2", "מפרץ 3"],
    note: "אותם שינויים כמו ביום שלישי 17.11. מפרצים 2 ו-3 סגורים; סככות 4–15 מושפעים.",
  },
];

export const DAY_BY_ID = Object.fromEntries(DAYS.map((d) => [d.id, d]));
export const ISO_TO_DAY = Object.fromEntries(DAYS.map((d) => [d.iso, d.id]));

/**
 * שינויים זמניים — כל רשומה היא קו+כיוון (או הורדה) ליום/ימים.
 * directionLabel=null כשיעד לא מאומת (סתירת מקורות).
 */
export const CHANGES = [
  /* ——— יום שני 16.11 ——— */
  {
    id: "16-drop-1",
    days: ["16"],
    kind: "dropoff",
    line: null,
    directionId: "dropoff",
    directionLabel: null,
    from: 1,
    to: 4,
    summary: "הורדה בלבד",
    keywords: ["הורדה", "ירידה"],
  },
  {
    id: "16-11-turner",
    days: ["16"],
    kind: "boarding",
    line: "11",
    directionId: "turner",
    directionLabel: "אצטדיון טרנר",
    from: 2,
    to: 6,
    keywords: ["טרנר", "אצטדיון"],
  },
  {
    id: "16-13-big",
    days: ["16"],
    kind: "boarding",
    line: "13",
    directionId: "big",
    directionLabel: "ביג",
    from: 2,
    to: 6,
    keywords: ["ביג", "big"],
  },
  {
    id: "16-24-ramot",
    days: ["16"],
    kind: "boarding",
    line: "24",
    directionId: "ramot",
    directionLabel: "רמות",
    from: 3,
    to: 8,
    keywords: ["רמות"],
  },
  {
    id: "16-34-ramot",
    days: ["16"],
    kind: "boarding",
    line: "34",
    directionId: "ramot",
    directionLabel: "רמות",
    from: 3,
    to: 8,
    keywords: ["רמות"],
  },

  /* ——— ימים שלישי–רביעי 17–18.11 ——— */
  {
    id: "1718-drop-4",
    days: ["17", "18"],
    kind: "dropoff",
    line: null,
    directionId: "dropoff",
    directionLabel: null,
    from: 4,
    to: 1,
    summary: "הורדה",
    keywords: ["הורדה", "ירידה"],
  },
  {
    id: "1718-33-ya",
    days: ["17", "18"],
    kind: "boarding",
    line: "33",
    directionId: "terminal-ya",
    directionLabel: "מסוף י״א",
    from: 5,
    to: 2,
    keywords: ["מסוף", "יא", "י״א", "י\"א"],
  },
  {
    id: "1718-32a-ya",
    days: ["17", "18"],
    kind: "boarding",
    line: "32א",
    directionId: "terminal-ya",
    directionLabel: "מסוף י״א",
    from: 5,
    to: 2,
    keywords: ["מסוף", "יא", "י״א", "י\"א", "32a", "32 א"],
  },
  /* לפי התרשים: סככה 6 = קו 8 לטרנר; סככה 7 = קו 7 לטרנר */
  {
    id: "1718-8-turner",
    days: ["17", "18"],
    kind: "boarding",
    line: "8",
    directionId: "turner",
    directionLabel: "אצטדיון טרנר",
    from: 6,
    to: 2,
    keywords: ["טרנר", "אצטדיון"],
  },
  {
    id: "1718-7-turner",
    days: ["17", "18"],
    kind: "boarding",
    line: "7",
    directionId: "turner",
    directionLabel: "אצטדיון טרנר",
    from: 7,
    to: 2,
    keywords: ["טרנר", "אצטדיון"],
  },
  {
    id: "1718-4-ramot",
    days: ["17", "18"],
    kind: "boarding",
    line: "4",
    directionId: "ramot",
    directionLabel: "רמות",
    from: 8,
    to: 3,
    keywords: ["רמות"],
  },
  {
    id: "1718-4a-ramot",
    days: ["17", "18"],
    kind: "boarding",
    line: "4א",
    directionId: "ramot",
    directionLabel: "רמות",
    from: 8,
    to: 3,
    keywords: ["רמות", "4a", "4 א"],
  },
  /* סתירה: המסמך כותב "לרמות", המפה מציינת "פארק ההייטק" — ללא יעד חד-משמעי */
  {
    id: "1718-23",
    days: ["17", "18"],
    kind: "boarding",
    line: "23",
    directionId: "unverified",
    directionLabel: null,
    directionNote:
      "קיימת אי-התאמה בין נוסח המסמך (\"לרמות\") לבין המפה (\"פארק ההייטק\"). מוצגת הסככה החלופית בלבד, בלי יעד לא מאומת.",
    from: 8,
    to: 3,
    keywords: ["23"],
  },
  {
    id: "1718-2-ramot",
    days: ["17", "18"],
    kind: "boarding",
    line: "2",
    directionId: "ramot",
    directionLabel: "רמות",
    from: 9,
    to: 3,
    keywords: ["רמות"],
  },
  {
    id: "1718-2a-ramot",
    days: ["17", "18"],
    kind: "boarding",
    line: "2א",
    directionId: "ramot",
    directionLabel: "רמות",
    from: 9,
    to: 3,
    keywords: ["רמות", "2a", "2 א"],
  },
  {
    id: "1718-5-north",
    days: ["17", "18"],
    kind: "boarding",
    line: "5",
    directionId: "north-train",
    directionLabel: "רכבת צפון",
    from: 9,
    to: 3,
    keywords: ["רכבת", "צפון", "ביש צפון", "ב״ש צפון"],
  },
  /* לפי התרשים: סככה 10 = קו 7 לחצרים; סככה 11 = קו 5 לחצרים */
  {
    id: "1718-7-hatzerim",
    days: ["17", "18"],
    kind: "boarding",
    line: "7",
    directionId: "hatzerim",
    directionLabel: "חצרים",
    from: 10,
    to: 17,
    keywords: ["חצרים"],
  },
  {
    id: "1718-5-hatzerim",
    days: ["17", "18"],
    kind: "boarding",
    line: "5",
    directionId: "hatzerim",
    directionLabel: "חצרים",
    from: 11,
    to: 17,
    keywords: ["חצרים"],
  },
  {
    id: "1718-2-beka",
    days: ["17", "18"],
    kind: "boarding",
    line: "2",
    directionId: "nahal-beka",
    directionLabel: "נחל בקע",
    from: 12,
    to: 18,
    keywords: ["נחל", "בקע", "נחל בקע"],
  },
  {
    id: "1718-2a-beka",
    days: ["17", "18"],
    kind: "boarding",
    line: "2א",
    directionId: "nahal-beka",
    directionLabel: "נחל בקע",
    from: 12,
    to: 18,
    keywords: ["נחל", "בקע", "נחל בקע", "2a", "2 א"],
  },
  {
    id: "1718-13-hatzerim",
    days: ["17", "18"],
    kind: "boarding",
    line: "13",
    directionId: "hatzerim-terminal",
    directionLabel: "מסוף חצרים",
    from: 13,
    to: 19,
    keywords: ["חצרים", "מסוף חצרים"],
  },
  {
    id: "1718-8-ya",
    days: ["17", "18"],
    kind: "boarding",
    line: "8",
    directionId: "terminal-ya",
    directionLabel: "מסוף י״א",
    from: 14,
    to: 20,
    keywords: ["מסוף", "יא", "י״א", "י\"א"],
  },
  {
    id: "1718-drop-15",
    days: ["17", "18"],
    kind: "dropoff",
    line: null,
    directionId: "dropoff",
    directionLabel: null,
    from: 15,
    to: 21,
    summary: "הורדה",
    keywords: ["הורדה", "ירידה"],
  },
];

/**
 * סככות רגילות מאומתות מתרשים המקור (תוויות על הסככות).
 * משמשים כשביום מסוים אין שינוי לקו+כיוון, והסככה המקורית פתוחה.
 */
export const BASELINE = [
  { line: "11", directionId: "turner", directionLabel: "אצטדיון טרנר", platform: 2, keywords: ["טרנר", "אצטדיון"] },
  { line: "13", directionId: "big", directionLabel: "ביג", platform: 2, keywords: ["ביג", "big"] },
  { line: "24", directionId: "ramot", directionLabel: "רמות", platform: 3, keywords: ["רמות"] },
  { line: "34", directionId: "ramot", directionLabel: "רמות", platform: 3, keywords: ["רמות"] },
  { line: "33", directionId: "terminal-ya", directionLabel: "מסוף י״א", platform: 5, keywords: ["מסוף", "יא"] },
  { line: "32א", directionId: "terminal-ya", directionLabel: "מסוף י״א", platform: 5, keywords: ["מסוף", "יא"] },
  { line: "8", directionId: "turner", directionLabel: "אצטדיון טרנר", platform: 6, keywords: ["טרנר"] },
  { line: "7", directionId: "turner", directionLabel: "אצטדיון טרנר", platform: 7, keywords: ["טרנר"] },
  { line: "4", directionId: "ramot", directionLabel: "רמות", platform: 8, keywords: ["רמות"] },
  { line: "4א", directionId: "ramot", directionLabel: "רמות", platform: 8, keywords: ["רמות"] },
  { line: "23", directionId: "unverified", directionLabel: null, platform: 8, keywords: ["23"], note: "במפה: פארק ההייטק; במסמך: לרמות — יעד לא מאומת." },
  { line: "2", directionId: "ramot", directionLabel: "רמות", platform: 9, keywords: ["רמות"] },
  { line: "2א", directionId: "ramot", directionLabel: "רמות", platform: 9, keywords: ["רמות"] },
  { line: "5", directionId: "north-train", directionLabel: "רכבת צפון", platform: 9, keywords: ["רכבת", "צפון"] },
  { line: "7", directionId: "hatzerim", directionLabel: "חצרים", platform: 10, keywords: ["חצרים"] },
  { line: "5", directionId: "hatzerim", directionLabel: "חצרים", platform: 11, keywords: ["חצרים"] },
  { line: "2", directionId: "nahal-beka", directionLabel: "נחל בקע", platform: 12, keywords: ["נחל", "בקע"] },
  { line: "2א", directionId: "nahal-beka", directionLabel: "נחל בקע", platform: 12, keywords: ["נחל", "בקע"] },
  { line: "13", directionId: "hatzerim-terminal", directionLabel: "מסוף חצרים", platform: 13, keywords: ["חצרים"] },
  { line: "8", directionId: "terminal-ya", directionLabel: "מסוף י״א", platform: 14, keywords: ["מסוף", "יא"] },
];

/** תוויות סככות מתרשים המקור (להצגה במפה) */
export const PLATFORM_LABELS = {
  1: { title: "הורדה", lines: "9, 6, 3, 24, 12, 34", drop: true },
  2: { title: null, lines: "11 טרנר · 13 ביג", drop: false },
  3: { title: "רמות", lines: "24, 34", drop: false },
  4: { title: "הורדה", lines: "18, 18א, 32, 22", drop: true },
  5: { title: "מסוף י״א", lines: "33, 32א", drop: false },
  6: { title: "אצטדיון טרנר", lines: "8", drop: false },
  7: { title: "אצטדיון טרנר", lines: "7", drop: false },
  8: { title: null, lines: "4, 4א רמות · 23", drop: false },
  9: { title: null, lines: "2, 2א רמות · 5 רכבת צפון", drop: false },
  10: { title: "מסוף חצרים", lines: "7", drop: false },
  11: { title: "מסוף חצרים", lines: "5", drop: false },
  12: { title: "נחל בקע", lines: "2, 2א", drop: false },
  13: { title: "מסוף חצרים", lines: "13", drop: false },
  14: { title: "מסוף י״א", lines: "8", drop: false },
  15: { title: "הורדה", lines: "11, 23", drop: true },
  16: { title: "מסוף י״א", lines: "9, 9א", drop: false },
  17: { title: "הורדה", lines: "9א", drop: true },
  18: { title: "אצטדיון טרנר", lines: "3", drop: false },
  19: { title: "חניון רכב כבד", lines: "32, 32א", drop: false },
  20: { title: null, lines: "27 הפארק · 27א עמק שרה", drop: false },
  21: { title: "חניון רכב כבד", lines: "33", drop: false },
  22: { title: null, lines: "12, 12א טרנר", drop: false },
  23: { title: "הורדה", lines: "12א", drop: true },
  24: { title: "מסוף י״א", lines: "6", drop: false },
  25: { title: null, lines: "18, 18א מסוף י״א · 22 טרנר", drop: false },
  26: { title: null, lines: "4 טרנר · 4א מדבריום", drop: false },
  27: { title: "מכללת חיל האוויר", lines: "27, 27א", drop: false },
};

/**
 * גיאומטריית המפה — מימין לשמאל, מלמעלה למטה בכל טור:
 * 3,2,1 | 9–4 | 15–10 | 21–16 | 27–22
 * קואורדינטות מבוססות על תרשימי דן (פי 2).
 */
export const MAP_LAYOUT = {
  27: [76, 58, 126, 208],
  26: [76, 296, 126, 210],
  25: [76, 536, 126, 210],
  24: [76, 776, 126, 210],
  23: [76, 1016, 126, 210],
  22: [76, 1256, 126, 210],
  21: [260, 58, 118, 208],
  20: [260, 296, 118, 210],
  19: [260, 536, 118, 210],
  18: [260, 776, 118, 210],
  17: [260, 1016, 118, 210],
  16: [260, 1256, 118, 210],
  15: [418, 58, 116, 208],
  14: [418, 296, 116, 210],
  13: [418, 536, 116, 210],
  12: [418, 776, 116, 210],
  11: [418, 1016, 116, 210],
  10: [418, 1256, 116, 210],
  9: [652, 58, 156, 208],
  8: [652, 296, 156, 210],
  7: [652, 536, 156, 210],
  6: [652, 776, 156, 210],
  5: [652, 1016, 156, 210],
  4: [652, 1256, 156, 210],
  3: [842, 236, 118, 210],
  2: [842, 716, 118, 210],
  1: [842, 1196, 118, 208],
};

export const MAP_TRAFFIC = [
  { x: 228, y1: 222, y2: 1456 },
  { x: 396, y1: 226, y2: 1456 },
  { x: 568, y1: 220, y2: 1456 },
  { x: 632, y1: 1456, y2: 220 },
  { x: 824, y1: 1456, y2: 214 },
];

export const MAP_VIEWBOX = { w: 1018, h: 1540 };

/** קווים לבחירה מהירה (מספרי קו ייחודיים שמופיעים בשינויים) */
export const QUICK_LINES = ["2", "2א", "4", "4א", "5", "7", "8", "11", "13", "23", "24", "32א", "33", "34"];

export const DATA_NOTES = [
  {
    id: "line-23-destination",
    text: "קו 23: אי-התאמה בין נוסח המסמך (\"לרמות\") לבין המפה (\"פארק ההייטק\"). מוצג סככה חלופית 3 בלי יעד חד-משמעי.",
  },
  {
    id: "hours-not-restore",
    text: "שעת 17:00 היא סיום העבודות היומי המתוכנן, ולא אישור מפורש להחזרת כל הסככות למיקומן הרגיל.",
  },
];

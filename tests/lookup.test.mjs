import { runMandatoryTests, resolveSelection, dropoffsForDay, normalizeLine, search } from "../js/engine.js";

const failures = runMandatoryTests();

const extras = [];

function assert(cond, name, detail) {
  if (!cond) extras.push({ name, detail });
}

/* חיפושים */
assert(normalizeLine("2 א") === "2א", "norm-2-space-a");
assert(normalizeLine("4א") === "4א", "norm-4a");
assert(normalizeLine("32א") === "32א", "norm-32a");
assert(normalizeLine("2") !== normalizeLine("2א"), "2-ne-2a");

const sTurner = search("17", "טרנר");
assert(sTurner.type === "matches" || sTurner.type === "line", "search-turner-type", sTurner);
if (sTurner.items || sTurner.options) {
  const items = sTurner.items || sTurner.options;
  assert(items.some((i) => i.line === "8" && i.to === 2), "search-turner-includes-8", items);
}

const r13 = resolveSelection("17", "13", null);
assert(r13.status === "need-direction", "13-needs-direction", r13);
assert(r13.options.length >= 2, "13-has-two-dirs", r13.options);

const drops = dropoffsForDay("17");
assert(drops.length === 2, "two-dropoffs-17", drops);
assert(drops.some((d) => d.from === 4 && d.to === 1), "drop-4-to-1");
assert(drops.some((d) => d.from === 15 && d.to === 21), "drop-15-to-21");

const all = [...failures, ...extras];
if (all.length) {
  console.error("FAILED", all);
  process.exit(1);
}
console.log("OK — כל בדיקות התקינות עברו (" + (14 + 4 + extras.length) + "+ מקרי בדיקה).");
process.exit(0);

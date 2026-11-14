/* Regenerates docs/TRACEABILITY.md from docs/manual-test-cases.json and the
   [UI-xxx] titles in src/specs. Optionally merges the latest run status from a
   Playwright JSON report: node scripts/generate-traceability.mjs [results.json] */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(readFileSync(join(root, "docs/manual-test-cases.json"), "utf8")).cases;

const specDir = join(root, "src/specs");
const testFor = new Map();
for (const file of readdirSync(specDir)) {
  const text = readFileSync(join(specDir, file), "utf8");
  for (const match of text.matchAll(/\[UI-(\d{3})\]/g)) testFor.set(`UI-${match[1]}`, `src/specs/${file}`);
}

let results = null;
if (process.argv[2]) {
  const raw = JSON.parse(readFileSync(process.argv[2], "utf8"));
  results = new Map();
  for (const spec of raw.suites ?? []) {
    for (const suite of spec.suites ?? []) {
      for (const t of suite.specs ?? []) {
        const m = /\[UI-(\d{3})\]/.exec(t.title);
        if (!m) continue;
        for (const p of t.tests ?? []) {
          const project = p.projectName ?? "";
          const outcome = p.results?.at(-1)?.status ?? "unknown";
          if (!results.has(`UI-${m[1]}`)) results.set(`UI-${m[1]}`, {});
          results.get(`UI-${m[1]}`)[project] = outcome;
        }
      }
    }
  }
}

const lines = [
  "# Traceability: manual cases to automated tests",
  "",
  "Each row is one manual UI case from `docs/manual-test-cases.json`",
  "(sheet `Test case UI` of `sphere-ui-test-cases.xlsx`). The test title",
  "carries the case ID; the report annotations carry priority and trace.",
  "",
  "| ID | Manual case | Priority | Automated test |",
  "| --- | --- | --- | --- |",
];
for (const c of cases) {
  const testFile = testFor.get(c.id) ?? "**not implemented**";
  let status = "";
  if (results?.has(c.id)) {
    const byProject = results.get(c.id);
    status = " (" + Object.entries(byProject).map(([p, s]) => `${p}: ${s}`).join(", ") + ")";
  }
  lines.push(`| ${c.id} | ${c.name} | ${c.priority} | \`${testFile}\`${status} |`);
}
lines.push("");

if (results) {
  const counts = {};
  for (const byProject of results.values()) for (const s of Object.values(byProject)) counts[s] = (counts[s] ?? 0) + 1;
  lines.push(`Run outcomes across both projects: ${JSON.stringify(counts)}`, "");
}

writeFileSync(join(root, "docs/TRACEABILITY.md"), lines.join("\n"), "utf8");
console.log(`wrote docs/TRACEABILITY.md with ${cases.length} cases, ${testFor.size} mapped to tests`);

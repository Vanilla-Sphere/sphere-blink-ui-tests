// Turns the JSON report of a CI run (test-results/results.json, written by the
// reporter in playwright.config.ts) into what GitHub shows on the run page:
// a summary table, one error annotation per failed test, and the counts as
// outputs of the action. It only reports; the step that ran the tests has
// already decided whether the job passes.
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const REPORT = "test-results/results.json";
const site = process.env.BASE_URL ?? "";
const out = (file, text) => { if (file) appendFileSync(file, text); else process.stdout.write(text); };
const summary = (text) => out(process.env.GITHUB_STEP_SUMMARY, text + "\n");
const clean = (text) => String(text ?? "").replace(/\u001b\[[0-9;]*m/g, "");
// One line of a workflow command: GitHub reads %, CR and LF as these escapes.
const escape = (text) => clean(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

if (!existsSync(REPORT)) {
  summary(`## UI tests\n\nNo report was written: the run stopped before the first test (site: ${site}).`);
  console.log("::error title=UI tests::No report was written: the run stopped before the first test.");
  process.exit(0);
}

const report = JSON.parse(readFileSync(REPORT, "utf8"));
const counts = new Map();   // project -> {passed, failed, flaky, skipped}
const failures = [];
const count = (project) => {
  if (!counts.has(project)) counts.set(project, { passed: 0, failed: 0, flaky: 0, skipped: 0 });
  return counts.get(project);
};
const walk = (suite) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const c = count(test.projectName || "default");
      if (test.status === "expected") c.passed++;
      else if (test.status === "skipped") c.skipped++;
      else if (test.status === "flaky") c.flaky++;
      else {
        c.failed++;
        const last = (test.results ?? []).at(-1) ?? {};
        const message = clean(last.error?.message ?? last.errors?.[0]?.message ?? last.status ?? "failed");
        failures.push({ project: test.projectName, title: spec.title, file: spec.file, line: spec.line, message });
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child);
};
for (const suite of report.suites ?? []) walk(suite);

const total = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
for (const c of counts.values()) for (const key of Object.keys(total)) total[key] += c[key];
// Errors outside any test (a broken config, a spec that does not load).
const globalErrors = (report.errors ?? []).map((e) => clean(e.message ?? e));

const lines = [
  `## UI tests: ${total.failed || globalErrors.length ? "failed" : "passed"}`,
  "",
  `Site under test: ${site}`,
  "",
  "| Project | Passed | Failed | Flaky | Skipped |",
  "| --- | --- | --- | --- | --- |",
  ...[...counts].map(([project, c]) => `| ${project} | ${c.passed} | ${c.failed} | ${c.flaky} | ${c.skipped} |`),
  `| **total** | **${total.passed}** | **${total.failed}** | **${total.flaky}** | **${total.skipped}** |`,
];
if (failures.length) {
  lines.push("", "### Failed tests", "", "| Project | Test | Why |", "| --- | --- | --- |");
  for (const f of failures) {
    const why = f.message.split("\n").map((s) => s.trim()).filter(Boolean)[0] ?? "";
    lines.push(`| ${f.project} | ${f.title.replace(/\|/g, "\\|")} | ${why.slice(0, 300).replace(/\|/g, "\\|")} |`);
  }
}
if (globalErrors.length) lines.push("", "### Errors outside the tests", "", ...globalErrors.map((e) => "- " + e.split("\n")[0]));
lines.push("", "The HTML report, the JSON results and the traces of failed tests are in the artifact of this run.");
summary(lines.join("\n"));

for (const f of failures) {
  console.log(`::error title=${escape(`[${f.project}] ${f.title}`)}::${escape(f.message.slice(0, 1500))}`);
}
for (const e of globalErrors) console.log(`::error title=UI tests::${escape(e.slice(0, 1500))}`);
for (const key of ["passed", "failed", "skipped"]) out(process.env.GITHUB_OUTPUT, `${key}=${total[key]}\n`);
console.log(`passed ${total.passed}, failed ${total.failed}, flaky ${total.flaky}, skipped ${total.skipped}`);

"use strict";

const assert = require("assert");
const path = require("path");
const { buildReport, loadTasks, renderHtml } = require("./release_checklist");

const sample = path.join(__dirname, "sample_tasks.json");
const tasks = loadTasks(sample);
assert.strictEqual(tasks.length, 4);
assert.strictEqual(tasks[0].area, "frontend");

const report = buildReport(tasks, new Date("2026-10-21T00:00:00Z"));
assert.strictEqual(report.total_tasks, 4);
assert.strictEqual(report.open_tasks, 3);
assert.strictEqual(report.release_risks, 2);
assert.strictEqual(report.missing_owners, 1);
assert.strictEqual(report.by_area.backend.risks, 1);

const html = renderHtml(report);
for (const text of ["Area", "Owner", "Status", "Days late", "Release risk"]) {
  assert.ok(html.includes(text), `missing ${text}`);
}
console.log("3 tests passed");

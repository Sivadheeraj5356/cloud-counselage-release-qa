#!/usr/bin/env node
"use strict";

const fs = require("fs");

const AREAS = ["frontend", "backend", "api", "docs"];

function loadTasks(path) {
  const rows = JSON.parse(fs.readFileSync(path, "utf8"));
  if (!Array.isArray(rows)) throw new Error("task file must contain a JSON array");
  return rows.map((row, index) => {
    for (const field of ["id", "title", "area", "owner", "status", "due"]) {
      if (!(field in row)) throw new Error(`row ${index + 1}: missing ${field}`);
    }
    if (!AREAS.includes(row.area)) throw new Error(`row ${index + 1}: unknown area ${row.area}`);
    return row;
  });
}

function buildReport(tasks, today = new Date()) {
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const items = tasks.map((task) => {
    const dueTime = Date.parse(`${task.due}T00:00:00Z`);
    if (Number.isNaN(dueTime)) throw new Error(`${task.id}: invalid due date`);
    const daysLate = Math.max(0, Math.floor((todayUtc - dueTime) / 86400000));
    const open = task.status !== "done";
    return {
      ...task,
      open,
      days_late: daysLate,
      release_risk: Boolean(open && (task.blocks_release || daysLate > 0)),
    };
  });
  const byArea = Object.fromEntries(AREAS.map((area) => [area, { total: 0, open: 0, risks: 0 }]));
  for (const item of items) {
    byArea[item.area].total += 1;
    byArea[item.area].open += item.open ? 1 : 0;
    byArea[item.area].risks += item.release_risk ? 1 : 0;
  }
  return {
    generated_at: today.toISOString(),
    total_tasks: items.length,
    open_tasks: items.filter((item) => item.open).length,
    release_risks: items.filter((item) => item.release_risk).length,
    missing_owners: items.filter((item) => !String(item.owner).trim()).length,
    by_area: byArea,
    items,
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function renderHtml(report) {
  const rows = report.items.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td>${escapeHtml(item.area)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.owner)}</td><td>${escapeHtml(item.status)}</td><td>${item.days_late}</td><td>${item.release_risk ? "yes" : "no"}</td></tr>`).join("");
  return `<!doctype html><meta charset="utf-8"><title>Release checklist QA</title><style>body{font-family:Inter,system-ui;margin:40px;color:#1a211f}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #dce5e1;padding:10px;text-align:left}th{background:#edf6f1}</style><h1>Full-stack release checklist</h1><p>${report.open_tasks} open tasks • ${report.release_risks} release risks • ${report.missing_owners} missing owners</p><table><tr><th>ID</th><th>Area</th><th>Task</th><th>Owner</th><th>Status</th><th>Days late</th><th>Release risk</th></tr>${rows}</table>`;
}

function main() {
  const [input, jsonOut = "release-report.json", htmlOut = "release-report.html"] = process.argv.slice(2);
  if (!input) throw new Error("usage: node release_checklist.js tasks.json [report.json] [report.html]");
  const report = buildReport(loadTasks(input));
  fs.writeFileSync(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(htmlOut, `${renderHtml(report)}\n`);
  console.log(`checked ${report.total_tasks} tasks; ${report.release_risks} release risks`);
}

if (require.main === module) main();
module.exports = { buildReport, loadTasks, renderHtml };

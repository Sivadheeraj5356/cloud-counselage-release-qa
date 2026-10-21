# Cloud Counselage Full-Stack Release QA

JavaScript proof-of-work for a full-stack internship application. The tool checks a Cloud Counselage-style website release plan for open frontend/backend/API work, overdue launch blockers and missing owners, then writes JSON and HTML reports.

## Run

```bash
node test.js
node release_checklist.js sample_tasks.json
```

Outputs:

- `release-report.json` for pipeline checks
- `release-report.html` for human review

The JSON fixture is representative sample data only, not production work or a claimed Cloud Counselage metric.

# Opportunity workspace

The lead page supports Review → Pursue → Outreach → Follow-up → Proposal. Active, follow-up, and proposal queues overlap intentionally. Response deadlines are separate from the next follow-up date. Creating a Gmail draft never records a message as sent.

Removal is recoverable, available individually or for up to 100 selected leads, and preserves stage, activity, and linked records. Removed radar identities remain suppressed on subsequent imports. Restore returns the prior stage.

## Integration verification

- Full website CI: 714 tests passed. The 17 opt-in PostgreSQL tests also passed against disposable local databases.
- Database tests cover removal atomicity, conflicting edits, activity replay, radar suppression, proposal contact locking, project lifecycle changes, queue deduplication, cache expiry, and obsolete worker leases.
- Chrome fixture journey covers pursuit, drafts, recorded outreach, proposal planning, removal/undo, and project creation. Mobile viewport has no horizontal overflow. No production leads or Gmail drafts were created for these checks.
- Claude Max adversarial reviews covered UI/API transitions, Gmail/conversion boundaries, database/authentication, subscription queue/worker, and radar ingestion/enrichment/delivery. Findings produced concurrency, SQL, retry, contact-validation, and selection-recovery fixes.

## Subscription operation

CRM advice and draft text use the installed local Claude Code subscription worker. Each invocation checks native subscription authentication and same-process metadata proving no API key, tools, or MCP servers. The website retains transient jobs for one day. There is no paid API fallback in these paths.

The Mac must be awake and the native subscription session valid. The worker starts at login and resumes after sleep; the UI explains offline/authentication/usage-limit failures. Radar source retrieval stays on GitHub; the separate local radar runner performs subscription enrichment and CRM publication.

See `scripts/claude-subscription-worker.md` for installation and recovery.

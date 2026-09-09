# Claude subscription worker

CRM advice and outreach text use Marston’s native Claude Code subscription. The website queues a bounded record in Neon; the Mac claims it and returns the text. Gmail draft creation remains in the authenticated website route. Nothing is sent by the worker.

Sign in once with Anthropic’s own flow:

```sh
env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN claude auth login --claudeai
```

Apply database migration `010_admin_ai_jobs` before starting the worker. The local `.env.local` must provide `DATABASE_URL`; no Claude API key is needed.

Review and install the user LaunchAgent:

```sh
bash scripts/install-claude-subscription-worker.sh --print
bash scripts/install-claude-subscription-worker.sh --install
```

The worker starts at login and resumes when the Mac wakes. If the Mac is offline, subscription authentication expires, or usage is exhausted, the CRM reports that state and keeps the original question available for retry. It never falls back to the paid API. Subscription billing follows the account’s plan and usage-credit settings.

Each job checks the active authentication method and verifies its own stream reports no API key, tools, or MCP servers. Claude receives a strict environment allowlist, an empty temporary working directory, and no hooks, skills, project settings, database credentials, or Gmail credentials. Native OAuth credentials stay with Claude Code. Claims expire after three minutes and may recover once; normal errors require an explicit retry. Identical requests share a job. The running worker deletes private inputs and results older than 24 hours.

Logs contain only generic status/error codes under `~/Library/Logs/AetherisVision/claude-subscription.log`.

Sources: [Claude authentication](https://code.claude.com/docs/en/authentication), [Subscription and noninteractive usage](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan).

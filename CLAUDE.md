# CodeArcheology — CLAUDE.md

Project context and conventions for Claude Code sessions.

## What this project is

CodeArcheology is a full-stack web app that takes legacy source code (pasted or imported from GitHub) and turns it into:
- A plain-English business summary and business rules
- A Mermaid logic flow diagram
- Red zone risk identification
- Modernization suggestions
- Jira-ready sprint tickets (generated on demand, grouped by type)

## Repository layout

```
CodeArcheology/
├── codearcheology-backend/   # Node.js/Express API (ESM)
│   ├── server.js             # All API routes
│   ├── jira.mjs              # Jira Cloud REST API client
│   ├── constants.mjs         # Non-secret Jira config (base URL, email, project key)
│   └── .env                  # ANTHROPIC_API_KEY + JIRA_API_TOKEN (gitignored)
├── codearcheology-frontend/  # React 19 + Vite
│   └── src/
│       ├── App.jsx           # Single-page app, all UI
│       └── App.css           # All styles
├── start.sh                  # Starts both backend (port 4000) and frontend (Vite)
└── stop.sh                   # Kills both processes
```

## Running locally

```bash
./start.sh        # starts backend on :4000 and frontend on :5173
./stop.sh         # stops both
```

Or manually:
```bash
cd codearcheology-backend && npm start    # port 4000
cd codearcheology-frontend && npm run dev # port 5173
```

## Environment variables

**`codearcheology-backend/.env`** (gitignored — never commit):
```
ANTHROPIC_API_KEY=sk-ant-...
JIRA_API_TOKEN=ATATT3x...
```

**`codearcheology-backend/constants.mjs`** (committed — no secrets):
```js
export const JIRA_BASE_URL = "https://rameshbgm.atlassian.net";
export const JIRA_EMAIL = "rameshbgm@gmail.com";
export const JIRA_PROJECT_KEY = "KAN";
```

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/import-github` | Fetch raw file from a GitHub blob URL |
| POST | `/api/analyze` | Run Claude analysis — returns summary, rules, mermaid, redZones |
| POST | `/api/ask` | Follow-up chat question about the analysed code |
| POST | `/api/modernize` | Generate modernization suggestions and migration risks |
| POST | `/api/generate-jira-tickets` | Generate Jira ticket specs via Claude (no auto-push) |
| POST | `/api/jira/push` | Push a ticket array to Jira Cloud |
| GET  | `/api/jira/config` | Check if Jira is configured |
| GET  | `/api/health` | Health check |

## User flow

1. **Ingestion** — paste a GitHub URL and click Import, or click "paste code manually"
2. **Analyze** — Claude analyses the code; results appear below (Dashboard, Ask, Modernization, Jira panels)
3. **Ask Your Code** — conversational follow-up about the codebase
4. **Modernization** — click "Generate Suggestions" to get modernization paths and migration risks
5. **Jira Tickets** — click "Generate Jira Tickets" to produce sprint-ready tickets (Stories + Tasks, grouped by type, expandable rows)

## Key technical decisions

- **ESM throughout** — backend uses `"type": "module"` and `.mjs` extensions for non-entry files
- **Claude model** — `claude-sonnet-4-6` via `@anthropic-ai/sdk`; prompt responses are strict JSON
- **Jira issue types** — KAN project only supports Task/Story/Epic/Subtask; `sanitizeIssueType()` in `jira.mjs` maps everything else to Story or Task
- **Jira token in `.env`** — `JIRA_API_TOKEN` is secret and gitignored; other Jira config lives in `constants.mjs`
- **No auto-Jira** — ticket generation only happens when the user clicks "Generate Jira Tickets"; nothing is pushed without explicit action
- **Mermaid** — rendered client-side via `mermaid` npm package; each diagram gets a unique ID to avoid collision
- **Loading overlays** — full-screen animated overlays for Analyze (purple), Modernize (green), Jira generation (blue) with rotating quotes

## Secret scanning — what happened

A previous commit accidentally included `JIRA_API_TOKEN` hardcoded in `constants.mjs`. GitHub blocked the push. The fix:
1. `git filter-branch` rewrote all history to remove the token
2. `refs/original` backup refs were deleted and `git gc --prune=now` ran
3. Force-pushed clean history
4. Token moved permanently to `.env`

**Never hardcode secrets in `constants.mjs` or any tracked file.**

## Jira project notes

- Project: **KAN** at `https://rameshbgm.atlassian.net`
- Only supported issue types: Task, Story, Epic, Subtask (no "Bug")
- `sanitizeIssueType()` maps: bug→Story, improvement→Task, risk→Story

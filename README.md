# ⛏️ CodeArcheology

> Turn legacy code into business intelligence — powered by **Anthropic Claude** and **Genspark**.

CodeArcheology takes any legacy codebase and excavates what it actually does: the business rules buried in decades-old logic, the risk zones nobody dares touch, and a clear modernization roadmap — all in seconds.

---

## What it does

Paste a GitHub file URL or drop in raw code. CodeArcheology runs it through a multi-stage AI pipeline and gives you:

| Output | Description |
|--------|-------------|
| **Business Summary** | Plain-English explanation of what the code does, written for stakeholders |
| **Business Rules** | Numbered list of every decision, validation, and conditional path |
| **Logic Diagram** | Auto-generated Mermaid flowchart of the execution flow |
| **Red Zones** | Risk-rated hotspots — hardcoded values, tight coupling, audit gaps |
| **Modernization Path** | Concrete suggestions and migration risks for a safe rewrite |
| **Jira Sprint Tickets** | Ready-to-push Stories and Tasks, grouped by type with acceptance criteria |

---

## Powered by Anthropic Claude

All analysis, reasoning, and ticket generation runs on **[Claude](https://www.anthropic.com/claude)** — Anthropic's frontier AI model.

Claude is used for three distinct reasoning tasks inside CodeArcheology:

### 1. Code Archaeology
Claude reads the raw legacy code and extracts the underlying business intent — not what the code *is*, but what it *does* and *why*. It ignores noise (boilerplate, logging, formatting) and focuses on decision points, validation logic, and downstream consequences.

Model: `claude-sonnet-4-6` via the [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-python)

### 2. Modernization Planning
Claude analyses the extracted business rules and red zones, then produces a prioritised modernization roadmap — what to decouple, what to externalise, what to rewrite, and what migration risks to watch for.

### 3. Jira Ticket Generation
Claude acts as a Jira project manager: it maps each red zone to a Story ticket and each modernization suggestion to a Task ticket, writing precise descriptions and three testable acceptance criteria per ticket — ready for sprint planning.

```
Legacy Code
    │
    ▼
Claude (Analysis)  →  Summary + Rules + Diagram + Red Zones
    │
    ▼
Claude (Modernize) →  Suggestions + Migration Risks
    │
    ▼
Claude (Tickets)   →  Stories + Tasks with Acceptance Criteria
    │
    ▼
Jira Cloud         →  KAN-1, KAN-2, KAN-3 …
```

---

## Powered by Genspark

**[Genspark](https://www.genspark.ai)** is integrated as the document generation layer. Genspark's agent platform can take the full analysis output — summary, rules, modernization plan, and Jira tickets — and produce a professional HTML/Word-style report suitable for executive review or PDF export.

The `@genspark/cli` package is included in the backend dependencies for this capability.

---

## Tech stack

### Backend
| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API — analysis, modernization, ticket generation |
| `@genspark/cli` | Genspark agent — document generation |
| `express` | REST API server (port 4000) |
| `dotenv` | Environment variable loading |
| `cors` | Cross-origin requests from the frontend |

### Frontend
| Package | Purpose |
|---------|---------|
| `react` 19 | UI framework |
| `vite` | Dev server and bundler |
| `mermaid` | Client-side logic diagram rendering |

### Integrations
- **Anthropic Claude API** — `claude-sonnet-4-6` model
- **Genspark** — AI agent document platform
- **Atlassian Jira Cloud** — REST API v3 with ADF descriptions

---

## Getting started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- (Optional) A [Jira Cloud](https://www.atlassian.com/software/jira) account + API token

### Setup

```bash
git clone https://github.com/charleszhao/CodeArcheology.git
cd CodeArcheology

# Install root dependencies
npm install

# Install backend dependencies
cd codearcheology-backend && npm install

# Install frontend dependencies
cd ../codearcheology-frontend && npm install
```

Create `codearcheology-backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...

# Optional — only needed for Jira ticket pushing
JIRA_API_TOKEN=ATATT3x...
```

### Run

```bash
./start.sh    # starts backend on :4000, frontend on :5173
```

Open [http://localhost:5173](http://localhost:5173).

To stop:
```bash
./stop.sh
```

---

## User flow

```
① Paste a GitHub file URL  →  click Import
           ↓
② Review the imported code  →  click Analyze
           ↓
③ Read the Archaeology Dashboard
   (Summary · Rules · Diagram · Red Zones)
           ↓
④ Ask follow-up questions in the chat
           ↓
⑤ Click "Generate Suggestions"
   (Modernization paths + Migration risks)
           ↓
⑥ Click "Generate Jira Tickets"
   (Stories grouped by type, expandable rows)
```

---

## Security notes

- `ANTHROPIC_API_KEY` and `JIRA_API_TOKEN` live only in `.env` — gitignored, never committed
- Non-secret Jira config (base URL, email, project key) lives in `constants.mjs`
- GitHub push protection is enabled on this repo — any accidental secret commit will be blocked

---

## License

MIT

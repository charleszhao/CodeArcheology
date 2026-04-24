import React, { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import "./App.css";

const ANALYZING_QUOTES = [
  { text: "Asking Claude to read 10,000 lines of Java so you don't have to.", author: "— Anthropic, probably" },
  { text: "Our AI just found a TODO comment from 2003. It says 'fix this later'. Narrator: it was not fixed.", author: "— CodeArcheology" },
  { text: "Anthropic built Claude to be helpful, harmless, and honest. This code is none of those things.", author: "— An honest assessment" },
  { text: "Currently decoding business logic written by someone who left the company in 2008 and can't be reached.", author: "— CodeArcheology" },
  { text: "Claude has now read more legacy code today than a senior dev reads in a calendar year.", author: "— Anthropic Usage Stats" },
  { text: "Did you know? 78% of legacy code comments say 'don't touch this'. Claude touches it anyway.", author: "— CodeArcheology" },
  { text: "Claude is legally required to pretend this COBOL makes sense. Please respect its professionalism.", author: "— Anthropic Legal" },
  { text: "This code has more edge cases than a dodecahedron. Claude is excited. Claude is lying.", author: "— CodeArcheology" },
];

const MODERNIZING_QUOTES = [
  { text: "Mapping your modernization roadmap. ETA: faster than your last sprint planning session.", author: "— CodeArcheology" },
  { text: "Asking Claude to figure out what 'fix this later' means. It's been 20 years. Claude is optimistic.", author: "— Anthropic Support" },
  { text: "Converting spaghetti code into actionable insights. Claude brought a fork.", author: "— CodeArcheology" },
  { text: "Identifying what to kill first. COBOL is sweating.", author: "— CodeArcheology" },
];

const JIRA_QUOTES = [
  { text: "Claude is now creating Jira tickets so precise that developers will actually read them. History is being made.", author: "— Anthropic R&D" },
  { text: "Generating sprint-ready tickets from your legacy analysis. No estimation poker required.", author: "— CodeArcheology" },
  { text: "Claude said 'everything is High priority'. The ticket generator disagreed. A compromise was reached.", author: "— CodeArcheology QA" },
];

function Overlay({ title, icon, quotes, colorClass, progress }) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const quote = quotes[quoteIdx];
  const pct = progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className={`analyzing-overlay ${colorClass || ""}`}>
      <div className="analyzing-bg-grid" />
      <div className="analyzing-center">
        <div className="analyzing-orb">
          <div className="analyzing-orb-ring" />
          <div className="analyzing-orb-ring ring2" />
          <span className="analyzing-icon">{icon}</span>
        </div>
        <h2 className="analyzing-title">{title}</h2>
        <div className="analyzing-dots"><span /><span /><span /></div>

        {progress && progress.total > 0 && (
          <div className="overlay-progress">
            <div className="overlay-progress-track">
              <div className="overlay-progress-bar" style={{ width: `${pct}%` }} />
            </div>
            <p className="overlay-progress-label">
              {progress.current === 0
                ? `Generating ${progress.total} tickets…`
                : `Created ${progress.current} of ${progress.total} tickets`}
            </p>
          </div>
        )}

        <div className={`analyzing-quote-wrap ${visible ? "fade-in" : "fade-out"}`}>
          <p className="analyzing-quote-text">"{quote.text}"</p>
          <p className="analyzing-quote-author">{quote.author}</p>
        </div>
        <div className="analyzing-badges">
          <span className="analyzing-badge">⚡ Powered by Anthropic</span>
          <span className="analyzing-badge">🚀 Genspark</span>
        </div>
      </div>
    </div>
  );
}

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

function MermaidView({ chart }) {
  const ref = useRef(null);
  const id = useMemo(() => `m-${Math.random().toString(36).slice(2, 9)}`, [chart]);

  useEffect(() => {
    let alive = true;
    async function render() {
      if (!chart || !ref.current) return;
      try {
        const { svg } = await mermaid.render(id, chart);
        if (alive && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (ref.current) ref.current.textContent = `Diagram error: ${String(e)}`;
      }
    }
    render();
    return () => { alive = false; };
  }, [chart, id]);

  return <div className="mermaid-box" ref={ref} />;
}

const PRIORITY_COLOR = { High: "high", Medium: "medium", Low: "low" };
const TYPE_ICON = { Story: "📖", Task: "✅", Epic: "⚡", Subtask: "🔹" };
const GROUP_ORDER = ["Epic", "Story", "Task", "Subtask"];

function JiraRow({ ticket, result }) {
  const [open, setOpen] = useState(false);
  const priorityClass = PRIORITY_COLOR[ticket.priority] || "medium";

  return (
    <div className={`jira-row ${open ? "open" : ""}`}>
      <div className="jira-row-main" onClick={() => setOpen((v) => !v)}>
        <span className="jira-row-icon">{TYPE_ICON[ticket.type] || "✅"}</span>

        <div className="jira-row-title-wrap">
          {result ? (
            <a
              className="jira-row-title jira-row-link"
              href={result.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="jira-key">{result.key}</span>
              {ticket.title}
            </a>
          ) : (
            <span className="jira-row-title">{ticket.title}</span>
          )}
        </div>

        <span className={`badge ${priorityClass}`}>{ticket.priority}</span>
        <span className="jira-row-chevron">{open ? "▲" : "▾"}</span>
      </div>

      {open && (
        <div className="jira-row-detail">
          <p className="jira-row-desc">{ticket.description}</p>
          {ticket.acceptanceCriteria?.length > 0 && (
            <>
              <p className="jira-ac-label">Acceptance Criteria</p>
              <ul className="jira-ac-list">
                {ticket.acceptanceCriteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [githubUrl, setGithubUrl] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  const [analysis, setAnalysis] = useState(null);
  const [modernization, setModernization] = useState(null);
  const [jiraTickets, setJiraTickets] = useState([]);
  const [jiraCreated, setJiraCreated] = useState([]);

  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const [error, setError] = useState("");
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingModernize, setLoadingModernize] = useState(false);
  const [loadingJira, setLoadingJira] = useState(false);

  async function importGithub() {
    setError("");
    setLoadingImport(true);
    try {
      const res = await fetch("http://localhost:4000/api/import-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setCode(data.code || "");
      setShowCode(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingImport(false);
    }
  }

  async function analyzeCode() {
    setError("");
    setChatMessages([]);
    setAnalysis(null);
    setModernization(null);
    setJiraTickets([]);
    setJiraCreated([]);
    setLoadingAnalyze(true);
    try {
      const res = await fetch("http://localhost:4000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analyze failed");
      setAnalysis(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function getModernization() {
    setError("");
    setLoadingModernize(true);
    try {
      const res = await fetch("http://localhost:4000/api/modernize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: analysis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Modernization failed");
      setModernization(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingModernize(false);
    }
  }

  async function generateJira() {
    setError("");
    setJiraTickets([]);
    setJiraCreated([]);
    setLoadingJira(true);
    try {
      const res = await fetch("http://localhost:4000/api/generate-jira-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, modernization }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ticket generation failed");
      setJiraTickets(data.tickets || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingJira(false);
    }
  }

  async function askCode() {
    setError("");
    setLoadingAsk(true);
    try {
      if (!question.trim()) throw new Error("Please enter a question.");
      const currentQuestion = question.trim();
      const userMsg = { role: "user", content: currentQuestion };
      const nextHistory = [...chatMessages, userMsg];
      setChatMessages(nextHistory);
      setQuestion("");

      const res = await fetch("http://localhost:4000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentQuestion, context: analysis, history: nextHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ask failed");

      setChatMessages((prev) => [...prev, {
        role: "assistant",
        content: data.answer || "No response",
        structured: {
          affectedAreas: Array.isArray(data.affectedAreas) ? data.affectedAreas : [],
          risk: data.risk || "Medium",
          explanation: data.explanation || "",
        },
      }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAsk(false);
    }
  }

  const createdMap = useMemo(() => {
    const m = {};
    jiraCreated.forEach((r) => { m[r.summary] = r; });
    return m;
  }, [jiraCreated]);

  const jiraGroups = useMemo(() => {
    const map = {};
    jiraTickets.forEach((t) => {
      const type = t.type || "Task";
      if (!map[type]) map[type] = [];
      map[type].push(t);
    });
    return GROUP_ORDER.filter((g) => map[g]).map((g) => ({ type: g, tickets: map[g] }));
  }, [jiraTickets]);

  return (
    <div className="page">
      {loadingAnalyze   && <Overlay title="Excavating your code"       icon="⛏️" quotes={ANALYZING_QUOTES}  />}
      {loadingModernize && <Overlay title="Mapping modernization paths" icon="🗺️" quotes={MODERNIZING_QUOTES} colorClass="modernizing-overlay" />}
      {loadingJira      && <Overlay title="Generating Jira tickets"     icon="🎫" quotes={JIRA_QUOTES}        colorClass="jira-overlay" />}

      <div className="hero">
        <h1 className="hero-title">⛏️ CodeArcheology</h1>
        <p className="hero-sub">
          Turn legacy code into business summaries, logic maps, impact analysis,
          modernization paths, and Jira-ready delivery tickets.
        </p>
      </div>

      {/* ── Ingestion ── */}
      <div className="ingestion-wrap">
        <div className="ingestion-card">
          <label className="field-label">GitHub File URL</label>
          <div className="url-row">
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loadingImport && importGithub()}
              placeholder="https://github.com/org/repo/blob/main/file.java"
            />
            <button className="primary" onClick={importGithub} disabled={loadingImport || !githubUrl.trim()}>
              {loadingImport ? "Importing…" : "Import"}
            </button>
          </div>

          {!showCode && (
            <button className="paste-btn" onClick={() => setShowCode(true)}>
              or paste code manually →
            </button>
          )}

          {showCode && (
            <div className="code-section">
              <label className="field-label">Legacy Code</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your legacy code here…"
              />
              <button
                className="primary analyze-btn"
                onClick={analyzeCode}
                disabled={loadingAnalyze || !code.trim()}
              >
                {loadingAnalyze ? "Analyzing…" : "Analyze"}
              </button>
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </div>
      </div>

      {/* ── Results (stacked one after another) ── */}
      {analysis && (
        <div className="results">

          {/* 1. Archaeology Dashboard */}
          <div className="panel">
            <h2>Archaeology Dashboard</h2>

            <h3>Business Summary</h3>
            <p>{analysis.summary}</p>

            <h3>Business Rules</h3>
            <ul className="rule-list">
              {analysis.rules?.map((r, i) => <li key={i}>{r}</li>)}
            </ul>

            <h3>Logic Diagram</h3>
            <MermaidView chart={analysis.mermaid} />

            <h3>Red Zones</h3>
            <div className="redzones">
              {analysis.redZones?.map((z, i) => (
                <div className="risk-card" key={i}>
                  <div className="risk-top">
                    <strong>{z.title}</strong>
                    <span className={`badge ${z.level?.toLowerCase()}`}>{z.level}</span>
                  </div>
                  <p>{z.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Ask Your Code */}
          <div className="panel">
            <h2>Ask Your Code</h2>
            <div className="chat-box">
              {chatMessages.length === 0 ? (
                <div className="empty">Ask a follow-up question about this codebase.</div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    <div className="chat-bubble">
                      <strong>{msg.role === "user" ? "You" : "CodeArcheology"}</strong>
                      <p>{msg.content}</p>
                      {msg.role === "assistant" && msg.structured && (
                        <div className="impact-box">
                          {msg.structured.risk && (
                            <div className="risk-top">
                              <span className="impact-label">Risk</span>
                              <span className={`badge ${msg.structured.risk?.toLowerCase()}`}>{msg.structured.risk}</span>
                            </div>
                          )}
                          {msg.structured.affectedAreas?.length > 0 && (
                            <>
                              <p className="impact-label">Affected Areas</p>
                              <ul>{msg.structured.affectedAreas.map((a, idx) => <li key={idx}>{a}</li>)}</ul>
                            </>
                          )}
                          {msg.structured.explanation && <p className="impact-explanation">{msg.structured.explanation}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="ask-row">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loadingAsk && askCode()}
                placeholder="Ask a follow-up question…"
              />
              <button className="primary" onClick={askCode} disabled={loadingAsk || !question.trim()}>
                {loadingAsk ? "Running…" : "Send"}
              </button>
            </div>
          </div>

          {/* 3. Modernization Suggestions */}
          <div className="panel">
            <div className="panel-action-header">
              <h2>Modernization Suggestions</h2>
              <button className="primary" onClick={getModernization} disabled={loadingModernize}>
                {loadingModernize ? "Generating…" : modernization ? "Regenerate" : "Generate Suggestions"}
              </button>
            </div>

            {modernization ? (
              <div className="mod-grid">
                <div>
                  <h3>Suggestions</h3>
                  <ul className="mod-list">
                    {modernization.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h3>Migration Risks</h3>
                  <ul className="mod-list risk">
                    {modernization.risks?.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="empty">Click "Generate Suggestions" to get modernization recommendations.</div>
            )}
          </div>

          {/* 4. Jira Tickets */}
          <div className="panel">
            <div className="panel-action-header">
              <h2>Jira Tickets</h2>
              {jiraTickets.length === 0 && (
                <button className="primary jira-gen-btn" onClick={generateJira} disabled={loadingJira}>
                  {loadingJira ? "Generating…" : "Generate Jira Tickets"}
                </button>
              )}
            </div>

            {jiraTickets.length > 0 ? (
              <div className="jira-list">
                {jiraGroups.map(({ type, tickets }) => (
                  <div className="jira-group" key={type}>
                    <div className="jira-group-header">
                      <span>{TYPE_ICON[type]} {type}s</span>
                      <span className="jira-group-count">{tickets.length}</span>
                    </div>
                    <div className="jira-rows">
                      {tickets.map((ticket, i) => (
                        <JiraRow key={i} ticket={ticket} result={createdMap[ticket.title]} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                Click "Generate Jira Tickets" to create sprint-ready tickets from your analysis.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

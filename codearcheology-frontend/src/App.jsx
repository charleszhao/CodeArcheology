import React, { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import "./App.css";

const ANALYZING_QUOTES = [
  { text: "Asking Claude to read 10,000 lines of Java so you don't have to.", author: "— Anthropic, probably" },
  { text: "Our AI just found a TODO comment from 2003. It says 'fix this later'. Narrator: it was not fixed.", author: "— CodeArcheology" },
  { text: "Anthropic built Claude to be helpful, harmless, and honest. This code is none of those things.", author: "— An honest assessment" },
  { text: "Currently decoding business logic written by someone who left the company in 2008 and can't be reached.", author: "— CodeArcheology" },
  { text: "Claude has now read more legacy code today than a senior dev reads in a calendar year.", author: "— Anthropic Usage Stats" },
  { text: "Did you know? 78% of legacy code comments say 'don't touch this'. Claude touches it anyway.", author: "— Genspark Research" },
  { text: "Claude is legally required to pretend this COBOL makes sense. Please respect its professionalism.", author: "— Anthropic Legal" },
  { text: "This code has more edge cases than a dodecahedron. Claude is excited. Claude is lying.", author: "— CodeArcheology" },
];

function AnalyzingOverlay() {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % ANALYZING_QUOTES.length);
        setVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const quote = ANALYZING_QUOTES[quoteIdx];

  return (
    <div className="analyzing-overlay">
      <div className="analyzing-bg-grid" />
      <div className="analyzing-center">
        <div className="analyzing-orb">
          <div className="analyzing-orb-ring" />
          <div className="analyzing-orb-ring ring2" />
          <span className="analyzing-icon">⛏️</span>
        </div>
        <h2 className="analyzing-title">Excavating your code</h2>
        <div className="analyzing-dots">
          <span /><span /><span />
        </div>
        <div className={`analyzing-quote-wrap ${visible ? "fade-in" : "fade-out"}`}>
          <p className="analyzing-quote-text">"{quote.text}"</p>
          <p className="analyzing-quote-author">{quote.author}</p>
        </div>
        <div className="analyzing-badges">
          <span className="analyzing-badge">⚡ Powered by Claude</span>
          <span className="analyzing-badge">🎫 Jira</span>
        </div>
      </div>
    </div>
  );
}

const MODERNIZING_QUOTES = [
  { text: "Running modernization analysis, creating Jira tickets… Claude is multitasking harder than your entire engineering team.", author: "— CodeArcheology" },
  { text: "Asking Claude to figure out what 'fix this later' means. It's been 20 years. Claude is optimistic.", author: "— Anthropic Support" },
  { text: "Generating your modernization roadmap. ETA: faster than your last sprint planning session.", author: "— CodeArcheology" },
  { text: "Claude is now creating Jira tickets so precise that developers will actually read them. History is being made.", author: "— Anthropic R&D" },
  { text: "Converting spaghetti code into actionable tickets. Claude brought a fork.", author: "— CodeArcheology" },
];

function ModernizingOverlay() {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % MODERNIZING_QUOTES.length);
        setVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const quote = MODERNIZING_QUOTES[quoteIdx];

  return (
    <div className="analyzing-overlay modernizing-overlay">
      <div className="analyzing-bg-grid" />
      <div className="analyzing-center">
        <div className="analyzing-orb">
          <div className="analyzing-orb-ring" />
          <div className="analyzing-orb-ring ring2" />
          <span className="analyzing-icon">🚀</span>
        </div>
        <h2 className="analyzing-title">Modernizing & creating Jira tickets</h2>
        <div className="analyzing-dots">
          <span /><span /><span />
        </div>
        <div className={`analyzing-quote-wrap ${visible ? "fade-in" : "fade-out"}`}>
          <p className="analyzing-quote-text">"{quote.text}"</p>
          <p className="analyzing-quote-author">{quote.author}</p>
        </div>
        <div className="analyzing-badges">
          <span className="analyzing-badge">⚡ Powered by Claude</span>
          <span className="analyzing-badge">🎫 Jira</span>
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
    async function renderChart() {
      if (!chart || !ref.current) return;
      try {
        const { svg } = await mermaid.render(id, chart);
        if (alive && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (ref.current) ref.current.textContent = `Mermaid render error: ${String(e)}`;
      }
    }
    renderChart();
    return () => { alive = false; };
  }, [chart, id]);

  return <div className="mermaid-box" ref={ref} />;
}

function QuickQuestionButtons({ onSelect, disabled }) {
  return (
    <div className="quick-questions">
      <button type="button" onClick={() => onSelect("What happens if we change the core business rule?")} disabled={disabled}>
        Core rule change
      </button>
      <button type="button" onClick={() => onSelect("What are the biggest risks in this code?")} disabled={disabled}>
        Biggest risks
      </button>
      <button type="button" onClick={() => onSelect("Which module should we refactor first?")} disabled={disabled}>
        Refactor priority
      </button>
    </div>
  );
}

export default function App() {
  const [githubUrl, setGithubUrl] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [modernization, setModernization] = useState(null);
  const [jiraTickets, setJiraTickets] = useState([]);
  const [jiraPushResults, setJiraPushResults] = useState(null);

  const [error, setError] = useState("");
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingModernize, setLoadingModernize] = useState(false);

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
    setModernization(null);
    setJiraTickets([]);
    setJiraPushResults(null);
    setAnalysis(null);
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
      if (data.modernization) setModernization(data.modernization);
      if (Array.isArray(data.jiraTickets) && data.jiraTickets.length > 0) setJiraTickets(data.jiraTickets);
      if (Array.isArray(data.jiraCreated) && data.jiraCreated.length > 0) setJiraPushResults(data.jiraCreated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function askCode() {
    setError("");
    setLoadingAsk(true);
    try {
      if (!analysis) throw new Error("Run analysis first.");
      if (!question.trim()) throw new Error("Please enter a question.");
      const currentQuestion = question.trim();
      const userMessage = { role: "user", content: currentQuestion };
      const nextHistory = [...chatMessages, userMessage];
      setChatMessages(nextHistory);

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
      setQuestion("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingAsk(false);
    }
  }

  async function getModernizationSuggestions() {
    setError("");
    setLoadingModernize(true);
    try {
      if (!analysis) throw new Error("Run analysis first.");
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

  function handleAskKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!loadingAsk && analysis) askCode();
    }
  }

  return (
    <div className="page">
      {loadingAnalyze && <AnalyzingOverlay />}
      {loadingModernize && <ModernizingOverlay />}

      <div className="hero">
        <h1 className="hero-title">⛏️ CodeArcheology</h1>
        <p className="hero-sub">
          Turn legacy code into business summaries, logic maps, impact analysis,
          modernization paths, and Jira-ready delivery tickets.
        </p>
      </div>

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

      {analysis && (
        <div className="results">
          <div className="panel">
              <h2>Archaeology Dashboard</h2>
              <h3 style={{marginTop:0}}>Business Summary</h3>
              <p>{analysis.summary}</p>

              <h3>Business Rules</h3>
              <ul>
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

          <div className="panel">
            <h2>Ask Your Code</h2>
            <QuickQuestionButtons onSelect={setQuestion} disabled={loadingAsk} />
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
                              <h3>Risk Assessment</h3>
                              <span className={`badge ${msg.structured.risk?.toLowerCase()}`}>{msg.structured.risk}</span>
                            </div>
                          )}
                          {msg.structured.affectedAreas?.length > 0 && (
                            <>
                              <h4>Affected Areas</h4>
                              <ul>{msg.structured.affectedAreas.map((a, idx) => <li key={idx}>{a}</li>)}</ul>
                            </>
                          )}
                          {msg.structured.explanation && (
                            <>
                              <h4>Explanation</h4>
                              <p>{msg.structured.explanation}</p>
                            </>
                          )}
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
                onKeyDown={handleAskKeyDown}
                placeholder="Ask a follow-up question…"
              />
              <button onClick={askCode} disabled={loadingAsk}>
                {loadingAsk ? "Running…" : "Send"}
              </button>
            </div>
          </div>

          <div className="results-row">
            <div className="panel">
              <h2>Modernization Suggestions</h2>
              <button onClick={getModernizationSuggestions} disabled={loadingModernize}>
                {loadingModernize ? "Generating…" : "Refresh Suggestions"}
              </button>
              {modernization ? (
                <div className="impact-box" style={{ marginTop: 16 }}>
                  <h4>Suggestions</h4>
                  <ul>{modernization.suggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  <h4>Risks</h4>
                  <ul>{modernization.risks?.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              ) : (
                <div className="empty" style={{ marginTop: 16 }}>Auto-generated on Analyze. Click Refresh to re-run.</div>
              )}
            </div>

            <div className="panel jira-panel">
              <div className="jira-panel-header">
                <h2>Jira-Ready Tickets</h2>
                <span className="jira-auto-badge">Auto-created on Analyze</span>
              </div>
              {jiraTickets.length > 0 ? (
                <>
                  <div className="jira-grid">
                    {jiraTickets.map((ticket, i) => (
                      <div className="jira-card" key={i}>
                        <div className="risk-top">
                          <h3>{ticket.title}</h3>
                          <span className={`badge ${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
                        </div>
                        <p className="jira-meta">{ticket.type}</p>
                        <p>{ticket.description}</p>
                        <h4>Acceptance Criteria</h4>
                        <ul>{ticket.acceptanceCriteria?.map((c, idx) => <li key={idx}>{c}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                  {jiraPushResults && (
                    <div className="jira-push-results">
                      <h4>Created in Jira</h4>
                      <ul>
                        {jiraPushResults.map((r, i) => (
                          <li key={i}>
                            {r.url ? (
                              <a href={r.url} target="_blank" rel="noreferrer">{r.key}</a>
                            ) : (
                              <strong>{r.key}</strong>
                            )}
                            {" — "}{r.summary}
                            <span className={`badge ${r.priority?.toLowerCase()}`}>{r.priority}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty">Jira tickets are created automatically when you run Analyze.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

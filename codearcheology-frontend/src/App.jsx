import React, { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import "./App.css";

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

const sampleCode = `public BigDecimal calculateGST(Customer customer, BigDecimal amount, String currency) {
    BigDecimal tax = BigDecimal.ZERO;

    if (customer == null || amount == null) {
        throw new IllegalArgumentException("Invalid input");
    }

    if ("SG".equals(customer.getRegion())) {
        if (!customer.isTaxExempt()) {
            if ("SGD".equals(currency)) {
                tax = amount.multiply(new BigDecimal("0.09"));
            } else {
                BigDecimal fxAmount = convertToSGD(amount, currency);
                tax = fxAmount.multiply(new BigDecimal("0.09"));
            }
        }
    }

    auditTaxDecision(customer.getId(), amount, tax);
    return tax;
}`;

const sampleAnalysis = {
  summary:
    "This module calculates GST for Singapore customers, applying tax only when the customer is not tax-exempt. It also converts non-SGD amounts before applying GST.",
  rules: [
    "If customer or amount is missing, reject the transaction.",
    "If customer region is Singapore, continue GST evaluation.",
    "If customer is tax exempt, do not apply GST.",
    "If currency is SGD, apply 9% GST directly.",
    "If currency is not SGD, convert to SGD first, then apply 9% GST.",
    "Record the tax decision in the audit trail."
  ],
  mermaid: `flowchart TD
    A[Receive customer, amount, currency] --> B{Inputs valid?}
    B -->|No| X[Throw invalid input error]
    B -->|Yes| C{Region is SG?}
    C -->|No| Z[Return zero tax]
    C -->|Yes| D{Tax exempt?}
    D -->|Yes| Z
    D -->|No| E{Currency is SGD?}
    E -->|Yes| F[Apply 9% GST]
    E -->|No| G[Convert amount to SGD]
    G --> H[Apply 9% GST]
    F --> I[Audit decision]
    H --> I
    Z --> I
    I --> J[Return tax]`,
  redZones: [
    {
      title: "GST rate hardcoded",
      explanation: "The 9% tax rate is embedded directly in code, so policy changes are risky.",
      level: "High"
    },
    {
      title: "FX conversion dependency",
      explanation: "Non-SGD flows depend on currency conversion and can affect tax outcomes.",
      level: "Medium"
    },
    {
      title: "Audit coupled with calculation",
      explanation: "Tax logic and audit logging sit in one function, increasing refactor risk.",
      level: "Medium"
    }
  ]
};

const sampleModernization = {
  suggestions: [
    "Externalize the GST rate into a configuration service so tax policy changes do not require code edits.",
    "Split tax calculation and audit logging into separate services to reduce coupling and improve maintainability.",
    "Introduce an asynchronous event for audit recording so billing logic is not blocked by downstream logging.",
    "Wrap currency conversion behind a dedicated FX service interface to isolate legacy dependency risk."
  ],
  risks: [
    "Hardcoded tax rules will create repeated release risk whenever tax policy changes.",
    "Tight coupling between calculation and audit increases blast radius during refactoring.",
    "Embedded FX conversion logic may produce inconsistent results across systems if reused elsewhere."
  ]
};

function buildMockAssistantReply(userMessage) {
  const lower = userMessage.toLowerCase();

  if (lower.includes("gst") || lower.includes("tax")) {
    return {
      answer:
        "Changing GST affects the main tax calculation path for non-exempt Singapore customers and may also impact billing reconciliation and audit outputs.",
      affectedAreas: [
        "GST calculation logic",
        "Foreign currency conversion path",
        "Audit trail outputs",
        "Downstream billing reconciliation"
      ],
      risk: "High",
      explanation:
        "The tax rate is hardcoded across multiple branches, so a policy change has a wide blast radius and needs validation across tax, billing, and reporting."
    };
  }

  if (lower.includes("foreign") || lower.includes("currency") || lower.includes("fx")) {
    return {
      answer:
        "Foreign currency transactions depend on conversion to SGD before tax is applied, so any GST change must also be validated against the FX conversion path.",
      affectedAreas: [
        "FX conversion path",
        "GST calculation logic",
        "Billing totals"
      ],
      risk: "Medium",
      explanation:
        "Because non-SGD transactions are normalized into SGD before tax is applied, refactoring must preserve both conversion accuracy and downstream billing consistency."
    };
  }

  if (lower.includes("refactor") || lower.includes("first")) {
    return {
      answer:
        "The best starting point is to externalize the hardcoded GST rule and isolate the tax calculation from audit logging. That gives the highest risk reduction with the smallest initial change surface.",
      affectedAreas: [
        "Hardcoded tax rule",
        "Tax calculation module",
        "Audit integration"
      ],
      risk: "Medium",
      explanation:
        "The tax rule is both high-frequency and high-risk, while audit coupling increases blast radius. Decoupling these first creates a safer modernization path."
    };
  }

  return {
    answer:
      "This follow-up mainly affects the previously identified tax and billing flow. The largest concern remains tight coupling and hardcoded logic.",
    affectedAreas: ["Tax logic", "Billing flow"],
    risk: "Medium",
    explanation:
      "The system concentrates multiple responsibilities in one flow, so follow-up changes should be isolated carefully."
  };
}

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
        if (ref.current) {
          ref.current.textContent = `Mermaid render error: ${String(e)}`;
        }
      }
    }

    renderChart();

    return () => {
      alive = false;
    };
  }, [chart, id]);

  return <div className="mermaid-box" ref={ref} />;
}

function QuickQuestionButtons({ onSelect, disabled }) {
  return (
    <div className="quick-questions">
      <button
        type="button"
        onClick={() => onSelect("What happens if GST changes from 9% to 10%?")}
        disabled={disabled}
      >
        GST change
      </button>
      <button
        type="button"
        onClick={() => onSelect("What about foreign currency transactions?")}
        disabled={disabled}
      >
        FX impact
      </button>
      <button
        type="button"
        onClick={() => onSelect("Which module should we refactor first?")}
        disabled={disabled}
      >
        Refactor priority
      </button>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("mock");
  const [githubUrl, setGithubUrl] = useState(
    "https://github.com/example-org/legacy-billing/blob/main/src/TaxCalculator.java"
  );
  const [code, setCode] = useState(sampleCode);
  const [analysis, setAnalysis] = useState(null);
  const [question, setQuestion] = useState("What happens if GST changes from 9% to 10%?");
  const [chatMessages, setChatMessages] = useState([]);
  const [modernization, setModernization] = useState(null);
  const [error, setError] = useState("");
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingModernize, setLoadingModernize] = useState(false);

  async function importGithub() {
    setError("");
    setLoadingImport(true);

    try {
      if (mode === "mock") {
        await new Promise((r) => setTimeout(r, 600));
        setCode(sampleCode);
        return;
      }

      const res = await fetch("http://localhost:4000/api/import-github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      setCode(data.code || "");
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
    setLoadingAnalyze(true);

    try {
      if (mode === "mock") {
        await new Promise((r) => setTimeout(r, 900));
        setAnalysis(sampleAnalysis);
        return;
      }

      const res = await fetch("http://localhost:4000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
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

  async function askCode() {
    setError("");
    setLoadingAsk(true);

    try {
      if (!analysis) throw new Error("Run analysis first.");
      if (!question.trim()) throw new Error("Please enter a question.");

      const currentQuestion = question.trim();
      const userMessage = {
        role: "user",
        content: currentQuestion
      };

      const nextHistory = [...chatMessages, userMessage];
      setChatMessages(nextHistory);

      if (mode === "mock") {
        await new Promise((r) => setTimeout(r, 700));

        const mock = buildMockAssistantReply(currentQuestion);

        const assistantMessage = {
          role: "assistant",
          content: mock.answer,
          structured: mock
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
        setQuestion("");
        return;
      }

      const res = await fetch("http://localhost:4000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentQuestion,
          context: analysis,
          history: nextHistory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ask failed");

      const assistantMessage = {
        role: "assistant",
        content: data.answer || data.impact || "No response",
        structured: {
          affectedAreas: Array.isArray(data.affectedAreas) ? data.affectedAreas : [],
          risk: data.risk || "Medium",
          explanation: data.explanation || ""
        }
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
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

      if (mode === "mock") {
        await new Promise((r) => setTimeout(r, 700));
        setModernization(sampleModernization);
        return;
      }

      const res = await fetch("http://localhost:4000/api/modernize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: analysis })
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

  function handleQuickQuestion(nextQuestion) {
    setQuestion(nextQuestion);
  }

  function handleAskKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!loadingAsk && analysis) {
        askCode();
      }
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <h1>CodeArcheology</h1>
          <p>
            Turn legacy code into business summaries, logic maps, impact analysis, and modernization paths.
          </p>
        </div>

        <div className="mode-switch">
          <button className={mode === "mock" ? "active" : ""} onClick={() => setMode("mock")}>
            Mock Mode
          </button>
          <button className={mode === "api" ? "active" : ""} onClick={() => setMode("api")}>
            API Mode
          </button>
        </div>
      </div>

      <div className="layout">
        <div className="panel">
          <h2>Ingestion</h2>

          <label>GitHub File URL</label>
          <div className="row">
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/org/repo/blob/main/file.java"
            />
            <button onClick={importGithub} disabled={loadingImport}>
              {loadingImport ? "Importing..." : "Import"}
            </button>
          </div>

          <label>Legacy Code</label>
          <textarea value={code} onChange={(e) => setCode(e.target.value)} />

          <button className="primary" onClick={analyzeCode} disabled={loadingAnalyze}>
            {loadingAnalyze ? "Analyzing..." : "Analyze"}
          </button>

          {error ? <div className="error">{error}</div> : null}
        </div>

        <div className="panel">
          <h2>Archaeology Dashboard</h2>

          {!analysis ? (
            <div className="empty">Run analysis to generate summary, rules, diagram, and red zones.</div>
          ) : (
            <>
              <section className="section">
                <h3>Business Summary</h3>
                <p>{analysis.summary}</p>
              </section>

              <section className="section">
                <h3>Business Rules</h3>
                <ul>
                  {analysis.rules?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>

              <section className="section">
                <h3>Logic Diagram</h3>
                <MermaidView chart={analysis.mermaid} />
              </section>

              <section className="section">
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
              </section>
            </>
          )}
        </div>
      </div>

      <div className="panel ask-panel">
        <h2>Ask Your Code</h2>

        <QuickQuestionButtons onSelect={handleQuickQuestion} disabled={!analysis || loadingAsk} />

        <div className="chat-box">
          {chatMessages.length === 0 ? (
            <div className="empty">
              Ask a question after analysis. You can continue with follow-up questions.
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="chat-bubble">
                  <strong>{msg.role === "user" ? "You" : "CodeArcheology"}</strong>
                  <p>{msg.content}</p>

                  {msg.role === "assistant" && msg.structured ? (
                    <div className="impact-box">
                      {msg.structured.risk ? (
                        <div className="risk-top">
                          <h3>Risk Assessment</h3>
                          <span className={`badge ${msg.structured.risk?.toLowerCase()}`}>
                            {msg.structured.risk}
                          </span>
                        </div>
                      ) : null}

                      {msg.structured.affectedAreas?.length ? (
                        <>
                          <h4>Affected Areas</h4>
                          <ul>
                            {msg.structured.affectedAreas.map((a, idx) => (
                              <li key={idx}>{a}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}

                      {msg.structured.explanation ? (
                        <>
                          <h4>Explanation</h4>
                          <p>{msg.structured.explanation}</p>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="row ask-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleAskKeyDown}
            placeholder="Ask a follow-up question..."
          />
          <button onClick={askCode} disabled={loadingAsk || !analysis}>
            {loadingAsk ? "Running..." : "Send"}
          </button>
        </div>
      </div>

      <div className="panel modernize-panel">
        <h2>Modernization Suggestions</h2>
        <div className="row ask-row">
          <button onClick={getModernizationSuggestions} disabled={loadingModernize || !analysis}>
            {loadingModernize ? "Generating..." : "Get Modernization Suggestions"}
          </button>
        </div>

        {modernization ? (
          <div className="impact-box">
            <h3>Suggested Modernization Path</h3>

            <h4>Suggestions</h4>
            <ul>
              {modernization.suggestions?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h4>Risks</h4>
            <ul>
              {modernization.risks?.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="empty">Generate modernization suggestions after analysis.</div>
        )}
      </div>
    </div>
  );
}
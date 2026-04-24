import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractText(response) {
  if (!response || !Array.isArray(response.content)) return "";
  return response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function stripCodeFences(text) {
  if (!text) return "";
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function extractFirstJsonObject(text) {
    const cleaned = stripCodeFences(text);

    const firstBrace = cleaned.indexOf("{");
    if (firstBrace === -1) {
        throw new Error("No JSON object found in model response.");
    }

    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = firstBrace; i < cleaned.length; i++) {
        const char = cleaned[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === "\\\\") {
            escapeNext = true;
            continue;
        }

        if (char === "\"") {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === "{") depth++;
            if (char === "}") depth--;

            if (depth === 0) {
                return cleaned.slice(firstBrace, i + 1);
            }
        }
    }

    throw new Error("Unterminated JSON object in model response.");
}

function safeParseJson(text) {
    return JSON.parse(stripCodeFences(text));
    //const jsonText = extractFirstJsonObject(text);
    //return JSON.parse(jsonText);
}

function validateGithubUrl(url) {
  const match = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );

  if (!match) {
    throw new Error(
      "Invalid GitHub URL. Expected format: https://github.com/org/repo/blob/branch/path/to/file"
    );
  }

  const [, owner, repo, branch, path] = match;
  return { owner, repo, branch, path };
}

function buildRawGithubUrl({ owner, repo, branch, path }) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

function truncateCode(code, maxChars = 20000) {
  if (!code) return "";
  if (code.length <= maxChars) return code;
  return `${code.slice(0, maxChars)}\n\n/* TRUNCATED FOR ANALYSIS */`;
}

async function callClaude(prompt, maxTokens = 1200) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY in .env");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  console.log("====== CLAUDE REQUEST ======");
  console.log("Model:", model);
  console.log("Max Tokens:", maxTokens);
  console.log("Prompt (first 500 chars):");
  console.log(prompt.slice(0, 500));
  console.log("================================");
  const startTime = Date.now();
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: maxTokens,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const duration = Date.now() - startTime;

  console.log("====== CLAUDE RESPONSE ======");
  console.log("Duration:", duration, "ms");
  console.log("Raw response:");
  console.log(JSON.stringify(response, null, 2));

  const text = extractText(response);

  console.log("Extracted text (first 500 chars):");
  console.log(text.slice(0, 500));
  console.log("================================");

  return text;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/import-github", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "GitHub URL is required." });
    }

    const parsed = validateGithubUrl(url.trim());
    const rawUrl = buildRawGithubUrl(parsed);

    const response = await fetch(rawUrl, {
      headers: {
        "User-Agent": "CodeArcheology-Demo",
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to fetch GitHub file. Status: ${response.status}`,
      });
    }

    const code = await response.text();

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Fetched file is empty." });
    }

    res.json({
      ...parsed,
      rawUrl,
      code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to import GitHub file" });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required." });
    }

    const prompt = `
You are an expert enterprise architect specializing in legacy systems and reverse engineering.

Analyze the following legacy code and extract the underlying business logic.

Return STRICT JSON with this exact schema:
{
  "summary": "2-3 sentence plain-English business summary",
  "rules": [
    "Rule 1",
    "Rule 2"
  ],
  "mermaid": "flowchart TD ...",
  "redZones": [
    {
      "title": "Short title",
      "explanation": "Why this is risky",
      "level": "High"
    }
  ]
}

Requirements:
- Focus on business intent, decision points, validation logic, and downstream implications.
- Ignore boilerplate and implementation noise.
- Mermaid must be valid flowchart TD syntax.
- redZones must contain 2 to 4 items.
- level must be one of: High, Medium, Low.
- Return JSON only. No markdown. No explanation outside JSON.

Legacy code:
${truncateCode(code)}
`;

    const raw = await callClaude(prompt, 1800);
    const parsed = safeParseJson(raw);

    if (!parsed.summary || !Array.isArray(parsed.rules) || !parsed.mermaid) {
      return res.status(502).json({ error: "Model returned incomplete analysis." });
    }

    res.json({
      summary: parsed.summary,
      rules: parsed.rules,
      mermaid: parsed.mermaid,
      redZones: Array.isArray(parsed.redZones) ? parsed.redZones : [],
    });
  } catch (err) {
    console.error(err);

    if (err?.error?.error?.message) {
      return res.status(500).json({ error: err.error.error.message });
    }

    res.status(500).json({ error: err.message || "Analyze failed" });
  }
});

app.post("/api/ask", async (req, res) => {
  try {
    const { message, context, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    if (!context || typeof context !== "object") {
      return res.status(400).json({ error: "Analysis context is required." });
    }

    const safeHistory = Array.isArray(history) ? history : [];

    const formattedHistory = safeHistory
      .map((msg) => {
        const role = msg.role === "assistant" ? "Assistant" : "User";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    const prompt = `
You are an enterprise architect having a follow-up conversation about a legacy system.

System understanding:
${JSON.stringify(context, null, 2)}

Conversation so far:
${formattedHistory || "No previous conversation."}

Latest user question:
${message}

Return STRICT JSON with this exact schema:
{
  "answer": "Natural language answer to the user's latest question",
  "affectedAreas": ["Area 1", "Area 2"],
  "risk": "High",
  "explanation": "Why this is the case"
}

Requirements:
- Answer in a conversational but concise way.
- Use the prior conversation when relevant.
- Focus on impact, risk, dependencies, and likely affected logic paths.
- risk must be one of: High, Medium, Low.
- Return JSON only. No markdown.
`;

    const raw = await callClaude(prompt, 2500);
    const parsed = safeParseJson(raw);

    if (!parsed.answer || !parsed.risk) {
      return res.status(502).json({ error: "Model returned incomplete chat response." });
    }

    res.json({
      answer: parsed.answer,
      affectedAreas: Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : [],
      risk: parsed.risk,
      explanation: parsed.explanation || "",
    });
  } catch (err) {
    console.error(err);

    if (err?.error?.error?.message) {
      return res.status(500).json({ error: err.error.error.message });
    }

    res.status(500).json({ error: err.message || "Ask failed" });
  }
});

app.post("/api/modernize", async (req, res) => {
  try {
    const { context } = req.body;

    if (!context || typeof context !== "object") {
      return res.status(400).json({ error: "Analysis context is required." });
    }

    const prompt = `
You are a modernization architect.

Given this extracted legacy system understanding:
${JSON.stringify(context, null, 2)}

Suggest:
1. 4 to 6 modernization opportunities
2. 3 to 5 migration risks

Return STRICT JSON with this exact schema:
{
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "risks": [
    "Risk 1",
    "Risk 2"
  ]
}

Requirements:
- Be practical and enterprise-focused.
- Each suggestion must be one concise sentence.
- Each risk must be one concise sentence.
- Keep the response compact.
- Return JSON only.
- Do not include markdown.
- Do not include code fences.
- Do not include any explanation before or after the JSON.
`;

    const raw = await callClaude(prompt, 2500);

    const parsed = safeParseJson(raw);

    if (!Array.isArray(parsed.suggestions) || !Array.isArray(parsed.risks)) {
      return res.status(502).json({ error: "Model returned incomplete modernization output." });
    }

    res.json({
      suggestions: parsed.suggestions,
      risks: parsed.risks,
    });
  } catch (err) {
    console.error(err);

    if (err?.error?.error?.message) {
      return res.status(500).json({ error: err.error.error.message });
    }

    res.status(500).json({ error: err.message || "Modernization failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
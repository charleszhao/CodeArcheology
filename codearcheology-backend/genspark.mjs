import { ApiClient } from "@genspark/cli/dist/client.js";

export function isGensparkConfigured() {
  return !!process.env.GENSPARK_API_KEY;
}

function buildDocPrompt(analysis, modernization, jiraTickets, sourceLabel) {
  const redZoneLines = (analysis.redZones || [])
    .map((z) => `- [${z.level}] ${z.title}: ${z.explanation}`)
    .join("\n");

  const rulesLines = (analysis.rules || [])
    .map((r, i) => `${i + 1}. ${r}`)
    .join("\n");

  const modernizationSection = modernization
    ? `## Modernization Suggestions\n${(modernization.suggestions || []).map((s) => `- ${s}`).join("\n")}\n\n## Migration Risks\n${(modernization.risks || []).map((r) => `- ${r}`).join("\n")}`
    : "";

  const jiraSection = jiraTickets?.length
    ? `## Jira Tickets Created\n${jiraTickets.map((t) => `- **${t.title}** (${t.priority})`).join("\n")}`
    : "";

  return `Create a professional legacy code analysis report document${sourceLabel ? ` for ${sourceLabel}` : ""}.

Use this analysis data to build the report:

## Business Summary
${analysis.summary}

## Business Rules
${rulesLines}

## Risk Zones
${redZoneLines}

${modernizationSection}

${jiraSection}

Format as a polished Word-style HTML report with:
- A cover section with title, date, and executive summary
- Clearly separated sections with headers
- A colour-coded risk table (red=High, orange=Medium, green=Low)
- Business rules as a numbered list
- Modernization roadmap as a timeline or prioritised table (if provided)
- Jira tickets summary table (if provided)
- Professional font and layout suitable for printing or PDF export

Generate the complete document now.`;
}

export async function createGensparkDocument({ analysis, modernization, jiraTickets, sourceLabel }) {
  const client = new ApiClient({
    apiKey: process.env.GENSPARK_API_KEY,
    baseUrl: "https://www.genspark.ai",
    debug: false,
    timeout: 1800000,
    output: "json",
  });

  const message = buildDocPrompt(analysis, modernization, jiraTickets, sourceLabel);

  let lastProjectId = null;

  const result = await client.agentAsk(
    null,
    message,
    "docs",
    (msg) => {
      if (msg.project_id) lastProjectId = msg.project_id;
      console.log("[Genspark] progress:", msg.type || msg.status || JSON.stringify(msg).slice(0, 80));
    }
  );

  const projectId = result?.data?.project_id || lastProjectId;
  const artifactUrl = result?.data?.artifact_url || result?.data?.url || null;

  console.log("[Genspark] result:", JSON.stringify(result?.data || result?.message || "").slice(0, 200));

  return {
    projectId,
    documentUrl: artifactUrl,
    message: result?.message || "Document created",
  };
}

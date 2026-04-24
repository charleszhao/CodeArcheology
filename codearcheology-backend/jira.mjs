import { Buffer } from "node:buffer";
import { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } from "./constants.mjs";

export function isJiraConfigured() {
  return !!(JIRA_BASE_URL && JIRA_EMAIL && JIRA_API_TOKEN);
}

function authHeader() {
  const creds = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
  return `Basic ${creds}`;
}

function toAdf(text) {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text: text }] }],
  };
}

export async function createJiraIssue({ projectKey, summary, description, issueType, priority }) {
  const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary,
        description: toAdf(description),
        issuetype: { name: issueType },
        priority: { name: priority },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg =
      err.errorMessages?.join(", ") ||
      (err.errors ? JSON.stringify(err.errors) : res.statusText);
    throw new Error(`Jira API error (${res.status}): ${msg}`);
  }

  return res.json();
}

const ISSUE_TYPE_MAP = {
  bug: "Story",
  improvement: "Task",
  risk: "Story",
  story: "Story",
  task: "Task",
  epic: "Epic",
};

function sanitizeIssueType(type) {
  return ISSUE_TYPE_MAP[(type || "task").toLowerCase()] ?? "Task";
}

export async function pushTicketsToJira(tickets, projectKey) {
  const created = [];

  for (const ticket of tickets) {
    const issue = await createJiraIssue({
      projectKey,
      summary: ticket.title,
      description: [
        ticket.description,
        "",
        "Acceptance Criteria:",
        ...(ticket.acceptanceCriteria || []).map((c) => `- ${c}`),
      ].join("\n"),
      issueType: sanitizeIssueType(ticket.type),
      priority: ticket.priority || "Medium",
    });

    created.push({
      key: issue.key,
      url: `${JIRA_BASE_URL}/browse/${issue.key}`,
      summary: ticket.title,
      issueType: ticket.type || "Task",
      priority: ticket.priority || "Medium",
    });
  }

  return created;
}

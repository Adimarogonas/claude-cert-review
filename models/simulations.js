// models/simulations.js — Manifest of interactive HTML simulators, 2 per domain.
//
// Each simulator is a self-contained, CarbonSilicon-branded HTML document served
// from /public/simulations/<file> and rendered in a sandboxed <iframe> inside the
// module "Simulations" tab. The learner configures an agent/system and watches the
// metrics respond — the gotchas and decision boundaries are *felt*, not just read.
//
// Shape: { id, domain, file, title, summary }

export const SIMULATIONS = [
  // ── Domain 1 · Agentic Architecture & Orchestration ──────────────────────
  {
    id: "d1-customer-support",
    domain: 1,
    file: "d1-customer-support.html",
    title: "Customer Support Resolution Agent",
    summary:
      "Configure verification hooks, escalation thresholds, decomposition and max-turn limits, then submit tickets and watch first-contact resolution, mis-identification and escalation move.",
  },
  {
    id: "d1-multi-agent-research",
    domain: 1,
    file: "d1-multi-agent-research.html",
    title: "Multi-Agent Research System",
    summary:
      "Tune a coordinator's context isolation, parallel vs sequential decomposition, dynamic subagent selection and provenance — and see coverage, attribution and context-bleed respond.",
  },

  // ── Domain 2 · Tool Design & MCP Integration ─────────────────────────────
  {
    id: "d2-tool-design",
    domain: 2,
    file: "d2-tool-design.html",
    title: "Designing the Tool Layer",
    summary:
      "Split vs overloaded tools, descriptive vs opaque names, structured vs raw errors, tool_choice and least-privilege scope — watch tool-selection accuracy and error recovery.",
  },
  {
    id: "d2-mcp-builtin",
    domain: 2,
    file: "d2-mcp-builtin.html",
    title: "MCP Servers & Built-in Tools",
    summary:
      "Project vs user MCP scope, env-var vs inline secrets, exposing resources, and choosing Grep/Glob/Read for a task — minimise exploratory calls and secret-leak risk.",
  },

  // ── Domain 3 · Claude Code Configuration & Workflows ─────────────────────
  {
    id: "d3-claude-code-config",
    domain: 3,
    file: "d3-claude-code-config.html",
    title: "Configuring Claude Code for a Team",
    summary:
      "CLAUDE.md scope, path-scoped rules, committed commands and plan-mode-first — see convention adherence, context bloat and risky unreviewed changes respond.",
  },
  {
    id: "d3-cicd",
    domain: 3,
    file: "d3-cicd.html",
    title: "Claude Code in CI/CD",
    summary:
      "Headless -p vs interactive, JSON output, persona via --append-system-prompt, and independent review sessions — avoid CI hangs and self-review bias.",
  },

  // ── Domain 4 · Prompt Engineering & Structured Output ────────────────────
  {
    id: "d4-structured-extraction",
    domain: 4,
    file: "d4-structured-extraction.html",
    title: "Structured Data Extraction",
    summary:
      "Tool-use schemas vs prose-parsing, enums, nullable vs required fields, and validate-then-retry — drive valid-output rate down to fabrications and schema violations.",
  },
  {
    id: "d4-criteria-review",
    domain: 4,
    file: "d4-criteria-review.html",
    title: "Criteria & Multi-Pass Review",
    summary:
      "Vague vs explicit criteria, few-shot consistency, and single vs independent multi-pass review — push the false-positive rate down without losing recall.",
  },

  // ── Domain 5 · Context Management & Reliability ──────────────────────────
  {
    id: "d5-long-context",
    domain: 5,
    file: "d5-long-context.html",
    title: "Managing a Filling Context Window",
    summary:
      "Truncation vs rolling summaries vs persistent fact-blocks, lead summaries, and subagent scratchpads — keep facts alive as context usage climbs past budget.",
  },
  {
    id: "d5-reliability",
    domain: 5,
    file: "d5-reliability.html",
    title: "Reliability & Error Propagation",
    summary:
      "Ambiguity policy, surfacing vs swallowing subagent errors, calibrated confidence gating and provenance — eliminate silent failures across a multi-agent pipeline.",
  },
];

/**
 * Returns the simulators for a domain, in authored order.
 * @param {number|string} domainId — 1–5
 * @returns {Array<{id,domain,file,title,summary}>}
 */
export function getSimulationsForDomain(domainId) {
  const id = typeof domainId === "string" ? parseInt(domainId, 10) : domainId;
  return SIMULATIONS.filter((s) => s.domain === id);
}

/** Public URL for a simulator file. */
export function simulationUrl(sim) {
  return `/simulations/${sim.file}`;
}

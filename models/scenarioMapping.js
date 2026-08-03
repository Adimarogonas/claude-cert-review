// models/scenarioMapping.js — Links existing scenario question bank to module task statements.
// Each key is a task statement ID; the value is an array of scenario question IDs
// from models/scenarios.js that are most relevant to that task statement.

export const TASK_SCENARIO_MAP = {
  // 1.1 — Agentic loops (stop_reason, loop control)
  "1.1": ["1f", "1h", "1j"],

  // 1.2 — Multi-agent coordination (coordinator decomposition, trust levels)
  "1.2": ["1a", "1b", "3b", "3g", "3j", "3k"],

  // 1.3 — Subagent invocation, context passing, parallelism
  "1.3": ["3d", "3e", "3f", "3n", "3o"],

  // 1.4 — Multi-step enforcement, handoff, irreversible actions
  "1.4": ["1c", "1d", "7b", "7c"],

  // 1.5 — PreToolUse / PostToolUse hooks
  "1.5": ["1g", "4b", "4c", "7a"],

  // 1.6 — Task decomposition, per-file vs single-pass review
  "1.6": ["8d"],

  // 1.7 — Session state, resumption, forking
  "1.7": ["2h", "7f", "7g", "7h"],

  // 2.1 — Tool descriptions and boundaries
  "2.1": ["4a", "4e", "4g"],

  // 2.2 — Structured error responses for MCP tools
  "2.2": ["4f", "4h"],

  // 2.3 — Tool distribution across agents, tool_choice
  "2.3": ["3a", "4d", "4i", "9c", "4j", "4k"],

  // 2.4 — MCP server integration (.mcp.json, resources)
  "2.4": ["5g", "5h", "5i"],

  // 2.5 — Built-in tools (Grep, Read, Write, Edit, Bash, Glob)
  "2.5": ["5a", "5c", "5f", "5j"],

  // 3.1 — CLAUDE.md hierarchy, project vs user scope
  "3.1": ["2a"],

  // 3.2 — Custom slash commands and skills
  "3.2": ["2d"],

  // 3.3 — Path-specific rules (.claude/rules/ with glob patterns)
  "3.3": ["2b"],

  // 3.4 — Plan mode vs direct execution
  "3.4": ["2c", "2i", "2j"],

  // 3.5 — Iterative refinement (interview pattern, progressive improvement)
  "3.5": ["2g"],

  // 3.6 — Claude Code in CI/CD (-p, --output-format, --bare, --append-system-prompt)
  "3.6": ["2e", "2f", "8a", "8b", "8h", "8j", "8l", "8m"],

  // 4.1 — Explicit prompt criteria to reduce false positives
  "4.1": ["5e", "8k", "10e"],

  // 4.2 — Few-shot prompting for consistency
  "4.2": ["9o", "6j", "9u"],

  // 4.3 — Structured output: tool use, JSON schemas, enums
  "4.3": ["9a", "9c", "9e", "9f", "9p", "9q", "9r", "9s", "9t"],

  // 4.4 — Validation, retry, self-correction loops
  "4.4": ["9b", "9d"],

  // 4.5 — Batch processing (Message Batches API, prompt caching)
  "4.5": ["3h", "3i", "6c", "6d", "6g", "6h", "6i", "8g", "8i", "10c"],

  // 4.6 — Multi-instance and multi-pass review
  "4.6": ["8c", "8e", "8f"],

  // 5.1 — Context management: persistent facts, rolling summaries
  "5.1": ["6a", "6b", "6e", "10a", "10d"],

  // 5.2 — Escalation and ambiguity resolution
  "5.2": ["1d", "1i", "10b"],

  // 5.3 — Error propagation across multi-agent systems
  "5.3": ["3c", "7d", "7e"],

  // 5.4 — Large codebase context: subagents, scratchpad files
  "5.4": ["5b", "5d", "6f"],

  // 5.5 — Human review workflows, confidence calibration
  "5.5": ["9g", "9h", "9i", "9j", "9k", "9l", "9m", "9n"],

  // 5.6 — Information provenance and uncertainty handling
  "5.6": ["3l", "3m", "3p"],
};

/**
 * Returns all scenario question objects (with scenarioId and scenarioTitle attached)
 * that are mapped to the given task statement ID.
 *
 * @param {string} taskId  — e.g. "1.1"
 * @param {Array}  scenarios — the SCENARIOS array from models/scenarios.js
 * @returns {Array} — question objects with { ...q, scenarioId, scenarioTitle }
 */
export function getScenarioQuestionsForTask(taskId, scenarios) {
  const qids = TASK_SCENARIO_MAP[taskId];
  if (!qids || qids.length === 0) return [];

  const qidSet = new Set(qids);
  const results = [];

  for (const sc of scenarios) {
    for (const q of sc.questions) {
      if (qidSet.has(q.id)) {
        results.push({ ...q, scenarioId: sc.id, scenarioTitle: sc.title });
      }
    }
  }

  // Preserve the order defined in TASK_SCENARIO_MAP
  results.sort((a, b) => qids.indexOf(a.id) - qids.indexOf(b.id));
  return results;
}

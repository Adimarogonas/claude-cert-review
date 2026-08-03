// models/modules.js — Domain/task-statement study content for the CCA exam.
// Pure JS, no React, no browser globals.
//
// Structure: 5 domains → task statements → { knowledge, skills, gotchas, questions }
// Question IDs use prefix "m" + task id + letter, e.g. "m1.1a" to avoid
// collision with scenario question IDs in the existing progress store.

export const DOMAINS = [
  {
    id: 1,
    title: "Agentic Architecture & Orchestration",
    weight: 27,
    color: "#000000",
    taskStatements: [
      {
        id: "1.1",
        title: "Design and implement agentic loops for autonomous task execution",
        knowledge: [
          "The agentic loop lifecycle: send request → inspect stop_reason (\"tool_use\" vs \"end_turn\") → execute requested tools → return results for next iteration",
          "Tool results must be appended to conversation history so the model can incorporate new information into its reasoning for the next step",
          "Model-driven decision-making: Claude reasons about which tool to call next based on context — distinct from pre-configured decision trees or fixed tool sequences",
          "The stop_reason field is the canonical termination signal: \"end_turn\" means the model has finished; \"tool_use\" means it wants to call a tool",
        ],
        skills: [
          "Implement loop control flow that continues when stop_reason is \"tool_use\" and terminates when stop_reason is \"end_turn\"",
          "Add tool results to conversation context between iterations so the model reasons about accumulated findings, not just the latest tool result",
          "Avoid anti-patterns: parsing natural language signals (e.g. checking if the response text contains 'DONE'), setting iteration caps as the primary stopping mechanism, or checking assistant text content as a completion indicator",
        ],
        gotchas: [
          "Using an iteration counter as the *primary* stopping mechanism — it's a safety backstop, not the control signal. The correct signal is stop_reason == \"end_turn\"",
          "Checking the assistant's text output for completion phrases ('DONE', 'FINISHED') instead of inspecting stop_reason — this is fragile and model-phrasing dependent",
          "Not returning tool results to the model after execution — the loop must append tool_result blocks to the conversation before the next API call",
          "Treating \"end_turn\" as an error or unexpected state — it's the normal, expected termination signal for a completed agentic loop",
        ],
        questions: [
          {
            id: "m1.1a",
            text: "An agentic loop implementation checks whether the assistant's response text contains the phrase 'Task complete' to determine when to stop. What is the primary problem with this approach?",
            options: [
              "Text parsing adds too much latency to the loop control flow",
              "It relies on model phrasing instead of the canonical stop_reason signal",
              "The phrase 'Task complete' is too short, so the model might emit it mid-task inadvertently and end the loop early",
              "The loop should use a maximum iteration count as the stopping condition instead",
            ],
            correct: 1,
            explanation: "stop_reason is the canonical, reliable termination signal. When stop_reason is \"end_turn\", the model has finished its work. Parsing text for completion phrases depends on model phrasing, which can vary across versions and temperatures. Iteration caps (D) are safety backstops, not primary control signals.",
          },
          {
            id: "m1.1b",
            text: "After a tool executes successfully, the agentic loop discards the tool result and sends the original user message again in the next API request. What is the most significant consequence?",
            options: [
              "The API will reject the request because tool_use blocks must be followed by tool_result blocks",
              "Token costs will increase because the same context is resent each iteration",
              "The model will terminate the loop prematurely with stop_reason \"end_turn\"",
              "The model cannot incorporate the tool's output into its reasoning and will likely call the same tool again indefinitely",
            ],
            correct: 0,
            explanation: "The Claude API requires that every tool_use block in the assistant turn is followed by a corresponding tool_result block in the next user turn. Omitting tool results causes an API validation error. Beyond the API constraint, the model also cannot reason about what the tool returned if results are not in context.",
          },
          {
            id: "m1.1c",
            text: "Which stop_reason value indicates that an agentic loop should execute tools and continue iterating?",
            options: [
              "\"tool_use\"",
              "\"max_tokens\"",
              "\"tool_result\"",
              "\"end_turn\"",
            ],
            correct: 0,
            explanation: "\"tool_use\" means the model wants to invoke one or more tools — the loop should execute those tools, append the results, and call the API again. \"end_turn\" means the model is done. \"max_tokens\" indicates the response was truncated and requires special handling. \"tool_result\" is not a stop_reason value; it's a content block type.",
          },
          {
            id: "m1.1d",
            text: "An API response comes back with stop_reason 'tool_use' and its content contains three separate tool_use blocks. How must the agentic loop handle this single iteration?",
            options: [
              "Execute only the first tool_use block and return its result, letting the model re-request the other two on later turns.",
              "Execute all three tools and send three consecutive user turns, each carrying one tool_result block in the original order.",
              "Execute all three tools, then send one user turn containing all three tool_result blocks before calling the API again.",
              "Execute all three tools and append their outputs as plain text in the next user message, matched to each tool by name.",
            ],
            correct: 2,
            explanation: "A single assistant turn may request several tools at once; the harness runs them (concurrently, when they are independent) and returns every corresponding tool_result block in the one user turn that immediately follows. Each tool_result must carry the tool_use_id of the block it answers. Option A serialises work the model deliberately batched and leaves tool_use blocks unanswered, which the API rejects. Option B likewise splits the results across turns instead of returning them together. Option D drops the tool_result block type in favour of prose, so the results are no longer bound to their tool_use ids.",
          },
        ],
      },
      {
        id: "1.2",
        title: "Orchestrate multi-agent systems with coordinator-subagent patterns",
        knowledge: [
          "Hub-and-spoke architecture: a coordinator agent manages all inter-subagent communication, error handling, and information routing — subagents do not communicate directly with each other",
          "Subagents operate with isolated context: they do not inherit the coordinator's conversation history automatically; context must be explicitly passed in each subagent's prompt",
          "The coordinator is responsible for task decomposition, delegation, result aggregation, and dynamically selecting which subagents to invoke based on query complexity",
          "Overly narrow task decomposition by the coordinator leads to incomplete coverage — e.g. decomposing 'creative industries' into only visual arts subtasks",
        ],
        skills: [
          "Design coordinator agents that analyze query requirements and *dynamically* select which subagents to invoke rather than always routing through the full pipeline",
          "Partition research scope across subagents to minimize duplication (assign distinct subtopics or source types to each agent)",
          "Implement iterative refinement loops where the coordinator evaluates synthesis output for gaps and re-delegates with targeted queries",
          "Route all subagent communication through the coordinator for observability, consistent error handling, and controlled information flow",
        ],
        gotchas: [
          "Assuming subagents share memory or context with the coordinator — subagents start each invocation with only what's in their prompt",
          "Always routing through the full subagent pipeline regardless of query complexity — simple queries may only need one subagent",
          "Allowing subagents to communicate directly with each other, bypassing the coordinator and breaking centralized error handling and observability",
          "Narrow coordinator decomposition that assigns all subtasks within a single domain when the topic spans multiple domains",
        ],
        questions: [
          {
            id: "m1.2a",
            text: "A multi-agent research system produces reports that cover only visual arts when given the topic 'impact of AI on creative industries.' Each subagent executed correctly within its assigned scope. What is the most likely root cause?",
            options: [
              "The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives",
              "The coordinator decomposed the topic too narrowly, omitting music, writing, and film",
              "The web search agent's queries are not comprehensive enough to cover non-visual creative sectors",
              "The document analysis agent is filtering out sources related to non-visual creative industries",
            ],
            correct: 1,
            explanation: "If each subagent executed correctly within its assigned scope, the problem is the scope assigned to them — that's the coordinator's decomposition. Options C, D, and D incorrectly blame downstream agents that performed their assigned work correctly. The coordinator is responsible for ensuring comprehensive coverage across the full topic space.",
          },
          {
            id: "m1.2b",
            text: "A coordinator agent always invokes all four subagents (web_search, document_analysis, data_extraction, synthesis) regardless of the query. What is the primary architectural problem?",
            options: [
              "Four subagents exceeds the recommended maximum for a hub-and-spoke architecture",
              "The synthesis agent receives inconsistent inputs when some agents return empty results",
              "Subagents cannot handle all query types; each specializes in a narrow domain",
              "The coordinator fails to dynamically select subagents per query, adding latency and cost",
            ],
            correct: 3,
            explanation: "Coordinator agents should analyze query requirements and dynamically invoke only the subagents needed. Routing a simple factual question through all four subagents is wasteful. The architecture doesn't have a fixed cap on subagent count (C is wrong), and empty results from optional subagents should be handled gracefully (D is a manageable concern, not the root problem).",
          },
        ],
      },
      {
        id: "1.3",
        title: "Configure subagent invocation, context passing, and spawning",
        knowledge: [
          "The Task tool is the mechanism for spawning subagents; the coordinator's allowedTools must include \"Task\" for subagent invocation to work",
          "Subagent context must be explicitly provided in the prompt — subagents do not automatically inherit parent context or share memory between invocations",
          "AgentDefinition configuration includes descriptions, system prompts, and tool restrictions for each subagent type",
          "Fork-based session management enables exploring divergent approaches from a shared analysis baseline",
        ],
        skills: [
          "Include complete findings from prior agents directly in the subagent's prompt (e.g., pass web search results and document analysis outputs to the synthesis subagent)",
          "Use structured data formats to separate content from metadata (source URLs, document names, page numbers) when passing context between agents to preserve attribution",
          "Spawn parallel subagents by emitting multiple Task tool calls in a single coordinator response rather than across separate turns",
          "Design coordinator prompts that specify research goals and quality criteria rather than step-by-step procedural instructions, to enable subagent adaptability",
        ],
        gotchas: [
          "Expecting subagents to automatically have the coordinator's conversation history — each subagent starts fresh with only its assigned prompt",
          "Spawning subagents sequentially (one Task call per coordinator turn) when they could run in parallel (multiple Task calls in one response)",
          "Writing procedural step-by-step instructions in coordinator prompts instead of specifying goals and quality criteria — this reduces adaptability",
          "Omitting the 'Task' tool from the coordinator's allowedTools, which prevents subagent spawning entirely",
        ],
        questions: [
          {
            id: "m1.3a",
            text: "A coordinator agent spawns a synthesis subagent after web search and document analysis complete. The synthesis subagent produces a generic output unrelated to the specific research findings. What is the most likely cause?",
            options: [
              "The synthesis subagent's system prompt is too permissive and allows off-topic responses",
              "Subagents cannot process structured data from prior agents; results must be reformatted first",
              "The coordinator's allowedTools does not include the synthesis subagent's tools",
              "The coordinator omitted the prior research findings from the synthesis subagent's prompt",
            ],
            correct: 3,
            explanation: "Subagents do not automatically inherit context from the coordinator or prior agents. If the synthesis subagent produces generic output, it's because it never received the actual research findings — they must be explicitly included in its prompt. Options C and D describe different problems. Option B is false; subagents can process structured data from prior agents.",
          },
          {
            id: "m1.3b",
            text: "To research three independent subtopics, a coordinator calls one Task tool per turn, waiting for each subagent to complete before spawning the next. What improvement should be made?",
            options: [
              "Use a single subagent with all three subtopics in one prompt to avoid multiple Task calls",
              "Emit all three Task tool calls in a single coordinator response",
              "Use fork_session instead of Task for independent research branches",
              "Replace Task calls with direct API calls so the coordinator can await each result synchronously",
            ],
            correct: 1,
            explanation: "Parallel subagent execution is achieved by emitting multiple Task tool calls in a single coordinator response. This allows all three subagents to run concurrently rather than sequentially. Option D trades parallelism for a monolithic prompt that may produce worse results. Option C bypasses the agent system. fork_session is for session branching, not parallel task execution.",
          },
          {
            id: "m1.3c",
            text: "A coordinator delegates with goal-oriented prompts — stating the outcome it wants rather than the steps to take. How does it keep visibility and control over what its subagents actually do?",
            options: [
              "By re-invoking the subagent after every tool call so the coordinator can approve or redirect the next step it takes.",
              "By listing the exact sequence of tool calls each subagent should make inside the body of the goal statement.",
              "By defining success criteria, a required output schema, and the set of tools each subagent is permitted to use.",
              "By granting each subagent read access to the coordinator's conversation history so its reasoning remains observable.",
            ],
            correct: 2,
            explanation: "Goal-oriented delegation trades prescribed steps for adaptability, and the coordinator recovers control at the boundaries instead of in the middle: success criteria say what a good result is, the output schema constrains what comes back, and tool restrictions bound what the subagent can reach. Option B is procedural delegation wearing a goal-shaped label — it reintroduces the brittleness that goal orientation exists to avoid. Option D misstates how subagents work: they do not inherit the coordinator's conversation history, and context must be passed explicitly in the prompt. Option A destroys the adaptability being sought and adds a round-trip per tool call.",
          },
        ],
      },
      {
        id: "1.4",
        title: "Implement multi-step workflows with enforcement and handoff patterns",
        knowledge: [
          "Programmatic enforcement (hooks, prerequisite gates) provides deterministic compliance — prompt-based guidance is probabilistic and has a non-zero failure rate",
          "When deterministic compliance is required (e.g., identity verification before financial operations), prompt instructions alone are insufficient",
          "Structured handoff protocols for mid-process escalation must include: customer details, root cause analysis, and recommended actions — not just a status flag",
        ],
        skills: [
          "Implement programmatic prerequisites that block downstream tool calls until prerequisite steps have completed (e.g., blocking process_refund until get_customer has returned a verified customer ID)",
          "Decompose multi-concern customer requests into distinct items, investigate each in parallel using shared context, then synthesize a unified resolution",
          "Compile structured handoff summaries when escalating to human agents who lack access to the conversation transcript",
        ],
        gotchas: [
          "Relying on system prompt instructions or few-shot examples to enforce tool ordering when the compliance requirement is deterministic — these approaches have non-zero failure rates",
          "Processing multi-concern requests sequentially when concerns are independent and could be investigated in parallel",
          "Incomplete handoff summaries: escalating to a human with only a status code, omitting customer details, root cause, and recommended actions",
          "Prompt position (e.g., 'move rule to the top') as a reliability fix — position affects attention but does not make compliance deterministic",
        ],
        questions: [
          {
            id: "m1.4a",
            text: "Production data shows an agent skips get_customer in 12% of sessions and calls lookup_order directly using only the customer's stated name, causing misidentified accounts. What change most effectively eliminates this?",
            options: [
              "Add few-shot examples showing the agent always calling get_customer first",
              "Enhance the system prompt to state that customer verification is mandatory before any order operations",
              "Implement a routing classifier that enables only appropriate tools per request type",
              "Add a programmatic prerequisite that blocks order calls until get_customer returns a verified ID",
            ],
            correct: 3,
            explanation: "A programmatic prerequisite is deterministic — it blocks the downstream call regardless of what the model decides. Options D and A rely on probabilistic LLM compliance, which the 12% failure rate demonstrates is insufficient. Option C addresses tool availability, not tool ordering, which is the actual problem.",
          },
          {
            id: "m1.4b",
            text: "When escalating a case to a human agent, the system sends only the customer's account ID and a 'ESCALATED' status flag. What critical information is missing from this handoff?",
            options: [
              "The model's confidence score for the escalation decision, so the human can gauge how certain the agent was",
              "The full raw conversation transcript in an unstructured format",
              "A list of all tools that were called during the session",
              "Root cause analysis, attempted resolution, and recommended next actions",
            ],
            correct: 3,
            explanation: "Structured handoff protocols must include customer details, root cause analysis, and recommended actions — human agents need enough context to continue without access to the full conversation transcript. Confidence scores (B) are unreliable proxies. A raw transcript (D) is often too verbose and hard for humans to parse quickly. A tool call list (C) is not the primary need.",
          },
        ],
      },
      {
        id: "1.5",
        title: "Apply Agent SDK hooks for tool call interception and data normalization",
        knowledge: [
          "PostToolUse hooks intercept tool results for transformation before the model processes them — use for normalizing heterogeneous data formats across multiple MCP tools",
          "PreToolUse hooks intercept outgoing tool calls before execution — use for enforcing compliance rules (e.g., blocking refunds above a threshold)",
          "The key distinction: hooks provide deterministic guarantees; prompt instructions provide probabilistic compliance. Business rules requiring 100% enforcement must use hooks",
        ],
        skills: [
          "Implement PostToolUse hooks to normalize heterogeneous data formats (Unix timestamps, ISO 8601, numeric status codes) from different MCP tools before the agent processes them",
          "Implement PreToolUse tool call interception that blocks policy-violating actions (e.g., refunds exceeding $500) and redirects to alternative workflows (e.g., human escalation)",
          "Choose hooks over prompt-based enforcement when business rules require guaranteed compliance",
        ],
        gotchas: [
          "Using prompt instructions or few-shot examples instead of hooks when a business rule requires 100% enforcement — examples are demonstrations, not enforcers",
          "Confusing PostToolUse (fires after the tool returns, on the result) with PreToolUse (fires before the tool executes) — the guard for dangerous actions must be Pre, not Post",
          "Implementing a PostToolUse hook on a safe tool to set a session flag, then checking that flag in the dangerous tool's handler — the guard must be a PreToolUse on the dangerous tool itself",
        ],
        questions: [
          {
            id: "m1.5a",
            text: "An agent uses three MCP tools that each return timestamps in different formats: Unix epoch, ISO 8601, and 'MM/DD/YYYY'. The model frequently misinterprets dates due to format inconsistency. What is the most appropriate fix?",
            options: [
              "A PostToolUse hook that normalizes timestamps to ISO 8601 in tool results",
              "Update each MCP tool's implementation to return ISO 8601 timestamps directly",
              "Add system prompt instructions telling the model to convert all timestamps to a standard format",
              "A PreToolUse hook that rewrites timestamps in the outgoing tool call parameters",
            ],
            correct: 0,
            explanation: "PostToolUse hooks intercept tool results and transform them before the model sees them — the ideal solution for normalizing output formats. This is deterministic and doesn't require model compliance (D). PreToolUse (B) fires before execution, not after, and cannot modify results. Updating each tool (A) may not be feasible for third-party MCP servers.",
          },
          {
            id: "m1.5b",
            text: "Business policy requires all refunds over $500 to go through a human approval workflow. The agent occasionally processes large refunds autonomously despite system prompt instructions. What provides the strongest guarantee of compliance?",
            options: [
              "Move the refund limit rule to the top of the system prompt for maximum salience",
              "A PreToolUse hook on process_refund that reroutes refunds over $500 to escalate_to_human",
              "Set tool_choice to 'any' so the model always selects an appropriate action",
              "Add 6 few-shot examples demonstrating the agent escalating for large refunds",
            ],
            correct: 1,
            explanation: "A PreToolUse hook reads the actual refund amount at runtime and deterministically reroutes — the model cannot bypass it. Prompt position (B) and few-shot examples (D) are both probabilistic; the scenario already demonstrates prompt-based approaches fail. tool_choice: 'any' (C) controls whether a tool is called at all, not what happens based on parameter values.",
          },
        ],
      },
      {
        id: "1.6",
        title: "Design task decomposition strategies for complex workflows",
        knowledge: [
          "Fixed sequential pipelines (prompt chaining): break work into sequential steps — best for predictable, multi-aspect reviews where each step is well-defined upfront",
          "Dynamic adaptive decomposition: generate subtasks based on what's discovered at each step — best for open-ended investigations where the path depends on intermediate findings",
          "Single-pass review of many files causes attention dilution: detailed feedback for some files, superficial comments or contradictory findings for others",
        ],
        skills: [
          "Select prompt chaining for predictable multi-aspect reviews (e.g., analyze each file, then run a cross-file integration pass — the structure is known upfront)",
          "Select dynamic decomposition for open-ended tasks (e.g., 'add comprehensive tests to a legacy codebase' — first map structure, then identify high-impact areas, then create a prioritized plan that adapts as dependencies are discovered)",
          "Split large code reviews into per-file local analysis passes plus a separate cross-file integration pass to prevent attention dilution",
        ],
        gotchas: [
          "Using dynamic adaptive decomposition for predictable multi-step reviews where the structure is known upfront — prompt chaining is simpler and more reliable",
          "Using fixed sequential chaining for open-ended investigations where what to do next depends on what was found — this misses the adaptive advantage",
          "Single-pass review across many files (15+): the model gives deep analysis to early files and superficial or contradictory feedback to later ones",
        ],
        questions: [
          {
            id: "m1.6a",
            text: "A code review pipeline analyzes all 14 files in a pull request in a single prompt. Results show detailed feedback for the first 3 files but superficial comments, missed bugs, and contradictory findings for the rest. What restructuring addresses the root cause?",
            options: [
              "Switch to a model with a larger context window to give all 14 files adequate attention simultaneously",
              "Require developers to split large PRs into submissions of 3-4 files before automated review runs",
              "Run three independent review passes on the full PR and flag only issues that appear in at least two passes",
              "Split into per-file local analysis passes, then a separate cross-file integration pass",
            ],
            correct: 3,
            explanation: "The root cause is attention dilution from processing too many files simultaneously. Per-file passes ensure each file gets focused analysis; a separate integration pass catches cross-file issues. A larger context window (A) doesn't solve attention quality degradation. Three independent passes on all 14 files (C) would require consensus, suppressing real single-instance bugs. Option B shifts burden to developers without fixing the review architecture.",
          },
          {
            id: "m1.6b",
            text: "A team needs to add comprehensive test coverage to a 50,000-line legacy codebase with unknown dependencies. Which decomposition approach is most appropriate?",
            options: [
              "Spawn one subagent per source file in parallel, each independently generating its own test file",
              "Fixed sequential pipeline: define all test file targets upfront, then generate tests for each file in order",
              "Dynamic adaptive decomposition: map structure, then adapt the plan as dependencies surface",
              "Single-pass: provide the full codebase and request a complete test suite in one prompt",
            ],
            correct: 2,
            explanation: "An open-ended investigation on an unknown codebase requires dynamic decomposition — what to test and in what order depends on what the structure analysis reveals. A fixed sequential pipeline (D, A) works when the steps are predictable upfront, but 'unknown dependencies' means the approach must adapt. A single-pass (C) on a 50K-line codebase will produce poor results due to context limits and attention dilution.",
          },
        ],
      },
      {
        id: "1.7",
        title: "Manage session state, resumption, and forking",
        knowledge: [
          "Named session resumption using --resume <session-name> continues a specific prior conversation with its full context intact",
          "fork_session creates independent branches from a shared analysis baseline to explore divergent approaches without contaminating the original session",
          "After resuming a session following code modifications, the agent must be explicitly informed about which files changed — it cannot detect file changes that happened outside the session",
          "Starting fresh with a structured summary is more reliable than resuming when prior tool results are stale (e.g., from a codebase that has since been refactored)",
        ],
        skills: [
          "Use --resume with session names to continue named investigation sessions across work sessions",
          "Use fork_session to create parallel exploration branches (e.g., comparing two refactoring approaches from a shared codebase analysis)",
          "Choose between session resumption (prior context is mostly valid) vs starting fresh with an injected summary (prior tool results are stale)",
          "When resuming after file changes, inform the agent about specific changed files for targeted re-analysis rather than requiring full re-exploration",
        ],
        gotchas: [
          "Resuming a session when prior tool results are stale — the model may reference outdated file contents or structures and give incorrect answers",
          "Not informing a resumed session about file changes, causing the agent to reason from cached/stale observations about files that have since changed",
          "Using fork_session when simple continuation is all that's needed — fork_session is for genuinely divergent exploration, not for sequential continuation",
          "Assuming --resume replays tool calls — it restores conversation context, not tool outputs; stale results in context remain stale",
        ],
        questions: [
          {
            id: "m1.7a",
            text: "After a long debugging session, a developer refactors 8 files and then resumes the named session with --resume to continue. The agent gives incorrect answers referencing the old file structure. What is the correct approach?",
            options: [
              "Resume as normal but add a message asking the agent to re-read all project files from scratch",
              "Start a new session and inject a structured summary plus the list of changed files",
              "Continue in the resumed session — the model will detect file changes through its context awareness",
              "Use fork_session to branch from the old analysis and continue in the fork",
            ],
            correct: 1,
            explanation: "When prior tool results are stale (files have changed), resuming with those stale results in context leads to incorrect reasoning. Starting fresh with a structured summary of what was learned plus specific information about what changed is more reliable. Re-reading all files (D) within the resumed session still starts from a stale context baseline. fork_session (C) branches from the same stale context. Models cannot detect external file changes (B).",
          },
          {
            id: "m1.7b",
            text: "A team wants to compare two refactoring strategies for the same module: one that extracts a service layer and one that implements the repository pattern. Both start from the same codebase analysis. Which approach best supports this?",
            options: [
              "Use fork_session after the shared analysis to explore each strategy in its own branch",
              "Complete the service-layer strategy fully before starting the repository-pattern investigation sequentially",
              "Use --resume twice, once for each strategy, resuming the same session with different instructions each time",
              "Run two entirely independent sessions from scratch, each starting with the full codebase analysis",
            ],
            correct: 0,
            explanation: "fork_session is designed exactly for this: divergent exploration from a shared baseline. Two independent sessions (D) waste time repeating the shared codebase analysis. Using --resume for both strategies (A) overwrites the same session context rather than branching it. Sequential investigation (B) doesn't allow genuine comparison of approaches explored under the same initial conditions.",
          },
          {
            id: "m1.7c",
            text: "A developer resumes a named session with --resume after editing several config files outside the session. The agent confidently describes those files as they were before the edits. Which statement explains this behaviour?",
            options: [
              "--resume rebuilds the session's system prompt on restore, which clears the agent's memory of the earlier file reads.",
              "--resume discards tool_result blocks while restoring, so the agent retains no record of what it previously read from disk.",
              "--resume restores conversation context, not file state, so the earlier tool results sit in context exactly as captured.",
              "--resume replays the session's prior tool calls, so their cached outputs must be invalidated by hand before re-running.",
            ],
            correct: 2,
            explanation: "Resumption restores conversation context — it does not re-execute tools or re-read the filesystem. Whatever a Read returned during the original session stays in context verbatim, so post-session edits are invisible and the agent reasons from stale observations. That is why a resumed session must be told which files changed, so it can re-analyse just those targets instead of re-exploring everything. Option D is the common inversion of this: --resume does not replay tool calls. Option B is wrong in the opposite direction — tool results are preserved, which is precisely the problem. Option A describes something --resume does not do; the agent's recollection of earlier reads is intact and stale, not cleared.",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Tool Design & MCP Integration",
    weight: 18,
    taskStatements: [
      {
        id: "2.1",
        title: "Design effective tool interfaces with clear descriptions and boundaries",
        knowledge: [
          "Tool descriptions are the primary mechanism LLMs use for tool selection — minimal descriptions lead to unreliable selection among similar tools",
          "Effective tool descriptions include: input formats, example queries, edge cases, boundary explanations, and when to use this tool vs similar alternatives",
          "Ambiguous or overlapping tool descriptions cause misrouting — e.g., analyze_content vs analyze_document with near-identical descriptions",
          "System prompt wording can affect tool selection: keyword-sensitive instructions can create unintended tool associations that override well-written descriptions",
        ],
        skills: [
          "Write tool descriptions that clearly differentiate each tool's purpose, expected inputs, outputs, and when to use it versus similar alternatives",
          "Rename tools and update descriptions to eliminate functional overlap (e.g., rename analyze_content to extract_web_results with a web-specific description)",
          "Split generic tools into purpose-specific tools with defined input/output contracts",
          "Review system prompts for keyword-sensitive instructions that might unintentionally override well-written tool descriptions",
        ],
        gotchas: [
          "Minimal descriptions like 'Retrieves customer information' — the model lacks context to differentiate between similar tools and will misroute",
          "Two tools with overlapping descriptions causing systematic misrouting; the fix is disambiguating descriptions or renaming, not adding few-shot examples in the system prompt",
          "System prompt keywords that inadvertently create associations between phrases and specific tools, overriding the tool descriptions",
          "Consolidating two similar tools into one 'just in case' — this increases the complexity of the single tool and may worsen selection for the common case",
        ],
        questions: [
          {
            id: "m2.1a",
            text: "Production logs show that when users ask about orders (e.g., 'check my order #12345'), the agent calls get_customer instead of lookup_order. Both tools have minimal descriptions ('Retrieves customer information' / 'Retrieves order details') and accept similar identifier formats. What is the most effective first fix?",
            options: [
              "Consolidate both tools into a single lookup_entity tool that accepts any identifier and internally determines which backend to query",
              "Expand each tool's description with input formats, example queries, and clear usage boundaries",
              "Add 5–8 few-shot examples to the system prompt showing order-related queries routing to lookup_order",
              "Implement a routing layer that parses user input and pre-selects the appropriate tool based on detected keywords",
            ],
            correct: 1,
            explanation: "Tool descriptions are the primary mechanism for tool selection. Minimal descriptions cause misrouting; expanding them with examples and clear boundaries directly addresses the root cause. Few-shot examples (C) add token overhead without fixing the underlying description problem. A routing layer (D) is over-engineered and bypasses the model's natural language understanding. Consolidating tools (A) is a valid architectural choice but more complex than a description fix and may not be the right first step.",
          },
          {
            id: "m2.1b",
            text: "A system has two tools: analyze_content (for web pages) and analyze_document (for uploaded files). Their descriptions are nearly identical: 'Analyzes content and extracts key information.' The model frequently calls analyze_content for uploaded documents. What is the most direct fix?",
            options: [
              "Rename analyze_content to extract_web_results and rewrite both descriptions to specify their distinct inputs",
              "Merge both tools into a single analyze tool and use a content_type parameter to distinguish input",
              "Remove analyze_document and handle all analysis through analyze_content with a format parameter",
              "Add a disambiguation section to the system prompt listing which tool handles which content type",
            ],
            correct: 0,
            explanation: "Renaming the tool and rewriting both descriptions eliminates the overlap at the source — the tool descriptions themselves. System prompt disambiguation (B) may conflict with tool descriptions and is less reliable than fixing the descriptions directly. Merging into one tool (A) doesn't fix the selection problem; now there's just one tool with a parameter the model must select correctly. Removing a tool (C) removes real functionality.",
          },
        ],
      },
      {
        id: "2.2",
        title: "Implement structured error responses for MCP tools",
        knowledge: [
          "The MCP isError flag pattern signals tool failures back to the agent while allowing the conversation to continue rather than crashing",
          "Error categories: transient (timeouts, unavailability), validation (invalid input), business (policy violations), permission (access denied) — each requires different recovery",
          "Generic 'Operation failed' responses prevent the agent from making appropriate recovery decisions — it can't know whether to retry, reformulate, or escalate",
          "Retryable vs non-retryable errors: include an isRetryable boolean so the agent doesn't waste retries on non-recoverable failures",
        ],
        skills: [
          "Return structured error metadata: errorCategory (transient/validation/business/permission), isRetryable boolean, and human-readable descriptions",
          "For business rule violations (e.g., refund above threshold): include retriable: false and a customer-friendly explanation the agent can relay",
          "Subagents should implement local recovery for transient failures and only propagate errors they cannot resolve locally, along with partial results and what was attempted",
          "Distinguish access failures (search service down → retry decision) from valid empty results (query returned no matches → valid, proceed without results)",
        ],
        gotchas: [
          "Returning a generic error string without errorCategory or isRetryable — the agent can't make intelligent recovery decisions",
          "Returning empty results as success when a tool access failure occurred — this silently suppresses the error and the coordinator proceeds with incomplete data",
          "Propagating all errors up to the coordinator even when local recovery is possible (e.g., a transient timeout that a simple retry would resolve)",
          "Not distinguishing 'no results found' (a valid successful query with an empty result set) from 'search service unavailable' (an error requiring retry or alternative approach)",
        ],
        questions: [
          {
            id: "m2.2a",
            text: "An MCP tool returns 'ERROR: service unavailable' as a plain string when the backend times out. What structured error response would best enable intelligent agent recovery?",
            options: [
              "{ result: [], status: 'failed' }",
              "{ isError: true, errorCategory: 'transient', isRetryable: true, message: 'Backend timed out' }",
              "Throw an exception that propagates up to the top-level error handler for centralized logging",
              "{ isError: true, message: 'Operation failed' }",
            ],
            correct: 1,
            explanation: "Structured error metadata — errorCategory, isRetryable, and a descriptive message — gives the agent the information to make intelligent recovery decisions: retry (transient), reformulate (validation), escalate (business), or skip (permission). Generic messages (A) and empty result arrays (C) hide the error type. Propagating exceptions (B) may terminate the entire workflow unnecessarily.",
          },
          {
            id: "m2.2b",
            text: "A search tool catches a timeout exception and returns an empty array `[]` with no error flag. How does this affect the coordinator agent?",
            options: [
              "This is the correct pattern: empty results are always the safest response to return on failure",
              "The agent will detect the access failure from the empty array and escalate appropriately",
              "The coordinator treats it as a valid empty result and proceeds, never knowing the search failed",
              "The coordinator will retry automatically because empty arrays trigger the default retry logic",
            ],
            correct: 2,
            explanation: "Returning empty results as success when an access failure occurred silently suppresses the error. The coordinator proceeds without knowledge that results are missing due to failure rather than genuinely not existing. This is a critical anti-pattern because the coordinator cannot make appropriate recovery decisions (retry, use alternative source, annotate output with coverage gaps) when the failure is hidden.",
          },
        ],
      },
      {
        id: "2.3",
        title: "Distribute tools appropriately across agents and configure tool choice",
        knowledge: [
          "Giving an agent too many tools (e.g., 18 instead of 4–5) degrades tool selection reliability by increasing decision complexity",
          "Agents with tools outside their specialization tend to misuse them (e.g., a synthesis agent attempting web searches instead of synthesizing provided findings)",
          "Scoped tool access: agents get only the tools needed for their role, with limited cross-role tools for specific high-frequency needs",
          "tool_choice configuration: 'auto' (model may return text instead of calling a tool), 'any' (model must call a tool but can choose which), forced ({type: 'tool', name: '...'} — model must call this specific tool)",
        ],
        skills: [
          "Restrict each subagent's tool set to those relevant to its role, preventing cross-specialization misuse",
          "Replace generic tools with constrained alternatives (e.g., replacing fetch_url with load_document that validates document URLs)",
          "Provide scoped cross-role tools for high-frequency needs (e.g., a verify_fact tool for the synthesis agent) while routing complex cases through the coordinator",
          "Use tool_choice forced selection to ensure a specific tool is called first (e.g., force extract_metadata before enrichment tools)",
          "Set tool_choice: 'any' to guarantee the model calls a tool rather than returning conversational text",
        ],
        gotchas: [
          "Giving all agents access to all tools 'for flexibility' — this degrades selection reliability and causes specialization misuse",
          "Using tool_choice: 'auto' when you need guaranteed structured output — the model may return conversational text instead of calling the extraction tool",
          "Confusing 'auto' (model decides whether to call a tool at all) vs 'any' (model must call some tool) vs forced (model must call this specific tool)",
          "Not using tool_choice: 'any' for extraction pipelines on unknown document types where you can't force a specific tool but must ensure structured output",
        ],
        questions: [
          {
            id: "m2.3a",
            text: "A synthesis agent has access to 12 tools including web search, document fetch, and database query tools it never needs for synthesis. It occasionally calls web search during synthesis instead of synthesizing the findings already provided. What is the most direct fix?",
            options: [
              "Add system prompt instructions telling the synthesis agent never to call web search tools",
              "Add a routing classifier that intercepts synthesis agent tool calls and blocks unauthorized ones",
              "Restrict the synthesis agent's allowedTools to only what synthesis needs, removing search/fetch tools",
              "Consolidate all tools into one multi-purpose tool to simplify the synthesis agent's decision",
            ],
            correct: 2,
            explanation: "The principle of least privilege: agents should only have access to tools they need for their role. Removing the misused tools from allowedTools deterministically prevents the misuse. Prompt instructions (A) are probabilistic. A routing classifier (B) is architectural over-engineering when the fix is simply restricting tool access. Consolidating into one tool (D) doesn't fix the fundamental issue.",
          },
          {
            id: "m2.3b",
            text: "An extraction pipeline must process documents of unknown types and output structured JSON. The extraction tool is defined but sometimes the model returns conversational text instead of calling it. What tool_choice setting guarantees structured output?",
            options: [
              "tool_choice: { type: 'tool', name: 'extract_data' } — forces a specific tool call",
              "tool_choice: 'auto' — allows the model to decide whether structured output is appropriate",
              "No tool_choice needed; more system prompt examples will ensure the model calls the tool",
              "tool_choice: 'any' — forces the model to call some tool, preventing conversational text responses",
            ],
            correct: 3,
            explanation: "tool_choice: 'any' guarantees the model calls at least one tool, eliminating the risk of conversational text responses. 'auto' (A) is the problem — it allows text returns. Forced specific tool (D) works when document type is known and the right tool can be specified; for unknown document types with multiple potential extraction tools, 'any' is more appropriate. System prompt examples (C) are probabilistic.",
          },
          {
            id: "m2.3c",
            text: "A billing workflow must call find_invoice(customer, date), which returns an invoice_id, and then get_invoice_pdf(invoice_id). Which configuration reliably gets a real invoice_id into get_invoice_pdf?",
            options: [
              "List find_invoice ahead of get_invoice_pdf in the tools array so the model calls them in declaration order.",
              "Set tool_choice to { type: 'tool', name: 'get_invoice_pdf' } on the first call so the PDF step isn't skipped.",
              "Set tool_choice to 'any' on the first request so the model calls both tools within the same assistant turn.",
              "Force find_invoice on the first request, return its result, then let the model call get_invoice_pdf next turn.",
            ],
            correct: 3,
            explanation: "The dependent tool needs an argument that only the prerequisite tool can produce, so the calls must be split across turns: force find_invoice, feed its tool_result back, and the model then has a real invoice_id for get_invoice_pdf. Forcing get_invoice_pdf first (B) compels the model to invent an invoice_id. tool_choice: 'any' (C) only guarantees that some tool is called and cannot make a same-turn dependent call valid. Tool array order (A) has no effect on selection or ordering.",
          },
        ],
      },
      {
        id: "2.4",
        title: "Integrate MCP servers into Claude Code and agent workflows",
        knowledge: [
          "MCP server scoping: project-level .mcp.json (shared with all team members via version control) vs user-level ~/.claude.json (personal, not shared)",
          "Environment variable expansion in .mcp.json (e.g., ${GITHUB_TOKEN}) allows credential management without committing secrets to version control",
          "Tools from all configured MCP servers are discovered at connection time and available simultaneously to the agent",
          "MCP resources expose content catalogs (issue summaries, documentation hierarchies, database schemas) that reduce exploratory tool calls",
        ],
        skills: [
          "Configure shared team MCP servers in project-scoped .mcp.json with environment variable expansion for authentication tokens",
          "Configure personal/experimental MCP servers in user-scoped ~/.claude.json to avoid sharing them with the team",
          "Enhance MCP tool descriptions to explain capabilities and outputs in detail, preventing the agent from preferring built-in tools (like Grep) over more capable MCP tools",
          "Prefer existing community MCP servers for standard integrations; reserve custom servers for team-specific workflows",
        ],
        gotchas: [
          "Putting shared team MCP server config with credentials in ~/.claude.json — it's not version-controlled, so teammates won't have the server configured",
          "Putting personal/experimental MCP servers in .mcp.json — this shares the experimental config with everyone who clones the repo",
          "Hardcoding credentials directly in .mcp.json instead of using ${ENV_VAR} expansion — credentials get committed to version control",
          "Assuming built-in tools (Grep, Bash) will always be preferred by the model over MCP tools — MCP tool descriptions must be detailed enough to win selection",
        ],
        questions: [
          {
            id: "m2.4a",
            text: "A team's GitHub MCP server should be available to all developers when they clone the project. A new developer reports the MCP server isn't available in their Claude Code session. Where was the configuration placed incorrectly?",
            options: [
              "In ~/.claude.json on the original developer's machine — user-scoped config is not shared via version control",
              "In .claude/config.json — this file path is not a valid MCP configuration location",
              "In .mcp.json in the project root — project-scoped config is shared via git but only takes effect after each developer runs git pull and restarts their session",
              "In the CLAUDE.md file — MCP server config belongs in .mcp.json, not CLAUDE.md",
            ],
            correct: 0,
            explanation: "~/.claude.json is user-scoped and not version-controlled — it only exists on the original developer's machine. For team-shared MCP servers, configuration must be in the project's .mcp.json file, which is version-controlled and available to all developers after cloning. CLAUDE.md is for project context and instructions, not server configuration.",
          },
          {
            id: "m2.4b",
            text: "A developer wants to test an experimental MCP server without exposing it to teammates who work in the same repository. Where should they configure it?",
            options: [
              "In ~/.claude.json (user-scoped) — personal config that is not version-controlled or shared",
              "In .claude/experimental.json — create a separate experimental config file in the project",
              "In .mcp.json in the project root — this is the standard location for all MCP servers and keeps configuration consistent across the team",
              "In the CLAUDE.md file under an 'experimental tools' section",
            ],
            correct: 0,
            explanation: "User-scoped ~/.claude.json is the correct location for personal/experimental MCP servers. It's not version-controlled, so it won't appear in git or affect teammates. The project .mcp.json (A) is shared with everyone who clones the repo. Options B and D describe non-existent configuration mechanisms.",
          },
          {
            id: "m2.4c",
            text: "A project-scoped .mcp.json committed to the repo configures an MCP server with an auth value of ${API_TOKEN} instead of a literal secret. What does this require of each developer on the team?",
            options: [
              "The literal token must also be committed to .mcp.json as a fallback for when the variable is undefined.",
              "Each developer must set API_TOKEN in their own environment, or the server fails to start for them.",
              "Nothing — Claude Code prompts for the value on first use of the server and caches it for that user.",
              "Nothing — the variable is resolved from the repository's .env file, so no per-developer setup is needed.",
            ],
            correct: 1,
            explanation: "Environment variable expansion keeps the secret out of version control by resolving ${API_TOKEN} from each developer's own environment at server startup, so every developer must provide the value themselves; if the variable is unset, the expansion has nothing to resolve and the server does not start. Option C invents a credential prompt that MCP config expansion does not provide. Option A defeats the entire purpose by committing the secret anyway. Option D assumes automatic repo .env loading, which is not how .mcp.json expansion resolves values.",
          },
        ],
      },
      {
        id: "2.5",
        title: "Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively",
        knowledge: [
          "Grep: content search — searches file contents for patterns (function names, error messages, import statements). Use when you need to find where something appears in code.",
          "Glob: file path pattern matching — finds files by name or extension patterns (e.g., **/*.test.tsx). Use when you need to find files, not their contents.",
          "Read/Write: full file operations. Edit: targeted modifications using unique text matching. When Edit fails because anchor text isn't unique, fall back to Read + Write.",
          "Build codebase understanding incrementally: start with Grep to find entry points, then Read to follow imports and trace flows — don't read all files upfront",
        ],
        skills: [
          "Select Grep for searching code content across a codebase (finding all callers of a function, locating error messages)",
          "Select Glob for finding files matching naming patterns (all test files: **/*.test.tsx)",
          "Use Read to load file contents followed by Write when Edit cannot find unique anchor text",
          "Trace function usage across wrapper modules: first Grep for all exported names, then search for each name across the codebase",
        ],
        gotchas: [
          "Using Read to search for content instead of Grep — reading all files to find a function caller wastes tokens and is slower than a targeted Grep",
          "Using Edit when the anchor text appears multiple times in the file — Edit requires unique text matches; non-unique text causes the edit to fail or apply in the wrong location",
          "Reading all files in a directory upfront instead of building understanding incrementally (Grep entry points → follow imports)",
          "Confusing Grep (file content search) with Glob (file path/name pattern matching)",
        ],
        questions: [
          {
            id: "m2.5a",
            text: "You need to find all files in a codebase that import a specific utility function `formatCurrency`. Which tool is most appropriate?",
            options: [
              "Grep — searches file contents for the import statement pattern across the codebase",
              "Glob — finds files whose path or name matches a pattern, which can locate the files importing formatCurrency",
              "Bash with find — more flexible than built-in tools for this type of search",
              "Read — reads each file to check if it contains the import",
            ],
            correct: 0,
            explanation: "Grep is for content search — finding where a specific string or pattern appears inside files. Searching for all files that import formatCurrency means searching file contents for that string, which is exactly what Grep does. Glob (B) matches file paths/names, not file contents. Read (D) would require reading every file individually, which is very inefficient. Bash find (C) is less appropriate than the dedicated Grep tool.",
          },
          {
            id: "m2.5b",
            text: "An Edit tool call fails because the anchor text 'return user.id;' appears in three different functions in the same file. What is the correct fallback?",
            options: [
              "Use Bash with sed to make the targeted replacement",
              "Use Grep to find which occurrence to edit, then retry Edit with a longer surrounding anchor that is unique",
              "Read the specific lines around the target and attempt Edit with a smaller snippet",
              "Read the full file, make the modification, then Write the file back",
            ],
            correct: 3,
            explanation: "When Edit fails due to non-unique anchor text, the documented fallback is Read + Write: read the full file, make the modification programmatically, and write the entire updated file. Using Grep to find the location and retrying Edit (A) with more context is a reasonable alternative but not the canonical fallback pattern. Bash/sed (D) is fragile for complex edits. Option C describes the same Edit retry approach as B.",
          },
          {
            id: "m2.5c",
            text: "You must understand how session tokens are validated in an unfamiliar 4,000-file service before changing the logic. Which exploration order builds understanding while staying within the context budget?",
            options: [
              "Read every file under src/auth first so nothing relevant is missed, then narrow to the validation path once it is all loaded.",
              "Use Bash with find and cat to dump matching files, since shell pipelines return more output per tool call than built-in tools.",
              "Glob for candidate auth files, Grep those for the validation symbols, then Read only the regions the Grep hits point to.",
              "Read the service entry point, then recursively Read every imported module in full until the validation logic is reached.",
            ],
            correct: 2,
            explanation: "The tools are meant to be layered from cheap and wide to expensive and narrow: Glob matches file paths to produce a candidate set, Grep searches contents to identify which of those files and which lines matter, and Read then loads only those regions. Reading a directory upfront, or recursively reading every import in full, both consume the context window before understanding is built — the documented anti-pattern. Bash with find and cat returns unfiltered bulk output through the shell instead of using the dedicated tools, which makes the context problem worse rather than better.",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Claude Code Configuration & Workflows",
    weight: 20,
    taskStatements: [
      {
        id: "3.1",
        title: "Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization",
        knowledge: [
          "Configuration hierarchy (lowest to highest specificity): user-level (~/.claude/CLAUDE.md) → project-level (CLAUDE.md or .claude/CLAUDE.md) → directory-level (subdirectory CLAUDE.md files)",
          "User-level settings (~/.claude/CLAUDE.md) apply only to that user and are NOT shared with teammates via version control",
          "The @import syntax references external files to keep CLAUDE.md modular (e.g., importing specific standards files relevant to each package)",
          ".claude/rules/ directory: alternative to a monolithic CLAUDE.md — organizes topic-specific rule files (testing.md, api-conventions.md, deployment.md)",
        ],
        skills: [
          "Diagnose configuration hierarchy issues: a new team member not receiving instructions → likely in user-level config, not project-level",
          "Use @import to selectively include relevant standards files in each package's CLAUDE.md based on maintainer domain knowledge",
          "Split large CLAUDE.md files into focused topic-specific files in .claude/rules/",
          "Use the /memory command to verify which memory files are loaded and diagnose inconsistent behavior across sessions",
        ],
        gotchas: [
          "Placing shared team configuration in ~/.claude/CLAUDE.md — this only applies to the person who created it, not the team",
          "Monolithic CLAUDE.md that mixes all conventions — becomes hard to maintain and loads all context even when irrelevant",
          "Confusing project-level (.claude/CLAUDE.md, version-controlled) with user-level (~/.claude/CLAUDE.md, personal)",
          "A new developer not following team conventions → assuming the config is wrong, when the actual cause is the config was placed at user scope instead of project scope",
        ],
        questions: [
          {
            id: "m3.1a",
            text: "A new team member joins and reports that Claude Code doesn't follow the team's coding standards, while all other developers see consistent behavior. What is the most likely cause?",
            options: [
              "The configuration uses @import syntax that requires manual installation of referenced files",
              "The new developer needs to run /memory to activate the configuration",
              "The standards were placed in ~/.claude/CLAUDE.md (user scope) instead of project-level CLAUDE.md",
              "The .claude/rules/ directory needs to be re-created on the new developer's machine",
            ],
            correct: 2,
            explanation: "User-level config (~/.claude/CLAUDE.md) is personal and not version-controlled. When placed there, it only applies to that one developer and is never shared via git. The fix is to move the configuration to project-level CLAUDE.md or .claude/CLAUDE.md so it's committed to the repository and available to all team members. Options A, D, and D describe valid operational concerns but not the root cause of team-inconsistent behavior.",
          },
          {
            id: "m3.1b",
            text: "A project's CLAUDE.md has grown to 800 lines covering testing conventions, API standards, database patterns, deployment rules, and security guidelines. What is the most maintainable reorganization?",
            options: [
              "Split into topic-specific files in .claude/rules/ (testing.md, api-conventions.md, security.md)",
              "Move the least-used sections to ~/.claude/CLAUDE.md to reduce the project-level file size",
              "Compress the 800 lines by removing all examples and keeping only the rule statements",
              "Create separate CLAUDE.md files in each subdirectory that covers a specific area",
            ],
            correct: 0,
            explanation: ".claude/rules/ is designed for this: modular, topic-specific rule files that can be path-scoped to load only when relevant. Compressing by removing examples (A) reduces clarity without fixing the organization problem. Subdirectory CLAUDE.md files (D) are directory-bound and can't easily handle conventions that apply to file types spread across the codebase. Moving sections to user-level (B) removes them from version control and other team members.",
          },
        ],
      },
      {
        id: "3.2",
        title: "Create and configure custom slash commands and skills",
        knowledge: [
          "Project-scoped commands: .claude/commands/ — shared via version control, available to all team members who clone the repo",
          "User-scoped commands: ~/.claude/commands/ — personal, not shared, for individual workflows",
          "Skills in .claude/skills/ use SKILL.md files with frontmatter: context: fork (isolated sub-agent), allowed-tools (restrict tool access), argument-hint (prompt for params)",
          "context: fork runs the skill in an isolated sub-agent context, preventing verbose skill output from polluting the main conversation",
        ],
        skills: [
          "Create project-scoped slash commands in .claude/commands/ for team-wide availability via version control",
          "Use context: fork to isolate skills that produce verbose output (codebase analysis) or exploratory context (brainstorming) from the main session",
          "Configure allowed-tools in skill frontmatter to restrict tool access during skill execution (e.g., limit to file write operations only)",
          "Use argument-hint to prompt developers for required parameters when they invoke the skill without arguments",
          "Choose between skills (on-demand invocation for task-specific workflows) and CLAUDE.md (always-loaded universal standards)",
        ],
        gotchas: [
          "Creating team slash commands in ~/.claude/commands/ instead of .claude/commands/ — personal-scoped commands aren't shared via version control",
          "Not using context: fork for skills that produce verbose output — the verbose output pollutes the main conversation context",
          "Confusing skills (on-demand, invoked when needed) with CLAUDE.md (always-loaded, applies to every session)",
          "Not using argument-hint when a skill requires parameters — developers who invoke it without args get an unhelpful error or wrong behavior",
        ],
        questions: [
          {
            id: "m3.2a",
            text: "A team wants to create a /review slash command that runs their standard code review checklist. Every developer should have access to it when they clone the repository. Where should the command file be created?",
            options: [
              "In the project root CLAUDE.md under a 'commands' section",
              "In ~/.claude/commands/ on each developer's home directory",
              "In .claude/config.json with a 'commands' array",
              "In the .claude/commands/ directory in the project repository",
            ],
            correct: 3,
            explanation: "Project-scoped custom slash commands belong in .claude/commands/ in the repository. These files are version-controlled and automatically available to all developers when they clone or pull the repo. ~/.claude/commands/ (B) is user-scoped and not shared. CLAUDE.md (A) is for project context and instructions, not command definitions. .claude/config.json with a commands array (C) is not a valid Claude Code configuration mechanism.",
          },
          {
            id: "m3.2b",
            text: "A skill that analyzes the full codebase for architecture issues produces 3,000 tokens of detailed output. After running it, developers report the main conversation's context is polluted with analysis noise, making it hard to continue other tasks. What frontmatter option resolves this?",
            options: [
              "allowed-tools: [] — restricting tools prevents the skill from generating excessive output",
              "context: fork — runs the skill in an isolated sub-agent, keeping its verbose output out of the main conversation",
              "Move the skill to ~/.claude/skills/ so it runs in a personal scope that doesn't affect the project's main conversation context",
              "argument-hint — providing better arguments reduces the output length",
            ],
            correct: 1,
            explanation: "context: fork runs the skill in an isolated sub-agent context. The skill's output stays in the sub-agent's context and only the final summary/result is returned to the main conversation, preventing context pollution. allowed-tools (D) restricts which tools the skill can call, not the output volume. argument-hint (B) is for prompting users for parameters. Moving to user-scope (C) makes it unavailable to the team.",
          },
        ],
      },
      {
        id: "3.3",
        title: "Apply path-specific rules for conditional convention loading",
        knowledge: [
          ".claude/rules/ files support YAML frontmatter with a paths field containing glob patterns — rules load only when editing files that match the patterns",
          "Path-scoped rules reduce irrelevant context and token usage: test conventions don't load when editing API handlers",
          "Advantage over subdirectory CLAUDE.md files: path-specific rules apply to files by type across the entire codebase regardless of directory location (e.g., **/*.test.tsx catches test files everywhere)",
        ],
        skills: [
          "Create .claude/rules/ files with YAML frontmatter path scoping: paths: ['terraform/**/*'] so rules load only when editing matching files",
          "Use glob patterns to apply conventions to files by type regardless of directory location (**/*.test.tsx for all test files)",
          "Choose path-specific rules over subdirectory CLAUDE.md when conventions must apply to files spread across multiple directories",
        ],
        gotchas: [
          "Using subdirectory CLAUDE.md for test conventions when test files are scattered across the codebase — CLAUDE.md files are directory-bound and won't apply to test files in other directories",
          "Loading all conventions always (no path scoping) — this fills context with irrelevant rules and increases token usage",
          "Confusing path-specific rules (load when editing matching files) with subdirectory CLAUDE.md (load when in that directory)",
        ],
        questions: [
          {
            id: "m3.3a",
            text: "A codebase has test files spread throughout every directory (Button.test.tsx next to Button.tsx, api.test.ts next to api.ts, etc.). You want all test files to follow the same conventions when Claude edits them. What is the most maintainable approach?",
            options: [
              "Add all testing conventions to the root CLAUDE.md so they always apply",
              "Create a .claude/skills/test-conventions skill that developers invoke when working on tests",
              "Create a CLAUDE.md in each directory that contains test files with the testing conventions",
              "Create .claude/rules/testing.md with frontmatter paths: ['**/*.test.*'] so it loads on any test file",
            ],
            correct: 3,
            explanation: "A path-scoped rule with paths: ['**/*.test.*'] applies conventions to all test files regardless of their location in the directory tree. CLAUDE.md per directory (A) would require maintaining the same conventions in many places and is directory-bound, not file-type-bound. Root CLAUDE.md (B) loads the conventions even when editing non-test files, wasting context. A skill (D) requires manual invocation and won't automatically apply.",
          },
          {
            id: "m3.3b",
            text: "What is the key advantage of using .claude/rules/ files with YAML frontmatter paths over placing a CLAUDE.md in each relevant subdirectory?",
            options: [
              "Rules files use a more efficient binary format that loads and parses faster than plain-text CLAUDE.md files",
              "Path-specific rules activate on the edited file's path anywhere; subdirectory CLAUDE.md only within its directory",
              "Rules files can be version-controlled while subdirectory CLAUDE.md cannot",
              "Rules files support multiple authors while CLAUDE.md is limited to a single maintainer",
            ],
            correct: 1,
            explanation: "The key distinction is activation trigger: subdirectory CLAUDE.md files load when you're working in that directory, while path-specific rules load when the file being edited matches the glob pattern — regardless of which directory it's in. This matters for conventions that span file types scattered across many directories (test files, migration files, configuration files). Both approaches support version control (C is wrong). A and B/C describe non-existent differences.",
          },
        ],
      },
      {
        id: "3.4",
        title: "Determine when to use plan mode vs direct execution",
        knowledge: [
          "Plan mode: designed for complex tasks involving large-scale changes, multiple valid approaches, architectural decisions, and multi-file modifications — enables safe codebase exploration before committing",
          "Direct execution: appropriate for simple, well-scoped changes (e.g., adding a single validation check to one function, a single-file bug fix with a clear stack trace)",
          "The Explore subagent isolates verbose discovery output and returns summaries to preserve the main conversation context during multi-phase tasks",
        ],
        skills: [
          "Select plan mode for: microservice restructuring, library migrations affecting 45+ files, choosing between integration approaches with different infrastructure requirements",
          "Select direct execution for: well-understood changes with clear scope (single-file bug fix with stack trace, adding a date validation conditional)",
          "Use the Explore subagent for verbose discovery phases to prevent context window exhaustion",
          "Combine: plan mode for investigation, direct execution for implementation after the plan is approved",
        ],
        gotchas: [
          "Using direct execution for large-scale architectural changes with unknown dependencies — this risks costly rework when issues are discovered mid-implementation",
          "Using plan mode for simple, well-understood single-file fixes where the correct change is already clear — unnecessary overhead",
          "Not using the Explore subagent to isolate verbose discovery output, letting it fill the main context window during multi-phase investigations",
          "Thinking plan mode and direct execution are mutually exclusive — the recommended pattern is plan (investigate) then direct execution (implement the planned approach)",
        ],
        questions: [
          {
            id: "m3.4a",
            text: "Your team needs to restructure a monolithic application into microservices. This involves changes across dozens of files and requires architectural decisions about service boundaries and module dependencies. Which approach should you take?",
            options: [
              "Start with direct execution and make changes incrementally, letting the implementation itself reveal the natural service boundaries as you go",
              "Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured",
              "Enter plan mode to explore dependencies and design the approach before making changes",
              "Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity",
            ],
            correct: 2,
            explanation: "Plan mode is designed for exactly this scenario: complex tasks with large-scale changes, multiple valid approaches, and architectural decisions. It enables safe exploration and design before committing to changes. Direct execution (A, B) risks costly rework when service boundary issues or unexpected dependencies are discovered after changes have been made. Option D ignores that the complexity is already stated in the requirements, not something that might emerge later.",
          },
          {
            id: "m3.4b",
            text: "A developer has a stack trace pointing to a specific null pointer exception on line 47 of user-service.js. The fix is straightforward: add a null check before the property access. Which approach is most appropriate?",
            options: [
              "Direct execution — the problem, location, and one-line fix are all well-understood; plan mode overhead is not justified",
              "Plan mode — to ensure no other files are affected by the null check",
              "Start a new session with a structured summary of the bug before attempting the fix",
              "Explore subagent first to map the surrounding code, then direct execution based on the subagent's detailed findings",
            ],
            correct: 0,
            explanation: "Direct execution is appropriate for simple, well-scoped changes with a clear fix. A single null check on a known line in a known file is the canonical direct execution case — the problem, location, and solution are all clear. Plan mode (D, A) adds architectural exploration overhead that provides no value when the fix is already known. The Explore subagent (C) is for isolating verbose discovery phases, not for simple fixes with clear scope.",
          },
          {
            id: "m3.4c",
            text: "Which factors should drive the choice between plan mode, direct execution, and a multi-phase workflow for a Claude Code task?",
            options: [
              "Whether the repo has a CLAUDE.md, since documented conventions make an explicit plan redundant.",
              "Whether the change is application code or infrastructure code, since infrastructure always needs plan mode.",
              "Task scope, risk and reversibility, and whether a human must approve before any edit lands.",
              "The model tier in use, since a higher tier can absorb larger changes without an explicit planning step.",
            ],
            correct: 2,
            explanation: "The decision is driven by scope (does the work fit one context or need phases), risk and reversibility (how costly is a wrong edit to undo), and whether approval must happen before mutation — which is precisely what plan mode provides. Option B substitutes a file-category rule for a risk judgement; a one-line infrastructure fix with a clear stack trace is still a direct-execution case. Option D confuses model capability with the need for human review. Option A confuses conventions, which tell Claude how to write code, with a plan, which tells the human what Claude is about to change.",
          },
        ],
      },
      {
        id: "3.5",
        title: "Apply iterative refinement techniques for progressive improvement",
        knowledge: [
          "Concrete input/output examples are the most effective way to communicate expected transformations when prose descriptions are interpreted inconsistently",
          "Test-driven iteration: write test suites first, then iterate by sharing test failures to guide progressive improvement",
          "The interview pattern: have Claude ask clarifying questions to surface design considerations the developer may not have anticipated before implementing",
          "When to provide all issues in a single message vs sequentially: single message for interacting problems (fixes may interfere with each other), sequential for independent problems",
        ],
        skills: [
          "Provide 2–3 concrete input/output examples to clarify transformation requirements when natural language descriptions produce inconsistent results",
          "Write test suites covering expected behavior, edge cases, and performance requirements before implementation, then iterate by sharing test failures",
          "Use the interview pattern to surface cache invalidation strategies, failure modes, and design considerations before implementing in unfamiliar domains",
          "Provide specific test cases with example input and expected output for edge case fixing (e.g., null values in migration scripts)",
          "Address multiple interacting issues in a single detailed message when fixes interact; use sequential iteration for independent issues",
        ],
        gotchas: [
          "Using natural language descriptions when concrete input/output examples would eliminate ambiguity — descriptions get interpreted inconsistently",
          "Sequential fixes when issues interact — fixing issue A breaks the already-applied fix for issue B",
          "Not using the interview pattern in unfamiliar domains — implementing without surfacing hidden constraints leads to rework",
          "Providing all issues in a single message when issues are independent and would be clearer fixed one at a time",
        ],
        questions: [
          {
            id: "m3.5a",
            text: "A developer asks Claude to 'transform the data format to make it more readable.' After three iterations, Claude keeps producing formats the developer doesn't want. What is the most effective refinement technique?",
            options: [
              "Use the interview pattern and ask Claude what transformation it intends to apply",
              "Add more detailed prose instructions explaining what 'readable' means",
              "Switch to plan mode to design the transformation approach before implementing the format change",
              "Provide 2–3 concrete input/output examples showing the exact expected format",
            ],
            correct: 3,
            explanation: "Concrete input/output examples are the most effective technique when prose descriptions are interpreted inconsistently. Three failed iterations indicate that the description 'more readable' is ambiguous to the model. Examples eliminate this ambiguity by showing exactly what's expected. More detailed prose (C) may still be interpreted inconsistently. Plan mode (A) is for architectural scope, not format clarification. The interview pattern (D) is useful before implementation in unfamiliar domains, not for clarifying well-understood output format requirements.",
          },
          {
            id: "m3.5b",
            text: "A code review identifies three bugs: (A) a null pointer in login, (B) a race condition in the session store that the null pointer fix will affect, and (C) an unrelated typo in an error message. How should these be addressed?",
            options: [
              "Fix all three in a single message since they're in the same codebase",
              "Address A and B together in one message (they interact); fix C separately afterward",
              "Fix C first (simplest), then A, then B to build confidence in each fix",
              "Fix all three sequentially in separate messages: A first, then B, then C individually, verifying each",
            ],
            correct: 1,
            explanation: "When fixes interact (D and B), they should be addressed together in a single message — fixing A independently may break or complicate the B fix. When issues are independent (C: an unrelated typo), they can be addressed sequentially. This is the canonical pattern: interacting problems in one message, independent problems sequentially.",
          },
        ],
      },
      {
        id: "3.6",
        title: "Integrate Claude Code into CI/CD pipelines",
        knowledge: [
          "The -p (or --print) flag runs Claude Code in non-interactive mode — processes the prompt and exits without waiting for user input, essential for automated pipelines",
          "--output-format json and --json-schema CLI flags enforce structured output in CI contexts, enabling machine-parseable findings for automated posting as PR comments",
          "CLAUDE.md provides project context (testing standards, fixture conventions, review criteria) to CI-invoked Claude Code",
          "Session context isolation: the same Claude session that generated code is less effective at reviewing it because it retains its reasoning context and is less likely to question its own decisions",
        ],
        skills: [
          "Run Claude Code in CI with the -p flag to prevent interactive input hangs",
          "Use --output-format json with --json-schema to produce machine-parseable structured findings for automated PR comment posting",
          "Include prior review findings in context when re-running reviews after new commits (instruct Claude to report only new or still-unaddressed issues to avoid duplicate comments)",
          "Provide existing test files in context so test generation avoids suggesting duplicate scenarios already covered by the test suite",
          "Document testing standards, valuable test criteria, and available fixtures in CLAUDE.md to improve test generation quality",
        ],
        gotchas: [
          "Running claude without the -p flag in CI — the process will hang indefinitely waiting for interactive input",
          "CLAUDE_HEADLESS=true and --batch are not real Claude Code flags — only -p / --print disables interactive mode",
          "Using the same Claude session that generated the code to review it — self-review bias means it's less likely to catch issues it introduced",
          "Not providing prior review findings when re-running after new commits — generates duplicate PR comments for already-addressed issues",
        ],
        questions: [
          {
            id: "m3.6a",
            text: "A CI pipeline script runs: claude 'Analyze this pull request for security issues'. The job hangs indefinitely. Logs show Claude Code is waiting for interactive input. What is the correct fix?",
            options: [
              "Set the environment variable CLAUDE_HEADLESS=true before running the command",
              "Redirect stdin: claude 'Analyze this pull request for security issues' < /dev/null",
              "Add the -p flag: claude -p 'Analyze this pull request for security issues'",
              "Add the --batch flag: claude --batch 'Analyze this pull request for security issues'",
            ],
            correct: 2,
            explanation: "The -p (or --print) flag is the documented mechanism for non-interactive mode. It processes the prompt and outputs results to stdout, then exits. CLAUDE_HEADLESS=true (A) is not a real Claude Code environment variable. stdin redirection (B) is a Unix workaround that doesn't properly address Claude Code's interactive mode. --batch (D) is not a valid Claude Code CLI flag.",
          },
          {
            id: "m3.6b",
            text: "A team runs automated code review on every PR. After a developer pushes fixes, the review bot posts the same comments again including issues already addressed. How should the pipeline be redesigned?",
            options: [
              "Clear all review history before each run to ensure each review is independent and consistent",
              "Use a separate Claude session for each re-review run, providing only the new commits as context",
              "Increase the review prompt's specificity to prevent Claude from flagging the same issues twice",
              "Include prior findings in context and instruct Claude to report only new or unaddressed issues",
            ],
            correct: 3,
            explanation: "Including prior findings and instructing Claude to only report new or unaddressed issues directly solves the duplicate comment problem. Clearing history (B) is the opposite of what's needed — it loses the context that tells Claude which issues have been addressed. A separate session for only new commits (D) loses the full PR context needed for accurate review. Prompt specificity (C) is too vague; the issue is a missing prior-findings context signal.",
          },
          {
            id: "m3.6c",
            text: "Which combination of Claude Code CLI options suits an unattended CI job that must not hang, must emit parseable results, and must not run away?",
            options: [
              "-p with --output-format json, a --max-turns cap, and an explicit --allowedTools allowlist.",
              "-p with --output-format json plus --dangerously-skip-permissions so no prompt can ever block the job.",
              "An interactive invocation wrapped in a shell timeout, with the findings scraped from the terminal log.",
              "-p on its own, relying on the CI runner's job timeout to stop the agent if it runs for too long.",
            ],
            correct: 0,
            explanation: "Each option addresses one CI failure mode: -p prevents the hang on interactive input, --output-format json makes findings machine-parseable, --max-turns bounds iterations so a stuck agent cannot loop through the budget, and an --allowedTools allowlist pre-authorises exactly the tools needed where no human can approve a prompt. Option B fixes the prompt problem by removing all authorisation limits, which is exactly the danger in CI. Option C keeps the interactive mode that causes the hang and scrapes prose instead of structured output. Option D leaves the agent unbounded and yields a killed process with no result the pipeline can inspect.",
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Prompt Engineering & Structured Output",
    weight: 20,
    taskStatements: [
      {
        id: "4.1",
        title: "Design prompts with explicit criteria to improve precision and reduce false positives",
        knowledge: [
          "Explicit categorical criteria outperform vague instructions: 'flag comments only when claimed behavior contradicts actual code behavior' > 'check that comments are accurate'",
          "General instructions like 'be conservative' or 'only report high-confidence findings' fail to improve precision compared to specific categorical criteria",
          "High false positive rates in specific categories undermine trust in accurate categories — one bad category reduces confidence in the tool overall",
        ],
        skills: [
          "Write specific review criteria defining which issues to report (bugs, security) versus skip (minor style, local patterns) rather than relying on confidence-based filtering",
          "Temporarily disable high false-positive categories while improving their prompts, to restore developer trust in the remaining accurate categories",
          "Define explicit severity criteria with concrete code examples for each severity level to achieve consistent classification",
        ],
        gotchas: [
          "'Be conservative' and 'only report high-confidence findings' are ineffective precision controls — they ask the model to self-regulate without giving it objective criteria to apply",
          "Leaving high-false-positive categories active while trying to fix them — this erodes trust in the categories that are working correctly",
          "Vague criteria like 'check for issues' that require model judgment rather than explicit, testable rules",
          "Improving precision by adding more examples of what NOT to flag — this can help but is secondary to defining explicit categorical inclusion/exclusion criteria",
        ],
        questions: [
          {
            id: "m4.1a",
            text: "A code review tool flags legitimate design patterns as bugs in the 'code quality' category with a 40% false positive rate. Developers are ignoring all 'code quality' findings, including real issues. What is the most effective immediate action?",
            options: [
              "Temporarily disable the 'code quality' category while rewriting its criteria",
              "Add few-shot examples of legitimate patterns so the model learns to skip them",
              "Retrain the review model on the specific codebase's patterns so it learns local conventions",
              "Add 'only report high-confidence findings' to the system prompt to reduce false positives across all categories",
            ],
            correct: 0,
            explanation: "When a high false-positive category erodes trust in the entire tool, temporarily disabling it while improving its criteria restores trust in the accurate categories. Instructions like 'only report high-confidence findings' (B) and 'be more conservative' (C) are vague confidence-based filters that the exam guide explicitly identifies as ineffective compared to categorical criteria. Retraining (A) is out of scope for the exam.",
          },
          {
            id: "m4.1b",
            text: "A review prompt says: 'Check that comments are accurate.' The agent flags both stale comments that describe removed functionality AND comments that use slightly different terminology than the code. How should the criteria be made more precise?",
            options: [
              "Replace with: 'Flag a comment only when it contradicts the code; ignore style differences.'",
              "Add: 'Only flag issues when you are highly confident they are real problems'",
              "Add 5 few-shot examples of accurate vs inaccurate comments",
              "Add: 'Be conservative — only flag obvious inaccuracies'",
            ],
            correct: 0,
            explanation: "Explicit categorical criteria define exactly what to flag and what to skip, eliminating ambiguity. Option A ('highly confident') is the confidence-based filter that the exam guide identifies as ineffective. Few-shot examples (C) can help demonstrate the distinction but are secondary to explicit criteria. 'Be conservative' (D) is vague and doesn't give the model objective rules to apply.",
          },
        ],
      },
      {
        id: "4.2",
        title: "Apply few-shot prompting to improve output consistency and quality",
        knowledge: [
          "Few-shot examples are the most effective technique for achieving consistently formatted, actionable output when detailed instructions alone produce inconsistent results",
          "Few-shot examples demonstrate ambiguous-case handling: showing exactly which action to take when a scenario could be interpreted multiple ways",
          "Few-shot examples enable the model to generalize judgment to novel patterns rather than just matching pre-specified cases",
          "Particularly effective for reducing hallucination in extraction tasks with varied document structures",
        ],
        skills: [
          "Create 2–4 targeted few-shot examples for ambiguous scenarios that show the reasoning for why one action was chosen over plausible alternatives",
          "Include examples showing the desired output format (location, issue, severity, suggested fix) to achieve format consistency",
          "Provide examples distinguishing acceptable code patterns from genuine issues to reduce false positives",
          "Add examples showing correct extraction from documents with varied formats (inline citations vs bibliographies, methodology sections vs embedded details)",
          "Add examples showing correct handling of absent fields (returning null, not fabricating values)",
        ],
        gotchas: [
          "Zero or one examples when the task involves multiple ambiguous scenarios — a single example can't demonstrate the generalization needed",
          "Examples that only cover easy, unambiguous cases — few-shot examples provide the most value for demonstrating correct handling of the ambiguous cases",
          "Thinking that more detailed instructions can substitute for examples — when output format needs to be precisely consistent, examples outperform instructions",
          "Not including examples of edge cases (absent fields, ambiguous document formats) when the task involves variable input structures",
        ],
        questions: [
          {
            id: "m4.2a",
            text: "A code review tool produces inconsistent output formats: sometimes including severity, sometimes omitting it; sometimes providing file paths, sometimes not. The system prompt describes the desired format in detail. What will most effectively achieve consistent formatting?",
            options: [
              "Add even more detailed prose instructions specifying every field and its exact format, ordering, and punctuation",
              "Add 3–4 few-shot examples in the desired output format, covering varied issue types",
              "Set tool_choice: 'any' to force a structured output tool call",
              "Add 'Always follow the format specification exactly' as a system prompt instruction",
            ],
            correct: 1,
            explanation: "When detailed instructions already exist but produce inconsistent results, few-shot examples are the next most effective technique. Examples demonstrate the format concretely and allow the model to generalize to new issues. More prose (A) isn't addressing the root cause — the model is already ignoring or inconsistently applying existing prose. tool_choice (C) works for JSON extraction but changes the entire interaction pattern for a review tool. 'Always follow exactly' (D) is another instruction the model has already been inconsistently following.",
          },
          {
            id: "m4.2b",
            text: "A document extraction pipeline handles both research papers (with formal bibliography sections) and news articles (with inline links and no bibliography). Extraction of citations from news articles is poor. What is the most effective fix?",
            options: [
              "Create separate prompts for research papers and news articles and classify documents first",
              "Add a postprocessing step that converts inline links to citation format after extraction",
              "Add instructions: 'Extract citations from wherever they appear in the document, including inline links'",
              "Add few-shot examples of citation extraction from both formats, including inline links",
            ],
            correct: 3,
            explanation: "Few-shot examples demonstrating extraction from varied document structures allow the model to generalize its extraction approach to the document type it encounters. The exam guide specifically cites 'inline citations vs bibliographies' as the case where few-shot examples are most effective. Separate prompts with classification (C) adds complexity and a classification failure mode. Instructions (D) are already not achieving the goal. Postprocessing (B) adds a fragile pipeline step for a problem solvable in the prompt.",
          },
        ],
      },
      {
        id: "4.3",
        title: "Enforce structured output using tool use and JSON schemas",
        knowledge: [
          "Tool use (tool_use) with JSON schemas is the most reliable approach for guaranteed schema-compliant structured output — eliminates JSON syntax errors",
          "tool_choice options: 'auto' (model may return text), 'any' (model must call a tool, can choose which), forced tool ({type: 'tool', name: '...'} — must call this specific tool)",
          "Strict JSON schemas via tool use eliminate syntax errors but do NOT prevent semantic errors (line items that don't sum to a total, values placed in wrong fields)",
          "Schema design: use optional/nullable fields when source documents may not contain the information — required fields cause the model to fabricate values",
        ],
        skills: [
          "Define extraction tools with JSON schemas as input parameters and extract structured data from the tool_use response",
          "Set tool_choice: 'any' to guarantee structured output when multiple extraction schemas exist and document type is unknown",
          "Force a specific tool with tool_choice: {type: 'tool', name: 'extract_metadata'} to ensure a particular extraction runs before enrichment steps",
          "Design schema fields as optional/nullable when source documents may not contain the information, preventing value fabrication",
          "Add enum values like 'unclear' for ambiguous cases and 'other' + detail fields for extensible categorization",
        ],
        gotchas: [
          "Thinking strict JSON schemas eliminate ALL errors — they eliminate syntax errors but not semantic errors (wrong values in correct-format fields)",
          "Using tool_choice: 'auto' when guaranteed structured output is required — the model may return conversational text instead",
          "Required fields in the schema when source documents might not contain that information — the model will fabricate values to satisfy required fields",
          "Not using nullable/optional fields, forcing fabrication for missing information rather than returning null",
        ],
        questions: [
          {
            id: "m4.3a",
            text: "An extraction system uses tool_use with a strict JSON schema. After deployment, data analysts report that extracted invoice totals don't match the sum of line items, but all JSON is syntactically valid. What is the root cause?",
            options: [
              "tool_use only validates that the tool was called, not that the extracted values are correct",
              "The model is ignoring the schema and generating its own structure",
              "The JSON schema is not strict enough and needs additional validation constraints",
              "Strict JSON schemas eliminate syntax errors but not semantic errors like inconsistent values",
            ],
            correct: 3,
            explanation: "This is the key distinction: strict JSON schemas guarantee syntactic validity (fields present, correct types, no malformed JSON) but cannot prevent semantic errors like line items that don't sum to the total, or values placed in the wrong fields. The fix requires post-extraction validation logic (e.g., calculating and comparing totals). The schema is working correctly (A is wrong). Option B incorrectly describes tool_use's function. D contradicts the question's premise that JSON is valid.",
          },
          {
            id: "m4.3b",
            text: "An extraction tool schema has `publication_date` as a required field, but many source documents don't include publication dates. What problem does this cause?",
            options: [
              "The model will leave the field empty, violating the schema",
              "Required fields in JSON schemas are automatically treated as optional by the Claude API",
              "The model fabricates publication dates to satisfy the required field constraint",
              "The extraction will fail with a hard JSON schema validation error whenever the field is missing from the source",
            ],
            correct: 2,
            explanation: "When a schema has required fields for information that may not exist in the source, the model fabricates values to satisfy the schema rather than return null. Making the field optional/nullable (e.g., 'publication_date': { 'type': ['string', 'null'] }) allows the model to return null when the information isn't available, which is the correct behavior. JSON schema validation (C) is a client-side concern; the model will attempt to provide the field. The Claude API doesn't auto-treat required fields as optional (B).",
          },
          {
            id: "m4.3c",
            text: "Tool use with a JSON input_schema, prefilling the assistant turn with an opening brace, and a prompt instruction to 'respond only in JSON' are three ways to obtain structured output. Which statement correctly describes their relative schema-compliance strictness?",
            options: [
              "Prompt-based JSON instructions are strictest, because the instruction can restate every field name, type, and constraint in natural language.",
              "The three are equivalent in strictness, so the choice depends only on latency and token cost rather than on compliance guarantees.",
              "Prefilling the assistant turn is strictest, because a response that already begins with an opening brace can no longer contain any prose.",
              "Tool use with an input_schema is strictest; prefilling forces the shape but validates nothing; prompt instructions are the weakest.",
            ],
            correct: 3,
            explanation: "Tool use is the only one of the three where the output is constrained by a declared schema, which is why it is the recommended method when compliance must be guaranteed. Prefilling (C) is a real technique that suppresses preambles and code fences and forces the response to open as an object, but nothing checks field names, types, or completeness, and the caller must re-attach the prefix it supplied. Prompt instructions (A) are the weakest: the model may still emit a preamble or wrap the object in a markdown fence. They are not interchangeable (B) — the choice should follow how strictly the downstream consumer needs the schema honored.",
          },
          {
            id: "m4.3d",
            text: "An extraction service sends a tools array but never sets tool_choice, and its parser assumes every response contains a tool_use block. What risk does this design carry?",
            options: [
              "The default is 'none', so tools are invoked only after a request explicitly names one in the tool_choice field.",
              "None — supplying a tools array already prevents the model from returning a text-only response to an extraction request.",
              "The default is 'auto', so the model may answer conversationally and return a response with no tool_use block at all.",
              "The default is 'any', so a tool is always called, but the model may select a different tool than the parser expects.",
            ],
            correct: 2,
            explanation: "When tool_choice is omitted the behavior is 'auto': the model decides whether to call a tool, and it may legitimately respond with text instead — which breaks any consumer that assumes a tool_use block exists. Supplying tools does not by itself force invocation (B). 'any' is not the default (D), though setting it does guarantee some tool is called while leaving the choice to the model. 'none' is not the default either (A); it explicitly forbids tool use. To guarantee invocation, set 'any' or force a specific tool with {'type': 'tool', 'name': '...'}.",
          },
        ],
      },
      {
        id: "4.4",
        title: "Implement validation, retry, and feedback loops for extraction quality",
        knowledge: [
          "Retry-with-error-feedback: appending specific validation errors to the prompt on retry guides the model toward self-correction",
          "Limits of retry: retries are ineffective when the required information is simply absent from the source document — if it's not there, the model cannot extract it",
          "detected_pattern fields in structured findings enable systematic analysis of false positive patterns when developers dismiss findings",
          "Semantic validation errors (values don't sum, wrong field placement) vs schema syntax errors (eliminated by tool use) require different approaches",
        ],
        skills: [
          "Implement follow-up requests including: the original document, the failed extraction, and specific validation errors for model self-correction",
          "Identify when retries will be ineffective (information exists only in an external document not provided) vs when they will succeed (format mismatches, structural output errors)",
          "Add detected_pattern fields to structured findings to enable analysis of false positive patterns when developers dismiss findings",
          "Design self-correction validation: extract calculated_total alongside stated_total to flag discrepancies, add conflict_detected booleans for inconsistent source data",
        ],
        gotchas: [
          "Retrying when information is simply absent from the source document — the model will fabricate rather than succeed, making the problem worse",
          "Generic retry prompts without specific validation error details — 'try again' doesn't tell the model what went wrong or how to fix it",
          "Confusing schema syntax errors (eliminated by tool_use and fixable via retry) with semantic validation errors (require validation logic, not just retrying)",
          "Not distinguishing 'resolvable via retry' (format mismatch, structural error) from 'not resolvable via retry' (missing information in source)",
        ],
        questions: [
          {
            id: "m4.4a",
            text: "An extraction pipeline fails to extract an invoice number from a document. Investigation shows the invoice number is stored in a separate document the agent doesn't have access to. The team proposes adding retry logic. Will this work?",
            options: [
              "No — the invoice number is absent from the document, so retries just push the model to fabricate a value",
              "No — the model should use a web search tool to find the invoice number from external sources",
              "Yes — retries will resolve format mismatches that prevent the invoice number from being detected",
              "Yes — retry logic with error feedback will help the model search the document more thoroughly",
            ],
            correct: 0,
            explanation: "Retries are ineffective when the required information is simply absent from the source. If the invoice number is in a different document, retrying the same prompt against the same document will not produce it — the model will either return null (correct) or fabricate a value (incorrect, worse than no retry). The fix is either providing the correct document or making the field nullable and accepting the null result.",
          },
          {
            id: "m4.4b",
            text: "An extraction returns a date in format 'March 15, 2024' when the schema expects 'YYYY-MM-DD'. What is the most effective retry approach?",
            options: [
              "Retry with a general instruction: 'Your previous extraction had formatting errors. Please be more careful'",
              "Retry with the specific error: 'The date must be ISO format YYYY-MM-DD; reformat March 15, 2024 to 2024-03-15'",
              "Mark the date field as nullable in the schema so the model can skip it when the format is wrong",
              "Use postprocessing to convert the date format rather than retrying",
            ],
            correct: 1,
            explanation: "Retry-with-error-feedback works best when the error is specific and actionable. Including the exact failed value and the exact expected format gives the model clear information for self-correction. An unchanged retry (A) may produce a different format but not necessarily the correct one. A vague error message (B) doesn't tell the model what went wrong. Postprocessing (D) could work for date formatting specifically but doesn't address the broader principle, and the question asks about retry approach.",
          },
          {
            id: "m4.4c",
            text: "Validation rejects the amount field on 18% of documents. Retrying each failure with the specific error and the expected format fixes most individual cases, but the weekly rejection rate stays flat because source documents write amounts as '$1,250.00', '1250', and 'USD 1,250'. What does this indicate?",
            options: [
              "A retry-budget problem: raising the retry limit from one attempt to three will drive the residual rejection rate toward zero.",
              "A missing-information problem: the amounts are absent from the sources, so the field should be nullable and failures accepted.",
              "A systematic format variance: state the target format in the field description and add examples covering the variants.",
              "A validator problem: the amount validator is too strict and should accept whichever surface format the source document used.",
            ],
            correct: 2,
            explanation: "Retry with specific error feedback is the right tool for one-off deviations, but a defect that recurs at a stable rate across the corpus is systematic and belongs in the prompt. Declaring the exact normalized target in the field description and adding few-shot examples that show each surface variant resolving to it fixes the population; retry then only handles residual cases. More retry attempts pay repeated tokens per document without changing the underlying rate. The information is clearly present in the documents, so nullability is the wrong diagnosis and would silently drop real data. Loosening the validator pushes inconsistent values downstream, which is what normalization exists to prevent.",
          },
        ],
      },
      {
        id: "4.5",
        title: "Design efficient batch processing strategies",
        knowledge: [
          "Message Batches API: 50% cost savings, up to 24-hour processing window, no guaranteed latency SLA — appropriate for non-blocking, latency-tolerant workloads",
          "Appropriate batch use cases: overnight reports, weekly audits, nightly test generation — where results are needed the next day",
          "Inappropriate for blocking workflows: pre-merge checks where developers wait for results before merging",
          "The batch API does NOT support multi-turn tool calling within a single request — cannot execute tools mid-request and return results",
          "custom_id fields correlate batch request/response pairs for failure tracking and resubmission",
        ],
        skills: [
          "Match API approach to workflow latency requirements: synchronous API for blocking pre-merge checks, batch API for overnight/weekly analysis",
          "Calculate batch submission frequency based on SLA constraints (e.g., 4-hour submission windows to guarantee 30-hour SLA with 24-hour batch processing)",
          "Handle batch failures: resubmit only failed documents (identified by custom_id) with appropriate modifications",
          "Use prompt refinement on a sample set before batch-processing large volumes to maximize first-pass success rates",
        ],
        gotchas: [
          "Using batch API for blocking pre-merge checks — 24-hour processing means developers may wait a day for merge approval",
          "Assuming the batch API supports multi-turn tool calling — it doesn't; agentic workflows with tool use require the synchronous API",
          "Not using custom_id fields, making it impossible to identify and selectively resubmit failed documents",
          "Switching both time-sensitive and non-time-sensitive workflows to batch — only the non-blocking one benefits",
        ],
        questions: [
          {
            id: "m4.5a",
            text: "A team has two automated analysis workflows: (1) a blocking pre-merge code review that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. A manager proposes switching both to the Message Batches API for 50% cost savings. How should this proposal be evaluated?",
            options: [
              "Use batch only for the overnight report; keep real-time calls for the latency-sensitive pre-merge review",
              "Switch both to batch processing — polling for completion status will mitigate the latency concern for pre-merge checks",
              "Keep real-time calls for both workflows to avoid the complexity of batch result correlation",
              "Switch both to batch with a timeout fallback to real-time if batch takes longer than 30 minutes",
            ],
            correct: 0,
            explanation: "The Message Batches API's up to 24-hour processing window with no guaranteed SLA makes it unsuitable for blocking pre-merge checks where developers need results promptly. The overnight report is the ideal use case: latency-tolerant, overnight generation, results reviewed the next morning. Option C is wrong because relying on 'often faster' completion is unacceptable for blocking workflows. Option D loses cost savings unnecessarily. Option A adds complexity without addressing the fundamental SLA mismatch.",
          },
          {
            id: "m4.5b",
            text: "A batch extraction job processes 500 documents. After completion, 47 documents failed due to content that exceeded the context window. How should failures be handled?",
            options: [
              "Mark the 47 failures as acceptable and proceed with the 453 successful extractions",
              "Switch the entire pipeline to synchronous API calls to avoid batch failures",
              "Resubmit all 500 documents to ensure consistency and reproducibility across the entire batch run",
              "Resubmit only the 47 failed documents (by custom_id), chunking the oversized ones",
            ],
            correct: 3,
            explanation: "custom_id fields are designed exactly for this: correlating request/response pairs so failed documents can be identified and selectively resubmitted with modifications (chunking oversized documents). Resubmitting all 500 (C) wastes cost and time on the 453 already-successful extractions. Accepting failures (A) may be acceptable in some cases but doesn't address the question of how to handle them. Switching to synchronous (B) loses the 50% cost savings across all successful documents.",
          },
        ],
      },
      {
        id: "4.6",
        title: "Design multi-instance and multi-pass review architectures",
        knowledge: [
          "Self-review limitation: a model that generated code retains its reasoning context, making it less likely to question its own decisions in the same session",
          "Independent review instances (without prior reasoning context) are more effective at catching subtle issues than self-review instructions or extended thinking",
          "Multi-pass review: splitting large reviews into per-file local analysis passes plus separate cross-file integration passes avoids attention dilution and contradictory findings",
        ],
        skills: [
          "Use a second independent Claude instance to review generated code without the generator's reasoning context",
          "Split large multi-file reviews into focused per-file passes for local issues plus separate integration passes for cross-file data flow analysis",
          "Run verification passes where the model self-reports confidence alongside each finding to enable calibrated review routing",
        ],
        gotchas: [
          "Instructing the generating session to 'review your own work more carefully' or 'use extended thinking' — self-review with retained context is still self-review, not independent review",
          "Single-pass review across many files: inconsistent depth, contradictory findings, obvious bugs missed in later files due to attention dilution",
          "Not separating local-file concerns (per-file passes) from cross-file concerns (integration passes) — mixing them produces contradictory findings",
          "Thinking a larger context window solves the attention dilution problem of reviewing many files simultaneously — it doesn't improve attention quality, just capacity",
        ],
        questions: [
          {
            id: "m4.6a",
            text: "A team uses Claude to generate code and then asks the same Claude session to review it for bugs. The reviews frequently miss subtle logic errors that a human reviewer would catch. What is the most likely root cause?",
            options: [
              "The model needs to be instructed to 'be more critical' of the generated code",
              "The code review prompt is not specific enough about which types of bugs and logic errors to look for",
              "The generating session retains its reasoning context, so it rarely questions its own decisions",
              "Extended thinking should be enabled to give the model more time to reason about potential issues",
            ],
            correct: 2,
            explanation: "Self-review bias: a model that generated code retains its reasoning context and is less likely to question its own decisions. The fix is using a second independent Claude instance with no context from the generation session — it approaches the code without preconceptions about what the code was 'meant' to do. Extended thinking (D) and 'be more critical' (A) don't address the retained context bias. Review prompt specificity (B) is a valid improvement but not the root cause identified in the scenario.",
          },
          {
            id: "m4.6b",
            text: "A single-pass review of a 20-file pull request produces detailed feedback on files 1–4 but superficial comments, missed bugs, and contradictory findings for files 5–20. What restructuring addresses this?",
            options: [
              "Switch to a model with a larger context window to give all 20 files adequate attention in one pass",
              "Run per-file local analysis passes, then a separate cross-file integration pass for data flow",
              "Require the team to split the PR into submissions of 4-5 files each before automated review runs",
              "Run three independent review passes on all 20 files simultaneously and flag only consensus findings",
            ],
            correct: 1,
            explanation: "Per-file passes ensure each file receives focused analysis at consistent depth; a separate integration pass then examines cross-file concerns. Larger context windows (D) don't solve attention quality degradation — the model still focuses more on earlier context. Three passes on all 20 files (B) requires consensus for flagging, which would suppress bugs that only appear in one pass. Splitting PRs (C) shifts burden to developers without fixing the underlying review architecture.",
          },
          {
            id: "m4.6c",
            text: "A review tool asks for a single JSON object holding findings for all 30 changed files in a pull request. Responses are regularly cut off with stop_reason 'max_tokens', leaving unparseable output. Which change addresses the cause?",
            options: [
              "Keep the single call, stream the response, and reassemble the truncated JSON from the streamed deltas after the stop event.",
              "Issue one scoped call per file, each returning a complete findings object, then merge the per-file results into one report.",
              "Increase max_tokens to the model's ceiling and request terser finding descriptions so the whole object fits inside one response.",
              "Retry whenever parsing fails, since a resampled response is usually short enough to finish within the token limit.",
            ],
            correct: 1,
            explanation: "Decomposing the review into per-file calls keeps every response small and complete, and the merge happens client-side — the same multi-pass structure that also avoids attention dilution across many files. Raising max_tokens (C) buys headroom until the next large PR and increases latency and cost. Streaming (A) changes delivery, not the output limit; the deltas reassemble into exactly the same truncated text. Retrying (D) re-runs a request that deterministically exceeds the budget. Note that any cross-file concerns then need their own dedicated integration pass, since per-file calls cannot see each other's context.",
          },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Context Management & Reliability",
    weight: 15,
    taskStatements: [
      {
        id: "5.1",
        title: "Manage conversation context to preserve critical information across long interactions",
        knowledge: [
          "Progressive summarization risks: condensing numerical values, percentages, specific dates, and customer-stated expectations into vague summaries (e.g., '$47.32' becomes 'about $50')",
          "The 'lost in the middle' effect: models reliably process information at the beginning and end of long inputs but may omit findings from middle sections",
          "Tool results accumulate in context and consume tokens disproportionately to their relevance (e.g., 40+ fields per order lookup when only 5 are relevant)",
          "Passing complete conversation history in subsequent API requests is required to maintain conversational coherence",
        ],
        skills: [
          "Extract transactional facts (amounts, dates, order numbers, statuses) into a persistent 'case facts' block included in each prompt, outside summarized history",
          "Trim verbose tool outputs to only relevant fields before they accumulate in context (keep only return-relevant fields from 40-field order lookups)",
          "Place key findings summaries at the beginning of aggregated inputs and organize detailed results with explicit section headers to mitigate position effects",
          "Require subagents to include metadata (dates, source locations, methodological context) in structured outputs to support accurate downstream synthesis",
        ],
        gotchas: [
          "Progressive summarization that loses specific values — '$47.32 purchase on March 15' becoming 'a purchase earlier this month' is a critical information loss",
          "Not trimming verbose tool outputs — a 40-field order lookup where only 5 fields are relevant fills context with noise and may push important information into the middle",
          "Placing key findings at the end of long aggregated inputs — position effects mean middle/later findings are less reliably processed",
          "Relying on the model to remember critical facts through context summarization without an explicit persistent facts block",
        ],
        questions: [
          {
            id: "m5.1a",
            text: "A customer support agent handles a case involving a $47.32 refund disputed on March 15. After 8 conversation turns, the context is compressed and the agent starts referring to 'a recent purchase dispute.' Later in the session, the agent issues a refund for $47.00, not $47.32. What context management technique would have prevented this?",
            options: [
              "Include the original amount in the most recent message so it appears at the end of context where it's reliably processed",
              "Disable context compression entirely to preserve all conversation history at full fidelity",
              "Extract the amount ($47.32) and date (March 15) into a persistent 'case facts' block included in every prompt",
              "Increase the context window size so more history can be retained before compression",
            ],
            correct: 2,
            explanation: "A persistent case facts block — containing specific amounts, dates, and key case details — sits outside the summarized history and is included in every prompt. This prevents progressive summarization from condensing specific values into vague approximations. Disabling compression entirely (D) is often not possible and burns context on irrelevant details. Larger context windows (A) delay but don't prevent the problem. Including in the latest message (C) is a workaround that breaks the normal conversation flow.",
          },
          {
            id: "m5.1b",
            text: "A tool lookup returns a customer record with 45 fields. Only 5 fields (name, email, account_status, subscription_tier, last_order_date) are relevant to the current task. What is the correct context management approach?",
            options: [
              "Include all 45 fields — the model will reliably focus on the relevant ones based on the current task",
              "Summarize all 45 fields into prose before appending to context",
              "Trim the result to the 5 relevant fields before appending it to context",
              "Cache the full 45-field record and retrieve specific fields on demand rather than including any in context",
            ],
            correct: 2,
            explanation: "Trimming tool outputs to only relevant fields before they accumulate prevents irrelevant data from consuming context tokens disproportionately. Including all fields (C) fills context with noise and may push important information into middle positions. Prose summarization (B) risks the same condensation problem as progressive summarization. On-demand retrieval (D) adds complexity and additional tool call overhead.",
          },
        ],
      },
      {
        id: "5.2",
        title: "Design effective escalation and ambiguity resolution patterns",
        knowledge: [
          "Appropriate escalation triggers: customer explicitly requests a human agent, policy exceptions/gaps (not just complex cases), and inability to make meaningful progress",
          "Distinction: escalate immediately when a customer explicitly demands a human; offer to resolve first only when the request is straightforward and the customer hasn't explicitly asked for a human",
          "Sentiment-based escalation and self-reported confidence scores are unreliable proxies for actual case complexity",
          "Multiple customer matches from a lookup require requesting additional identifiers rather than heuristic selection (e.g., selecting by most recent activity)",
        ],
        skills: [
          "Add explicit escalation criteria with few-shot examples to the system prompt demonstrating when to escalate vs resolve autonomously",
          "Honor explicit customer requests for human agents immediately without first attempting investigation or resolution",
          "Acknowledge frustration while offering resolution when the issue is within capability; escalate only if the customer reiterates their preference for a human",
          "Escalate when policy is ambiguous or silent on the customer's specific request (e.g., competitor price matching when policy only addresses own-site adjustments)",
          "Ask for additional identifiers when tool results return multiple matches, rather than selecting based on heuristics",
        ],
        gotchas: [
          "Using self-reported model confidence scores as escalation criteria — the model may already be incorrectly confident about hard cases",
          "Sentiment-based escalation (escalate when customer is frustrated) — frustration doesn't correlate with case complexity; agent should attempt to resolve unless customer explicitly requests a human",
          "Attempting to investigate or resolve before honoring an explicit request for a human agent",
          "Selecting by heuristic (most recent activity, highest value) when multiple customer matches exist — always request a disambiguating identifier",
        ],
        questions: [
          {
            id: "m5.2a",
            text: "A customer says: 'I don't want to deal with a bot, just connect me with a human agent right now.' The agent detects this is a standard return request it could resolve. What should the agent do?",
            options: [
              "Escalate only if the sentiment analysis confirms the customer is genuinely frustrated rather than testing the system",
              "Explain that it can resolve the issue faster than a human agent and offer to help",
              "Resolve the standard return request first, then note that a human agent is available if the customer wants to follow up",
              "Immediately escalate — an explicit request for a human must be honored before any resolution attempt",
            ],
            correct: 3,
            explanation: "Explicit requests for human agents must be honored immediately — this is a distinct escalation trigger separate from case complexity. Attempting to resolve first (C) and trying to convince the customer the bot can help (B) override an explicit preference, which damages trust. Sentiment analysis (A) is an unreliable proxy and irrelevant when the customer's preference is explicitly stated.",
          },
          {
            id: "m5.2b",
            text: "An agent achieving only 55% first-contact resolution frequently escalates standard damage replacement cases (which have photo evidence and clear policy coverage) while attempting to autonomously handle policy exception requests (which aren't covered by written policy). What is the most effective fix?",
            options: [
              "Add explicit escalation criteria with few-shot examples: escalate policy gaps/exceptions, resolve standard cases",
              "Have the agent self-report a confidence score before each response and automatically escalate when confidence falls below a threshold",
              "Implement sentiment analysis to detect customer frustration and escalate frustrated customers to human agents",
              "Deploy a separate classifier trained on historical tickets to predict which cases need escalation",
            ],
            correct: 0,
            explanation: "The agent is inverting escalation logic: escalating standard cases and handling exceptions. The root cause is unclear escalation decision boundaries. Adding explicit criteria with few-shot examples directly addresses this. Self-reported confidence (D) is an unreliable proxy — the agent may already be confident about the wrong decisions. A classifier (A) is over-engineered when prompt optimization hasn't been tried. Sentiment analysis (C) doesn't correlate with case complexity.",
          },
        ],
      },
      {
        id: "5.3",
        title: "Implement error propagation strategies across multi-agent systems",
        knowledge: [
          "Structured error context enables intelligent coordinator recovery: include failure type, what was attempted, partial results obtained, and potential alternative approaches",
          "Access failures (service unavailable → needs retry decision) vs valid empty results (query returned no matches → valid, proceed without results) must be clearly distinguished",
          "Two anti-patterns: silently suppressing errors (returning empty results as success) AND terminating the entire workflow on a single subagent failure",
          "Generic error statuses like 'search unavailable' hide the context the coordinator needs to make recovery decisions",
        ],
        skills: [
          "Return structured error context to the coordinator: failure type, what was attempted, partial results, and potential alternatives",
          "Distinguish access failures from valid empty results in error reporting so the coordinator can make appropriate decisions",
          "Subagents implement local recovery for transient failures and only propagate errors they cannot resolve locally, along with partial results and what was attempted",
          "Structure synthesis output with coverage annotations indicating which findings are well-supported vs which topic areas have gaps due to unavailable sources",
        ],
        gotchas: [
          "Returning empty results `[]` with no error flag when a search service timed out — the coordinator treats this as 'no results found' and proceeds with incomplete data",
          "Terminating the entire research workflow when one of four subagents fails — the coordinator should proceed with partial results and annotate coverage gaps",
          "Generic status messages ('search unavailable') without the failure type, attempted query, partial results, or alternative approaches the coordinator needs for recovery",
          "Subagents propagating all errors including transient ones they could retry locally — this unnecessary escalation creates round-trips through the coordinator",
        ],
        questions: [
          {
            id: "m5.3a",
            text: "A web search subagent times out while researching a complex topic. How should this failure be communicated to the coordinator agent?",
            options: [
              "Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow",
              "Return an empty result array [] with no error flag so the coordinator can continue with whatever results are available",
              "Implement exponential backoff and retry automatically until exhausted, then return a generic 'search unavailable' status",
              "Return structured error context: { isError: true, failureType: 'timeout', attemptedQuery, partialResults, alternatives }",
            ],
            correct: 3,
            explanation: "Structured error context gives the coordinator the information it needs for intelligent recovery: it knows what failed, what was attempted, what partial results exist, and what alternatives to try. Empty results with no flag (C) silently suppress the error and the coordinator cannot distinguish failure from 'no results.' Generic status (A) hides the context needed for recovery decisions. Terminating the entire workflow (D) is the anti-pattern of abandoning work when partial results could still be used.",
          },
          {
            id: "m5.3b",
            text: "A research coordinator receives no results from a database subagent for the query 'sales figures 2023.' The subagent returned `{ result: [] }` with no additional context. What two possible states cannot be distinguished from this response?",
            options: [
              "The database was unavailable (retryable) vs available but holding no 2023 figures (valid empty result)",
              "The result was cached vs the result was freshly retrieved from the database",
              "The query syntax was invalid vs the subagent lacked authorization to access the database backend",
              "The subagent used the wrong tool vs the coordinator provided insufficient query parameters",
            ],
            correct: 0,
            explanation: "An empty result array with no error flag is ambiguous between 'access failure' (the service was down, retry might succeed) and 'valid empty result' (the query ran successfully and truly found nothing). The coordinator must make different decisions for each case: retry an access failure, annotate coverage gaps for a valid empty result. The other options describe different ambiguities that are important but not the specific one caused by the empty-results-as-success anti-pattern.",
          },
        ],
      },
      {
        id: "5.4",
        title: "Manage context effectively in large codebase exploration",
        knowledge: [
          "Context degradation in extended sessions: models start giving inconsistent answers and referencing 'typical patterns' rather than the specific classes discovered earlier in the session",
          "Scratchpad files persist key findings across context boundaries — when context is compacted, findings written to files survive",
          "Subagent delegation isolates verbose exploration output: the main agent maintains high-level coordination while subagents handle detailed investigations",
          "Structured state persistence for crash recovery: each agent exports state to a known location; the coordinator loads a manifest on resume",
        ],
        skills: [
          "Spawn subagents to investigate specific questions (e.g., 'find all test files,' 'trace refund flow dependencies') while the main agent preserves high-level coordination context",
          "Have agents maintain scratchpad files recording key findings, referenced for subsequent questions to counteract context degradation",
          "Summarize key findings from one exploration phase before spawning subagents for the next phase, injecting summaries into initial context",
          "Design crash recovery using structured agent state exports (manifests) that the coordinator loads on resume and injects into agent prompts",
          "Use /compact to reduce context usage during extended exploration sessions when context fills with verbose discovery output",
        ],
        gotchas: [
          "Continuing to ask the main agent to perform detailed explorations — verbose output fills context, the main agent's quality degrades, and eventually context limits are hit",
          "Not using scratchpad files — key findings are lost when context is compacted or a new session starts, requiring re-exploration",
          "Not summarizing findings between phases — phase 2 subagents start without context from phase 1, duplicating work or missing dependencies",
          "/compact reduces context usage during extended sessions; it's not a substitute for subagent delegation or scratchpad files",
        ],
        questions: [
          {
            id: "m5.4a",
            text: "After 30 minutes of codebase exploration in a single session, a developer notices the agent's answers are becoming inconsistent — referencing 'typical MVC patterns' instead of the specific custom architecture discovered earlier in the session. What is the most likely cause and fix?",
            options: [
              "The model version needs to be upgraded to handle longer exploration sessions",
              "Context degradation: verbose output filled the context. Spawn subagents and use scratchpad files",
              "The agent needs the /compact command to compress its context and restore performance",
              "The exploration was too verbose; restart the session with more specific questions",
            ],
            correct: 1,
            explanation: "Context degradation occurs when verbose exploration output fills the context window — the model starts reasoning from compressed/approximated context rather than specific earlier findings. Subagent delegation isolates verbose output while the main agent maintains high-level coordination. /compact (C) is a tool that can help but doesn't address the underlying architectural issue. Restarting (D) loses all accumulated findings. Model version (A) is not the right lever for context management.",
          },
          {
            id: "m5.4b",
            text: "A multi-phase codebase exploration has Phase 1 discovering all service dependencies. When Phase 2 subagents start analyzing each service, they have no knowledge of the dependencies found in Phase 1 and produce redundant analyses. What architectural fix prevents this?",
            options: [
              "Have Phase 2 subagents re-run Phase 1 discovery as their first step to establish their own context",
              "Have Phase 1 and Phase 2 share the same conversation context so findings are automatically available",
              "Summarize Phase 1 findings to a scratchpad file, then inject that summary into each Phase 2 subagent",
              "Complete Phase 2 in the same long-running session as Phase 1 so the agent retains all the Phase 1 context",
            ],
            correct: 2,
            explanation: "Subagents don't automatically inherit context from prior phases. Summarizing Phase 1 findings to a scratchpad file and injecting that summary into Phase 2 subagent prompts provides the necessary dependency context without requiring context sharing. Shared context (D) defeats the purpose of subagent isolation. Completing both phases in the same session (C) leads to the context degradation problem described in the previous question. Re-running Phase 1 per subagent (A) is wasteful and defeats the multi-phase architecture.",
          },
          {
            id: "m5.4c",
            text: "A migration audit must inventory roughly 4,100 call sites of a deprecated API across 600 files, and the same main session must then produce the migration plan. What best protects the main session's context?",
            options: [
              "Delegate the sweep to subagents that write a structured inventory to a scratchpad file and return only a short summary.",
              "Have the main agent Read all 600 files in batches, running /compact between batches so accumulated file contents are compressed.",
              "Spawn subagents for the inspection but have each return its full exploration transcript so the main agent can verify the findings.",
              "Raise the session's max_turns so the main agent has enough iterations to inspect every file before its context is exhausted.",
            ],
            correct: 0,
            explanation: "Subagents run in isolated context windows, so the verbose per-file output never enters the main session; writing the inventory to a scratchpad file makes the detail durable and re-readable on demand, while only a compact summary crosses back to the coordinator that has to write the plan. Returning full transcripts from subagents defeats the isolation and reproduces the original problem in the parent. /compact reclaims space but replaces specifics with summaries, and the guidance is explicit that it is not a substitute for delegation or scratchpad files. max_turns controls loop length, not context capacity.",
          },
        ],
      },
      {
        id: "5.5",
        title: "Design human review workflows and confidence calibration",
        knowledge: [
          "Aggregate accuracy metrics (e.g., 97% overall) can mask poor performance on specific document types or fields — always segment by document type and field",
          "Stratified random sampling of high-confidence extractions is needed for ongoing error rate measurement and novel pattern detection",
          "Field-level confidence scores must be calibrated using labeled validation sets — model self-reported confidence is not reliably calibrated",
          "Validate accuracy by document type and field segment before automating any high-confidence extraction pathway",
        ],
        skills: [
          "Implement stratified random sampling of high-confidence extractions for ongoing error rate measurement across document segments",
          "Analyze accuracy by document type and field to verify consistent performance before reducing human review",
          "Have models output field-level confidence scores, then calibrate review thresholds using labeled validation sets",
          "Route extractions with low model confidence or ambiguous/contradictory source documents to human review",
        ],
        gotchas: [
          "Trusting aggregate accuracy (97% overall) to represent all document types — a 97% average can coexist with 60% accuracy on a specific document type",
          "Automating high-confidence extractions without stratified sampling — novel error patterns go undetected until they become widespread",
          "Treating model self-reported confidence scores as calibrated — models may be confident but wrong on specific document types; calibration requires labeled validation sets",
          "Reducing human review before validating accuracy at the segment level (document type × field) — aggregate metrics mislead",
        ],
        questions: [
          {
            id: "m5.5a",
            text: "An extraction system achieves 97% overall accuracy. The team proposes automating all high-confidence extractions. Before doing so, what analysis is most critical?",
            options: [
              "Segment accuracy by document type and field — the 97% average may mask 60% accuracy on specific document segments",
              "Verify that the 3% error rate falls within acceptable business thresholds before automating",
              "Run the system on a larger sample to confirm the 97% accuracy holds at scale",
              "Confirm that the model's self-reported confidence scores are above 90% for the high-confidence category",
            ],
            correct: 0,
            explanation: "Aggregate metrics can hide segment-level failures. A 97% overall accuracy can coexist with 40–60% accuracy on specific document types — automating those extractions would produce systematic errors. Segmentation by document type and field is the critical analysis before automation. Self-reported confidence (C) is not reliably calibrated — it's a model estimate, not a validated accuracy metric. Scale confirmation (B) doesn't reveal segment failures hidden in the aggregate. The 3% threshold (A) may be acceptable on average but unacceptable for specific high-stakes fields.",
          },
        ],
      },
      {
        id: "5.6",
        title: "Preserve information provenance and handle uncertainty in multi-source synthesis",
        knowledge: [
          "Source attribution is lost during summarization steps when findings are compressed without preserving claim-source mappings",
          "Conflicting statistics from credible sources must be annotated with source attribution rather than arbitrarily selecting one value",
          "Temporal data handling: require publication/collection dates in structured outputs to prevent temporal differences from being misinterpreted as contradictions",
          "Structured claim-source mappings that synthesis agents must preserve and merge when combining findings from multiple sources",
        ],
        skills: [
          "Require subagents to output structured claim-source mappings (source URL, document name, relevant excerpt) that downstream agents preserve through synthesis",
          "Structure reports with explicit sections distinguishing well-established findings from contested ones, preserving original source characterizations",
          "Complete document analysis with conflicting values included and explicitly annotated, letting the coordinator decide how to reconcile before passing to synthesis",
          "Require subagents to include publication or data collection dates in structured outputs to enable correct temporal interpretation",
          "Render different content types appropriately: financial data as tables, news as prose, technical findings as structured lists — don't convert everything to uniform format",
        ],
        gotchas: [
          "Compressing or summarizing findings without preserving claim-source mappings — attribution is lost and the synthesis agent cannot distinguish sources",
          "Arbitrarily selecting one value when two credible sources report conflicting statistics — both values should be reported with their source attributions",
          "Not requiring temporal data in structured outputs — two sources reporting the same metric at different times appear as a contradiction instead of a temporal evolution",
          "Treating all findings as equally well-established — synthesis must distinguish contested from well-supported claims",
        ],
        questions: [
          {
            id: "m5.6a",
            text: "A synthesis agent receives findings from three research subagents, each with a list of claims but no source attribution. The synthesis agent must produce a cited report. What is the root architectural problem?",
            options: [
              "The synthesis agent needs a tool to look up original sources based on the claims it receives",
              "The coordinator should have maintained a central citation registry that all subagents logged to",
              "The synthesis agent should generate citations from the claims using its training knowledge",
              "The subagents weren't required to output claim-source mappings, losing attribution",
            ],
            correct: 3,
            explanation: "Source attribution is lost during summarization/synthesis when subagents don't preserve claim-source mappings. The fix is requiring subagents to output structured data including source URL, document name, and relevant excerpts alongside each claim, and requiring the synthesis agent to preserve these mappings through synthesis. A lookup tool (A) can't recreate attribution that was never captured. A central registry (B) is a valid alternative architecture but adds coordination overhead. Generating citations from training knowledge (C) is hallucination.",
          },
          {
            id: "m5.6b",
            text: "Two credible sources report conflicting statistics: Source A reports 'AI adoption rate: 34%' and Source B reports 'AI adoption rate: 67%'. What is the correct synthesis approach?",
            options: [
              "Select the more recent source's value and use that as the definitive figure",
              "Report both the 34% and 67% figures with source attribution and annotate the conflict",
              "Exclude conflicting statistics from the report to maintain accuracy",
              "Average the two values and report '~50% AI adoption rate'",
            ],
            correct: 1,
            explanation: "When credible sources conflict, the correct approach is to preserve both values with attribution and annotate the conflict rather than arbitrarily selecting one. Conflicting statistics often reflect different methodologies, sample populations, or time periods — context that is valuable to the reader. Selecting the more recent (D) or averaging (B) both discard information and misrepresent the state of knowledge. Excluding (C) presents an incomplete picture of what the sources say.",
          },
          {
            id: "m5.6c",
            text: "A report generator receives quarterly revenue figures, industry news items and benchmark results from three subagents and renders all of them as the same flat bulleted list. Reviewers say the financial section has become unreadable. What design principle applies?",
            options: [
              "Uniform formatting should be preserved for consistency across the report; the revenue bullets simply need clearer field labels.",
              "Each content type should be rendered in its best-suited form: tables for financial data, prose for news, lists for benchmarks.",
              "Financial figures should be narrated in prose, since dense numeric tables are hard for reviewers to scan inside a written report.",
              "Each subagent should pre-render its own final formatting so the report generator only has to concatenate the finished sections.",
            ],
            correct: 1,
            explanation: "Different content types carry information in different shapes, and forcing them into one uniform format destroys the structure that makes them legible — comparative revenue figures belong in a table, narrative news reads best as prose, and discrete benchmark findings suit structured lists. Option A defends the very uniformity causing the complaint; better labels do not restore the row-and-column comparison a table provides. Option D pushes presentation into the subagents, which do not know the final document's context and cannot make consistent cross-section choices. Option C inverts the principle by converting the most tabular content into the least tabular form.",
          },
        ],
      },
    ],
  },
];

// ─── Flat lookups ─────────────────────────────────────────────────────────────

/** Returns all task statements across all domains. */
export function getAllTaskStatements() {
  return DOMAINS.flatMap((d) => d.taskStatements);
}

/** Returns a single task statement by its id string (e.g. "1.1"). */
export function getTaskStatement(id) {
  for (const domain of DOMAINS) {
    const ts = domain.taskStatements.find((t) => t.id === id);
    if (ts) return { domain, taskStatement: ts };
  }
  return null;
}

/** Returns all module questions as a flat array (for SR integration). */
export function getAllModuleQuestions() {
  return getAllTaskStatements().flatMap((ts) => ts.questions);
}

/** Returns the domain that owns a task statement id. */
export function getDomainForTask(taskId) {
  const [domainNum] = taskId.split('.');
  return DOMAINS.find((d) => d.id === parseInt(domainNum, 10)) ?? null;
}

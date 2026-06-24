// models/caseStudies.js — Interactive branching decision scenarios, one per domain.
// Pure JS, no React. Each case maps to a domain id (1–5). The learner role-plays an
// architect and makes a sequence of decisions; each option carries a consequence and
// exactly one option per step is `correct`. Authored to mirror real exam concepts.
//
// Shape:
//   { id, domain, title, scenario, steps: [{ prompt, options: [{ text, correct?, consequence }] }], outcome }

export const CASE_STUDIES = [
  {
    id: "case1",
    domain: 1,
    title: "The Runaway Research Pipeline",
    scenario:
      "You're the lead architect at a legal-tech firm building an automated contract-review system on the Claude Agent SDK. A coordinator agent must analyze incoming contracts by delegating to specialized subagents, but the early prototype loops endlessly, leaks context between cases, and occasionally writes to the production filing system without authorization. Leadership wants a reliable, auditable pipeline shipped this quarter, and it's on you to make the core architectural calls.",
    steps: [
      {
        prompt:
          "Your prototype's agentic loop sometimes never terminates and other times stops mid-analysis. You need a reliable termination condition for the coordinator's loop. How do you drive iteration?",
        options: [
          {
            text: 'Continue the loop while stop_reason is "tool_use", feeding tool results back each turn, and exit when stop_reason becomes "end_turn".',
            correct: true,
            consequence:
              "Correct. Letting the model's stop_reason govern iteration is the canonical agentic-loop pattern: you keep returning tool results while it requests tools and terminate naturally on end_turn, with max_tokens/turn caps as a safety net.",
          },
          {
            text: "Run a fixed for-loop of exactly 10 iterations every time, since most contracts resolve within ten tool calls and a hard cap guarantees termination and predictable latency and cost ceilings for finance to budget against.",
            consequence:
              "The pipeline either wastes turns on simple contracts or truncates complex ones mid-analysis, since a static count ignores what the model actually still needs to do.",
          },
          {
            text: 'Loop until the assistant\'s text output contains the keyword "DONE", which you instruct it to emit when finished.',
            consequence:
              'Brittle string-matching breaks the moment the model phrases completion differently or mentions "done" mid-reasoning, causing premature exits and false continuations.',
          },
          {
            text: "Poll the API every few seconds on a timer and assume the task is complete once no new tokens have arrived.",
            consequence:
              "Timer-based heuristics conflate slow generation with completion, terminating valid work early and adding race conditions unrelated to the model's actual intent.",
          },
        ],
      },
      {
        prompt:
          "The coordinator must hand each contract to a specialized subagent (liability, IP, compliance). Subagents keep referencing details from previous, unrelated contracts. How should the coordinator invoke them?",
        options: [
          {
            text: "Give every subagent read access to the coordinator's full conversation history so they always have maximum context to reason with.",
            consequence:
              "Sharing the entire history is exactly what causes the cross-contract bleed: subagents pick up stale details from prior cases and conflate them with the current one.",
          },
          {
            text: "Spawn each subagent with a fresh context and pass only the specific contract text and task instructions explicitly in the Task prompt.",
            correct: true,
            consequence:
              "Correct. Subagents run in isolated context windows; passing only the relevant data explicitly in the Task prompt prevents cross-case leakage and keeps each subagent focused and token-efficient.",
          },
          {
            text: "Have subagents share a single global conversation thread and tag each message with a contract ID so they can self-filter to the right case using the tags during their reasoning.",
            consequence:
              "A shared thread still loads all cases into the window; tag-based self-filtering is unreliable and the subagents continue to bleed irrelevant context across contracts.",
          },
        ],
      },
      {
        prompt:
          "Three contracts arrive simultaneously, each independent. The sequential pipeline is too slow to hit your SLA. How do you decompose and execute the work?",
        options: [
          {
            text: "Issue the three subagent Task calls in parallel since the contracts are independent, then aggregate their structured results once all return.",
            correct: true,
            consequence:
              "Correct. Independent subtasks with no shared state are the ideal case for parallel Task invocation, cutting wall-clock time roughly threefold while the coordinator fans results back in.",
          },
          {
            text: "Keep processing strictly sequentially but raise the model tier on the coordinator so each contract is analyzed faster, preserving simple ordering guarantees and avoiding any concurrency bugs.",
            consequence:
              "A faster model shaves per-call latency slightly but you still pay three serial round-trips, so you miss the SLA that parallelism would comfortably hit.",
          },
          {
            text: "Merge all three contracts into one giant prompt and ask a single agent to analyze them together in one pass to save on overhead.",
            consequence:
              "Cramming independent cases into one context invites cross-contamination and a bloated window, reintroducing the very leakage you just eliminated.",
          },
          {
            text: "Queue the contracts and process one per session, restarting the whole pipeline between each for clean isolation.",
            consequence:
              "Full restarts add cold-start overhead per contract and remain fundamentally serial, making the SLA miss worse rather than better.",
          },
        ],
      },
      {
        prompt:
          "A subagent occasionally calls the file_write tool against the production filing system before a human approves. You need a deterministic guardrail that the model cannot reason its way around. What do you implement?",
        options: [
          {
            text: "Strengthen the system prompt with firm instructions never to write to production without approval, and add examples of the rule being followed.",
            consequence:
              "Prompt instructions are probabilistic guidance, not enforcement; under pressure the model can still issue the write, so unauthorized writes keep slipping through.",
          },
          {
            text: "Add a PreToolUse hook that intercepts file_write calls and blocks any targeting production paths unless an approval flag is set.",
            correct: true,
            consequence:
              "Correct. A PreToolUse hook is deterministic code that runs before the tool executes, so it can hard-block unauthorized writes regardless of what the model decides—exactly the enforcement layer this needs.",
          },
          {
            text: "Run a second reviewer agent that inspects each proposed write and vetoes unsafe ones before they execute, giving you a flexible model-based policy layer that can weigh nuance and context the way a human reviewer would.",
            consequence:
              "A reviewer agent is itself probabilistic and adds latency and cost; it can be talked into approving a bad write, so it isn't the deterministic barrier the requirement demands.",
          },
          {
            text: "Revoke the file_write tool entirely and have subagents emit write requests as plain text for later manual processing.",
            consequence:
              "This blocks all automation, not just unauthorized writes, defeating the pipeline's purpose and pushing heavy manual work back onto the team.",
          },
        ],
      },
      {
        prompt:
          "A senior reviewer wants to take a completed analysis and explore two alternative remediation strategies without disturbing the original audit trail. How do you support this branching exploration?",
        options: [
          {
            text: "Fork the session at the completed-analysis point, creating independent branches the reviewer can explore while the original session stays intact.",
            correct: true,
            consequence:
              "Correct. Forking with fork_session clones state at a checkpoint so each strategy evolves on its own branch, preserving the original audit trail untouched.",
          },
          {
            text: "Resume the original session and let the reviewer try one strategy, then undo the messages and try the other in the same session.",
            consequence:
              "Mutating and rewinding the live session corrupts the audit trail and makes the two strategies impossible to compare side by side.",
          },
          {
            text: "Copy the final summary text into two brand-new sessions and have the reviewer paste it in to start each exploration, which keeps the branches separate and avoids any dependency on session internals or SDK forking features.",
            consequence:
              "A text copy loses the full conversation state and tool history, so each new session starts blind to the reasoning that produced the analysis and the branches aren't faithful continuations.",
          },
        ],
      },
    ],
    outcome:
      "By letting stop_reason drive the loop, isolating subagents with explicit context passing, parallelizing independent work, enforcing writes with a deterministic PreToolUse hook, and forking sessions for safe exploration, you ship a fast, auditable contract-review pipeline. The core lesson: orchestration reliability comes from matching each concern to the right mechanism—model-driven control for iteration, code-driven hooks for enforcement, and explicit context boundaries for isolation—rather than leaning on prompts to do everything.",
  },
  {
    id: "case2",
    domain: 2,
    title: "Wiring the Tool Layer for a Logistics Copilot",
    scenario:
      "You're the architect for ShipMind, a production agentic system that helps warehouse ops teams query shipments, adjust routes, and file carrier claims. The system spans a read-only 'analyst' agent and a write-capable 'dispatcher' agent, all backed by an internal carrier API exposed through MCP. Leadership wants it reliable, secure, and cheap on tokens — your tool and MCP design decisions over the next few weeks will determine whether it ships.",
    steps: [
      {
        prompt:
          "You're defining the carrier API's MCP tools. Two operations exist: looking up a shipment's live status, and looking up its billing history. How do you name and describe them?",
        options: [
          {
            text: "One flexible tool, get_shipment, with a mode parameter that returns either status or billing depending on the value passed.",
            consequence:
              "The model frequently passes the wrong mode or forgets the parameter entirely, and the merged return shape makes failures hard to diagnose. Overloaded tools blur boundaries that the model relies on to choose correctly.",
          },
          {
            text: "Two tools, get_shipment_status and get_shipment_billing, each with a description stating exactly what it returns, when to use it, and that the two are not interchangeable.",
            correct: true,
            consequence:
              "The model selects the right tool on the first try because the boundary between them is explicit. Distinct, well-described tools with non-overlapping scope are the foundation of reliable tool selection.",
          },
          {
            text: "Two tools named lookup1 and lookup2 with brief descriptions, since the parameter schemas make their purpose obvious enough to the model at call time.",
            consequence:
              "Opaque names force the model to guess from schemas alone, and it routinely confuses the two. Names and descriptions, not just schemas, drive correct tool choice.",
          },
        ],
      },
      {
        prompt:
          "The dispatcher agent calls update_route, but the carrier API sometimes returns a transient 503. How should the MCP tool surface this so the agent behaves well?",
        options: [
          {
            text: "Return a structured error object with an error code, a human-readable message, an is_retryable flag set to true, and a suggested backoff — distinct from how you'd report an invalid route ID.",
            correct: true,
            consequence:
              "The agent recognizes the failure as transient, waits, and retries successfully instead of giving up or hallucinating. Structured, machine-readable errors that distinguish retryable from terminal failures let the agent recover gracefully.",
          },
          {
            text: "Raise the underlying exception and let it propagate as a raw stack trace so the agent has the full technical detail to reason about what failed.",
            consequence:
              "The agent can't parse the stack trace into an action and often abandons the task or invents a result. Raw exceptions leak implementation detail without telling the model whether to retry.",
          },
          {
            text: "Return a plain string like 'Error: could not update route' so the agent knows the call failed and can decide what to do next.",
            consequence:
              "With no retryable signal or error code, the agent treats a temporary blip the same as a permanent failure and stops. Unstructured strings collapse distinct failure modes into one ambiguous outcome.",
          },
          {
            text: "Return a success response with an empty body, logging the 503 server-side so ops can investigate the failures later without the agent needing to handle them.",
            consequence:
              "The agent believes the route was updated when it wasn't, and downstream dispatch decisions act on phantom state. Silently swallowing errors is the most dangerous option for a write tool.",
          },
        ],
      },
      {
        prompt:
          "Now you distribute tools across the two agents. The analyst answers read-only questions; the dispatcher modifies routes and files claims. How do you scope tools and configure tool choice?",
        options: [
          {
            text: "Give both agents the full tool set for flexibility, but leave tool_choice on auto so each agent only calls write tools when the conversation clearly calls for it.",
            consequence:
              "The analyst eventually calls update_route during an exploratory query and mutates production state. Capability, not runtime intent, must enforce safety — auto is not a guardrail.",
          },
          {
            text: "Give the analyst only the read tools and the dispatcher the read plus write tools, applying least privilege at the agent boundary; leave tool_choice as auto for both.",
            correct: true,
            consequence:
              "The analyst is structurally incapable of mutating state, while the dispatcher retains what it needs. Least-privilege tool scoping per agent contains blast radius regardless of what any single prompt asks for.",
          },
          {
            text: "Give both agents all tools, but set tool_choice to required on the dispatcher and none on the analyst to prevent it from acting.",
            consequence:
              "tool_choice:none only blocks the current turn's tool use and forcing required makes the dispatcher call a tool even when it should just answer. These settings shape one response, not standing permissions.",
          },
        ],
      },
      {
        prompt:
          "You're adding the carrier MCP server to the team's Claude Code setup. The server needs a CARRIER_API_KEY, and every engineer should connect to the same server. What's the right configuration?",
        options: [
          {
            text: "Add the server to each engineer's personal user-scoped config and have them paste the shared API key inline so everyone is guaranteed to have an identical working setup.",
            consequence:
              "The key isn't version-controlled or shared, drifts between machines, and sits in plaintext in personal configs. User scope and inline secrets defeat both consistency and security.",
          },
          {
            text: "Commit a project-scoped .mcp.json that defines the server and references the key via an environment variable, with the actual CARRIER_API_KEY supplied from each engineer's environment.",
            correct: true,
            consequence:
              "Everyone on the project gets the same server definition from version control while the secret stays out of the repo. Project-scoped .mcp.json with env-var interpolation is the standard pattern for shared, secure MCP config.",
          },
          {
            text: "Hardcode the server and key directly into the committed .mcp.json so the whole team is instantly working with zero per-engineer setup and no environment dependencies.",
            consequence:
              "The live API key is now in git history for anyone with repo access and any leak. Committing secrets is a critical security failure no matter how convenient.",
          },
        ],
      },
      {
        prompt:
          "Finally, the dispatcher agent often needs to find which config file defines retry timeouts in your large repo. It knows the setting is named 'max_retry_ms' but not which file holds it. Which built-in tool should the agent reach for first?",
        options: [
          {
            text: "Bash, running a recursive find piped into a loop that greps each file, giving full shell control over how the search is performed and formatted.",
            consequence:
              "It works but spawns a fragile, slow shell pipeline that's easy to get wrong and burns tokens on noisy output. Bash is the wrong reach when a purpose-built search tool exists.",
          },
          {
            text: "Glob with a pattern like **/*.config.* to enumerate candidate config files, then open each one to scan for the setting.",
            consequence:
              "Glob finds files by name but can't see inside them, so the agent still has to read each candidate manually. It's the right tool for filename patterns, not content lookups.",
          },
          {
            text: "Grep, searching the repo for the literal string 'max_retry_ms' to jump straight to the file and line that defines it.",
            correct: true,
            consequence:
              "Grep matches file contents and returns the exact location in one call. When you know a string and need the file containing it, content search is the direct and token-efficient choice.",
          },
          {
            text: "Read, opening the most likely config file based on the agent's best guess about the repo's conventions and naming.",
            consequence:
              "Guessing the path wastes turns when the setting lives somewhere unexpected, and Read needs a known path. Read is for files you've already located, not for finding them.",
          },
        ],
      },
    ],
    outcome:
      "ShipMind ships with cleanly bounded, well-described tools, structured retryable errors, least-privilege agents, and a shared-but-secure project-scoped MCP config. The analyst can't mutate state, transient carrier failures self-recover, and engineers all run the same server without leaking keys. The throughline: in tool and MCP design, explicit boundaries and structure — in names, errors, permissions, and config — beat flexible-but-ambiguous shortcuts every time.",
  },
  {
    id: "case3",
    domain: 3,
    title: "Rolling Out Claude Code Across the Payments Team",
    scenario:
      "You're the tech lead for an 8-engineer payments platform team adopting Claude Code on a large polyglot monorepo (a TypeScript API, a Python risk-scoring service, and Terraform infra). Leadership wants consistent agent behavior, a smooth migration off a legacy ORM, and Claude wired into CI. Every configuration choice you make ships to the whole team, so getting the hierarchy and tooling right matters.",
    steps: [
      {
        prompt:
          "You want every engineer on the repo to inherit shared conventions (build commands, the 'never touch the generated/ folder' rule, PR norms), while letting individuals keep their own personal aliases and tone preferences. Where do you put what?",
        options: [
          {
            text: "Commit a project CLAUDE.md at the repo root with the shared team conventions, and have each engineer keep personal preferences in their own ~/.claude/CLAUDE.md.",
            correct: true,
            consequence:
              "Correct. The checked-in project file gives everyone the same baseline, while the user-level file layers in personal preferences without polluting the team's shared context.",
          },
          {
            text: "Put everything — team conventions and a section for each engineer's personal preferences — in the single root project CLAUDE.md so all configuration lives in one auditable file.",
            consequence:
              "The file balloons with eight people's personal aliases, conventions conflict, and engineers edit shared context to tweak their own tone — constant merge noise and diluted instructions.",
          },
          {
            text: "Have each engineer maintain only their own ~/.claude/CLAUDE.md with both the shared rules and their preferences, so nothing extra is committed to the repo.",
            consequence:
              "Shared conventions drift instantly — eight private copies fall out of sync, new hires get nothing, and the 'never touch generated/' rule is silently missing for half the team.",
          },
          {
            text: "Create a project CLAUDE.md but also commit per-engineer CLAUDE.local.md files into the repo for personal preferences so they're version-controlled and reviewable.",
            consequence:
              "Personal tone and aliases now generate PR review churn for the whole team, and CLAUDE.local.md is meant to be gitignored — committing it defeats its purpose and leaks individual setup.",
          },
        ],
      },
      {
        prompt:
          "The repo holds three subsystems with very different conventions: the Python risk service forbids bare excepts and mandates type hints, the Terraform dir requires `terraform fmt` and tagging standards, and the TS API has its own lint rules. You don't want all of this loaded for every prompt. How do you scope it?",
        options: [
          {
            text: "Add a giant 'Subsystem Conventions' section to the root CLAUDE.md covering Python, Terraform, and TS rules with clear headers so Claude can find the relevant part.",
            consequence:
              "Every prompt now carries all three subsystems' rules regardless of what's being edited, wasting context and occasionally bleeding Terraform tagging advice into TS work.",
          },
          {
            text: "Create path-specific rule files under .claude/rules/ with glob patterns (e.g. globs for services/risk/**, infra/**, api/**) so each subsystem's conventions load only when matching files are in play.",
            correct: true,
            consequence:
              "Correct. Path-specific rules with globs load conditionally, so Claude only sees Python rules when touching the risk service and Terraform rules when touching infra — lean, relevant context.",
          },
          {
            text: "Drop a separate CLAUDE.md into each subsystem directory and tell engineers to always launch Claude Code from inside the relevant subdirectory so only that file is read.",
            consequence:
              "Nested CLAUDE.md files help, but forcing a cwd convention is brittle — cross-cutting changes spanning api/ and risk/ break it, and engineers forget, getting the wrong conventions.",
          },
        ],
      },
      {
        prompt:
          "The team keeps re-typing the same multi-step request: 'audit this service for missing input validation, then write a findings table.' You want it reusable and shared. What do you build?",
        options: [
          {
            text: "Define the workflow as a personal slash command in ~/.claude/commands/ so it's available across all your projects, then paste it into the team chat for others to copy into their own home dirs.",
            consequence:
              "Putting it in the user-level commands dir makes it personal-only; manually copying to teammates' home dirs drifts immediately and new hires never receive it.",
          },
          {
            text: "Create a project slash command file in .claude/commands/ (e.g. audit-validation.md) committed to the repo, so the whole team gets /audit-validation automatically.",
            correct: true,
            consequence:
              "Correct. A committed project command in .claude/commands/ is versioned and shared — everyone gets /audit-validation on checkout, and improvements propagate via normal PRs.",
          },
          {
            text: "Wrap the prompt in a reusable shell script that pipes the text into `claude -p` and check the script into the repo's scripts/ directory for the team to run.",
            consequence:
              "A wrapper script works headlessly but isn't a first-class slash command — no interactive use, no argument hints, and it duplicates a capability Claude Code already provides natively.",
          },
          {
            text: "Build it as a Skill under .claude/skills/ with a full SKILL.md, supporting reference docs, and example outputs so Claude can invoke the entire validation-audit methodology autonomously whenever it's relevant.",
            consequence:
              "Overkill for a fixed two-step prompt — Skills shine for richer model-invoked capabilities with bundled resources; here a simple slash command is the right, lighter tool.",
          },
        ],
      },
      {
        prompt:
          "Now the big one: migrating the entire risk service off the legacy ORM to a new data layer — dozens of files, ordering matters, and a wrong move corrupts query logic. How do you have Claude approach it?",
        options: [
          {
            text: "Use plan mode: have Claude explore the codebase and produce a step-by-step migration plan you review and refine before any edits, then execute the approved plan.",
            correct: true,
            consequence:
              "Correct. For a high-stakes, multi-file migration where ordering matters, plan mode lets you vet and adjust the approach before a single file changes — catching bad sequencing up front.",
          },
          {
            text: "Go with direct execution but instruct Claude to migrate one file at a time and pause for your approval after each file, so you keep tight control throughout.",
            consequence:
              "File-by-file approval gives local control but no global view — Claude commits to an ordering with no upfront plan, and you discover a flawed migration sequence only after several files are already changed.",
          },
          {
            text: "Direct execution is fine here: give Claude the full migration goal and let it work autonomously, since it can read the whole codebase and self-correct as it goes.",
            consequence:
              "Autonomous execution on a fragile, order-sensitive migration risks cascading bad edits across dozens of files before you can intervene — exactly the scenario plan mode exists to prevent.",
          },
        ],
      },
      {
        prompt:
          "Finally, you wire Claude into CI to auto-review PRs and post a structured comment. The job must run headlessly, emit machine-parseable output, and enforce a strict reviewer persona without touching the repo's CLAUDE.md. Which invocation?",
        options: [
          {
            text: 'Run `claude -p "<review prompt>" --output-format json --append-system-prompt "You are a strict security-focused PR reviewer..."`, then parse the JSON in the pipeline to post the comment.',
            correct: true,
            consequence:
              "Correct. -p runs headlessly, --output-format json gives parseable output for the CI step, and --append-system-prompt layers the reviewer persona without modifying the committed CLAUDE.md.",
          },
          {
            text: "Run `claude -p` interactively in the CI runner and have the pipeline scrape the terminal transcript, editing the repo's root CLAUDE.md beforehand to inject the strict-reviewer persona for the run.",
            consequence:
              "Scraping free-text output is fragile, and mutating the committed CLAUDE.md to set persona pollutes shared config and risks leaking the CI-only persona into every engineer's local sessions.",
          },
          {
            text: 'Run `claude -p "<review prompt>" --bare` so the output is clean plain text, and set the reviewer persona by exporting it as an environment variable the CI job reads.',
            consequence:
              "--bare strips formatting but plain text is still awkward to parse reliably for structured comments, and an env var doesn't feed Claude a system prompt — the persona simply won't take effect.",
          },
          {
            text: 'Have CI invoke a committed project slash command via `claude -p "/pr-review"` and rely on the command file to define both the persona and the output shape for the pipeline to consume.',
            consequence:
              "A slash command can carry the prompt, but without --output-format json you still get unstructured output, and baking a CI-only strict persona into a shared command affects everyone's interactive use.",
          },
        ],
      },
    ],
    outcome:
      "You shipped a clean configuration hierarchy — shared project CLAUDE.md plus personal user-level files, path-scoped rules via .claude/rules/ globs, a committed slash command, plan mode for the risky migration, and a headless JSON-emitting CI invocation with an appended persona. The throughline: scope each instruction to exactly where it belongs, and reach for plan mode and structured/headless flags when stakes and automation demand control. Match the tool to the blast radius, not to whichever option sounds most thorough.",
  },
  {
    id: "case4",
    domain: 4,
    title: "Extracting Order from 200,000 Invoices",
    scenario:
      "You're the architect at a logistics firm building a pipeline to extract structured data (vendor, totals, line items, tax IDs) from 200,000 scanned supplier invoices that arrive in wildly inconsistent layouts. The finance team needs clean JSON for their ERP, and they've been burned before by a system that 'hallucinated' tax IDs and miscounted late-payment flags. Accuracy beats speed: results are needed within 24 hours, not instantly.",
    steps: [
      {
        prompt:
          "Finance complains the old system flagged too many invoices as 'late payment risk' when they weren't. Your first job is to define how the model decides this label. How do you write that part of the prompt?",
        options: [
          {
            text: "Instruct the model to flag an invoice as late-payment risk whenever it 'seems overdue or financially concerning' based on its overall judgment.",
            consequence:
              "Vague subjective language keeps false positives high; the model flags anything with urgent-sounding words. Finance loses trust again.",
          },
          {
            text: "Give explicit categorical criteria: flag as 'late_payment_risk' ONLY if due_date is in the past AND no payment_received date exists; otherwise label 'on_track'. List the exact conditions and an example of a NON-qualifying case.",
            correct: true,
            consequence:
              "Precise, testable criteria with a negative example sharply cut false positives. The model now flags only genuine cases.",
          },
          {
            text: "Ask the model to assign a 0-100 'risk score' and let downstream code threshold it, leaving the definition of risk entirely to the model.",
            consequence:
              "An undefined score just relocates the ambiguity. Calibration drifts across layouts and the threshold becomes guesswork.",
          },
          {
            text: "Tell the model to be 'conservative and only flag when very confident,' trusting it to self-regulate its precision.",
            consequence:
              "Confidence language without concrete criteria is unreliable; the model's sense of 'confident' doesn't match finance's definition.",
          },
        ],
      },
      {
        prompt:
          "Test runs show the model handles clean digital invoices well but mangles the messier scanned layouts where totals appear in different positions. How do you improve consistency across layouts?",
        options: [
          {
            text: "Raise the temperature so the model explores more interpretations of unusual layouts.",
            consequence:
              "Higher temperature increases variance, not accuracy. Extractions become even less consistent across the messy scans.",
          },
          {
            text: "Add a paragraph telling the model to 'carefully read the whole document and try harder on difficult layouts.'",
            consequence:
              "Exhortation without concrete examples doesn't teach the model the varied formats. The hard scans still fail.",
          },
          {
            text: "Include 3-4 few-shot examples spanning the distinct layout types (digital, scanned-with-stamp, two-column), each showing the raw input and the exact target JSON.",
            correct: true,
            consequence:
              "Diverse worked examples teach the model to normalize across formats, and output consistency jumps on the hard layouts.",
          },
        ],
      },
      {
        prompt:
          "Some invoices genuinely lack a tax ID, but the model keeps inventing plausible-looking ones rather than leaving the field empty. How do you stop the fabrication?",
        options: [
          {
            text: "Define the output via a tool-use JSON schema where tax_id is explicitly nullable (type: ['string','null']), and instruct the model to return null when the field is absent rather than guessing.",
            correct: true,
            consequence:
              "An explicit nullable field plus a 'return null if absent' instruction gives the model a legal way to abstain. Fabricated tax IDs stop.",
          },
          {
            text: "Add a post-processing regex that validates tax-ID format and blanks any that don't match the expected pattern.",
            consequence:
              "Fabricated IDs often match the format perfectly, so they pass the regex. The hallucination survives into the ERP.",
          },
          {
            text: "Make tax_id a required string field and append a strongly worded warning in the prompt that inventing values is strictly forbidden and will be penalized.",
            consequence:
              "A required field with no null option forces the model to produce something; the threat doesn't override the schema constraint.",
          },
          {
            text: "Lower max_tokens so the model has less room to elaborate fabricated details.",
            consequence:
              "Token limits truncate output but don't address why fields are invented. You just get fabricated IDs in shorter responses.",
          },
        ],
      },
      {
        prompt:
          "Even with the schema, a small fraction of responses come back with an invalid 'currency' value (e.g., 'dollars' instead of an ISO code) or malformed JSON. How do you guarantee clean records reach the ERP?",
        options: [
          {
            text: "Constrain currency to an enum of valid ISO codes in the schema, then validate every response; on a validation failure, retry that single document with the specific error fed back to the model.",
            correct: true,
            consequence:
              "Enum constraints plus a validate-then-retry loop with targeted feedback catches and self-corrects the rare bad records before they land.",
          },
          {
            text: "Run every document twice and keep whichever response happens to parse as valid JSON, discarding the other.",
            consequence:
              "Doubling cost for a blind second try wastes spend and still has no recovery path when both attempts fail validation.",
          },
          {
            text: "Pipe all outputs through a permissive parser that coerces 'dollars' to 'USD' and best-effort repairs broken JSON, accepting whatever it produces.",
            consequence:
              "Silent coercion guesses at intent and masks real extraction errors, letting subtly wrong records into finance's books unnoticed.",
          },
        ],
      },
      {
        prompt:
          "The pipeline is accurate, but processing 200,000 invoices synchronously is expensive and you have a full 24-hour window. Each invoice also shares a large static system prompt with schema and few-shot examples. How do you run the job efficiently?",
        options: [
          {
            text: "Fire all 200,000 requests concurrently through the standard synchronous API to finish as fast as possible.",
            consequence:
              "You blow through rate limits, hit throttling, and pay full price for a job that had no need to finish in minutes.",
          },
          {
            text: "Submit the invoices through the Message Batches API for the ~50% cost discount on this latency-tolerant job, and use prompt caching so the shared schema and few-shot prefix are billed cheaply across calls.",
            correct: true,
            consequence:
              "Batch processing halves cost within your 24-hour window, and caching the static prefix slashes input-token spend on the repeated instructions.",
          },
          {
            text: "Concatenate 50 invoices into each prompt so one call extracts many at once, cutting the number of requests dramatically.",
            consequence:
              "Stuffing many documents into one context dilutes attention and causes cross-contamination between invoices, hurting per-document accuracy.",
          },
          {
            text: "Keep synchronous calls but downgrade to the cheapest model to save money on the volume.",
            consequence:
              "Trading the accuracy you carefully built for a blanket model downgrade reintroduces the extraction errors finance can't tolerate.",
          },
        ],
      },
    ],
    outcome:
      "By grounding the label in explicit categorical criteria, teaching layout variety with few-shot examples, allowing nullable fields to stop fabrication, enforcing enums with a validate-and-retry loop, and exploiting the Batches API plus prompt caching for a latency-tolerant job, you ship an accurate, cost-efficient pipeline. The key lesson: structured output quality comes from constraining and validating the model, not from exhorting it, and architecture choices like batching and caching pay off most when you treat each document independently to avoid attention dilution.",
  },
  {
    id: "case5",
    domain: 5,
    title: "The Case That Wouldn't End",
    scenario:
      "You are the architect on call for ClaimPilot, a production agent that manages insurance claims across weeks-long, multi-turn conversations while pulling evidence from a sprawling internal codebase and several external data sources. A high-value claim has been open for 40+ turns, and pages are firing: the agent is starting to drop facts, give shaky answers, and contradict its own findings. You have to keep the case alive and trustworthy.",
    steps: [
      {
        prompt:
          "Around turn 40 the agent begins forgetting the claimant's policy number and coverage limits established early on. Your teammate suggests just running /compact to free up the context window. How do you preserve the critical case facts?",
        options: [
          {
            text: "Run /compact now and again whenever the window fills, letting the summarizer condense old turns.",
            consequence:
              "Compaction is lossy and opportunistic: the policy number and limits get summarized into vague prose or dropped entirely, and the agent keeps contradicting itself on the exact figures.",
          },
          {
            text: "Maintain a persistent structured fact block (policy number, coverage limits, key dates, decisions) that is re-injected every turn and updated as the case evolves.",
            correct: true,
            consequence:
              "The load-bearing facts now survive regardless of window pressure, and the agent stops dropping or mutating them across turns.",
          },
          {
            text: "Raise the model to its largest context window and stop worrying about pruning, since everything will fit.",
            consequence:
              "Even with room to spare, recall degrades over a long noisy transcript, and a bigger window just delays the same fact-loss while inflating cost and latency.",
          },
          {
            text: "Tell the agent in the system prompt to 'always remember important details' and trust it to retain them.",
            consequence:
              "A soft instruction can't override window eviction; the facts still scroll out of context and the reminder does nothing to anchor them.",
          },
        ],
      },
      {
        prompt:
          "The claimant writes: 'Go ahead and process my reimbursement for the incident.' But there are two open incidents on file with different payout amounts. How should the agent proceed?",
        options: [
          {
            text: "Ask exactly one targeted clarifying question naming the two incidents and their amounts, then wait for the claimant to pick.",
            correct: true,
            consequence:
              "A single precise question resolves the ambiguity cheaply and prevents an irreversible wrong payout without burying the user in interrogation.",
          },
          {
            text: "Pick the more recent incident, since claimants usually mean their latest issue, and proceed with that reimbursement.",
            consequence:
              "The guess is wrong: the claimant meant the older incident, and the agent issues an incorrect payout that now requires a costly clawback.",
          },
          {
            text: "Process both incidents to be safe, reasoning that the claimant is entitled to both anyway.",
            consequence:
              "Acting beyond the stated request triggers a duplicate disbursement and a compliance flag for unauthorized payouts.",
          },
        ],
      },
      {
        prompt:
          "To compute the payout, the agent must trace coverage logic across a large, unfamiliar internal codebase. Loading the whole repo into context is wrecking recall on the rest of the case. What's the right approach?",
        options: [
          {
            text: "Greedily read every file in the coverage module into the main context so nothing is missed, then reason over all of it at once.",
            consequence:
              "The flood of source code crowds out the case facts and prior decisions, and recall on the actual claim collapses under the noise.",
          },
          {
            text: "Dispatch subagents to explore the codebase and write distilled findings to scratchpad files, then pull only those summaries into the main thread.",
            correct: true,
            consequence:
              "Exploration cost is isolated in the subagents, and the main context stays lean while still receiving the exact coverage logic it needs.",
          },
          {
            text: "Ask the agent to summarize the codebase from memory of similar systems rather than reading it.",
            consequence:
              "Hallucinated coverage rules diverge from the real implementation, producing a payout calculation that won't survive audit.",
          },
          {
            text: "Grep for the single function name you think matters and read only that, skipping its dependencies.",
            consequence:
              "Missing the upstream eligibility checks and rate tables, the agent computes against partial logic and lands on a wrong figure.",
          },
        ],
      },
      {
        prompt:
          "Mid-calculation, an external rate-table API times out, returning only partial results. How should the agent handle this failure within the larger workflow?",
        options: [
          {
            text: "Silently retry in a loop until the API responds, holding the whole case until it succeeds.",
            consequence:
              "The case stalls indefinitely on a flapping dependency, and downstream steps get no signal about what actually failed.",
          },
          {
            text: "Drop the rate-table step and proceed with whatever default value seems reasonable so the case keeps moving.",
            consequence:
              "An invented default silently corrupts the payout, and no one downstream knows the figure rests on a fabricated rate.",
          },
          {
            text: "Propagate a structured error capturing what failed, what partial data was retrieved, and which downstream steps are blocked, so the workflow can decide.",
            correct: true,
            consequence:
              "Downstream components and reviewers can see exactly what's missing and what's usable, enabling a safe partial-progress decision instead of a silent corruption.",
          },
        ],
      },
      {
        prompt:
          "The agent assembles a final recommendation, citing the policy doc, a claims-history DB, and an adjuster's note that conflicts with the DB on the loss date. You also need to decide what gets auto-approved versus human-reviewed. What's the best move?",
        options: [
          {
            text: "Have the agent reconcile the conflict itself by trusting the source it judges most authoritative, and auto-approve everything it labels high-confidence.",
            consequence:
              "An unaudited self-reconciliation buries the real discrepancy, and trusting raw confidence labels lets miscalibrated 'high-confidence' errors sail through unchecked.",
          },
          {
            text: "Preserve each claim's source provenance, explicitly annotate the loss-date conflict for a human, and route via confidence calibration — auto-approving only after stratified spot-checks validate the high-confidence tier.",
            correct: true,
            consequence:
              "Reviewers see exactly which source backs each fact and where the conflict is, and sampling the high-confidence outputs verifies the calibration before anything auto-approves.",
          },
          {
            text: "Drop the adjuster's note since it conflicts with the structured DB, and present a single clean reconciled answer.",
            consequence:
              "Discarding the dissenting source erases information a human needed; the adjuster's note was actually correct, and the clean answer is confidently wrong.",
          },
          {
            text: "Send the entire recommendation to human review regardless of confidence to be safe.",
            consequence:
              "Blanket review throws away the value of calibration, overwhelms reviewers, and trains them to rubber-stamp, weakening scrutiny where it actually matters.",
          },
        ],
      },
    ],
    outcome:
      "ClaimPilot closes the case correctly: durable fact blocks held the load-bearing details, a single clarifying question and honored escalation avoided wrong payouts, subagent scratchpads kept codebase exploration from poisoning context, structured error propagation surfaced the API failure, and provenance plus calibrated sampling caught the source conflict before auto-approval. The lesson: in long-lived multi-source agents, reliability comes from deliberately structuring context, ambiguity, errors, and confidence rather than trusting the model to remember, guess, or self-reconcile.",
  },
];

export function getCaseStudyForDomain(domainId) {
  const id = typeof domainId === "string" ? parseInt(domainId, 10) : domainId;
  return CASE_STUDIES.find((c) => c.domain === id) ?? null;
}

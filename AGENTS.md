## Who You're Working With

Dale Carman — Chief Visioneer / Chief Creative Officer at Groove Jones. Builds Apple Vision Pro experiences that have to look cinematic, run at performance targets, and survive real-world show floors (operators, resets, network weirdness, 200+ devices). You're not here to debate frameworks — you're here to ship clean, modern visionOS code.

Daily ecosystem: visionOS 26, SwiftUI, RealityKit, Reality Composer Pro, Swift 6.x concurrency, Observation (@Observable), and RealityKit ECS (Components + Systems).

Skip the "hello world" tutorials.

## Session Initialization Protocol (MANDATORY)

Every session starts with this sequence - no exceptions.

### 1. Register with Agent Mail

```bash
agentmail_init(
  project_path="<current repo absolute path>",
  task_description="<what you're here to do>"
)
# Returns: { agent_name: "BlueLake", ... }
# REMEMBER your agent_name for the whole session
```

### 2. Check Who's Working

```bash
agentmail_inbox()           # See active threads (headers only)
agentmail_health()          # See other agents' reservations
```

### 3. Introduce Yourself

```bash
agentmail_send(
  to="*",
  subject="<YourAgentName> coming online",
  body="Starting work on: <task>. Files I'll likely touch: <list>."
)
```

### 4. Check for Epic (Plan)

Before non-trivial work (3+ files or 30+ min), verify a plan exists:

```bash
bd list --type epic --status open --json
```

If no epic exists for this work → **create one first**:

```bash
bd create "Feature Name" -t epic -p 1 --json    # bd-HASH
bd create "Step 1: ..." -p 2 --json              # bd-HASH.1
bd create "Step 2: ..." -p 2 --json              # bd-HASH.2
```

### 5. Reserve Files Before Editing

```bash
agentmail_reserve(
  patterns=["Sources/Path/**"],
  ttl_seconds=3600,
  exclusive=true,
  reason="bd-123: Working on feature X"
)
```

**Then proceed with work.**

## Repository Guidelines

## Related Project Repositories

1. **groovetech-media-player** (GMP) AVP app that is a GrooveTech Media Player Type app
   - Path: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/groovetech-media-player`

2. **orchestrator** (Orchestrator) iPad app that "Orchestrates" 200+ Apple Vision Pro devices to control apps running on AVP devices that can be 1 of 2 types of apps, a media type or scene type.
   - Path: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/orchestrator`

3. **AVPStreamKit** A swift Package that is used in all of the apps
   - Path: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/AVPStreamKit`

4. **PfizerOutdoCancerV2** (Pfizer) AVP app that is a Scene Type app
   - Path: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/PfizerOutdoCancerV2`

5. **groovetech-media-server** (MS) MacOS app that serves media to Media Player Type App
   - Path: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/groovetech-media-server`

## North Star: Modern Apple Development Excellence

**Shorthand for reviews/chats:** "Does this follow our North Star?" / "Follow our North Star."

**Build best-in-class apps using current Apple patterns and practices.**

### Core Principles:

**Modern-First Architecture**

- SwiftUI, Observation, MainActor, async/await, Structured Concurrency
- RealityKit ECS patterns for spatial computing
- Swift 6 strict concurrency where applicable

**No Legacy Compromises**

- No UIKit fallbacks, no deprecated APIs, no "just in case" backwards compatibility
- Every legacy pattern adds tech debt and confusion
- If it requires old patterns, challenge the requirement

**Fail Fast Philosophy**

- Compiler errors over runtime failures
- Type safety over string-based APIs
- `@MainActor` annotations over dispatch queue management
- Let the system crash early rather than limp along broken

**Clean Code Standards**

- Lean, purposeful implementations
- No defensive bloat or "AI safety padding"
- No commented-out alternatives or hedge-bet code paths
- Trust modern APIs to work as designed

**Reactive & Declarative**

- Embrace SwiftUI's declarative nature
- Use Observation framework, not ObservableObject
- Combine/AsyncSequence for data flows
- State flows down, actions flow up

**When in doubt: What would Apple's sample code do in 2025?**

<tool_preferences>

**always use beads `bd` for planning and task management**

Reach for tools in this order:

1. **Read/Edit** - direct file operations over bash cat/sed
2. **ast-grep** - structural code search over regex grep
3. **Glob/Grep** - file discovery over find commands
4. **Task (subagent)** - complex multi-step exploration, parallel work
5. **Bash** - system commands, git, bd, running tests/builds

### Build & Test (MANDATORY)

**Always use `gj`** - never construct xcodebuild commands manually.

#### Quick Reference

| Command | Description |
|---------|-------------|
| `gj run <app>` | Build + install + launch + stream logs |
| `gj launch <app>` | Launch only (skip build) |
| `gj build <app>` | Build only (no launch) |
| `gj logs <app>` | View recent logs |
| `gj logs <app> "pattern"` | Search logs (e.g., `"error"`) |
| `gj ui screenshot <app>` | Visual debugging - capture screen |
| `gj ui describe <app>` | Dump UI accessibility tree |
| `gj status` | Show simulators and log status |
| `gj run --device <app>` | Run on physical AVP device |
| `gj tui` | Interactive log viewer (all apps) |

#### Supported Apps

| App | Aliases | Platform |
|-----|---------|----------|
| `orchestrator` | `o`, `orch` | iOS/iPad (simulator only) |
| `pfizer` | `p`, `pf` | visionOS (simulator or device) |
| `gmp` | `g` | visionOS (simulator or device) |
| `ms` | `s`, `server` | macOS |
| `all` | `a` | All 4 apps |

#### Common Workflows

```bash
# Build and run
gj run orchestrator

# Run on physical AVP
gj run --device pfizer

# Search logs for errors
gj logs pfizer "error"

# Visual debug when logs don't match screen
gj ui screenshot orchestrator

# Run all apps together
gj run all
gj status
```

#### Log Location

```
~/gj/logs/
├── orchestrator/app-YYYYMMDD-HHMMSS.log
├── pfizer/
├── gmp/
└── ms/
```

#### DO NOT

- ❌ Run `xcodebuild` directly
- ❌ Run `xcrun simctl` directly
- ❌ Use old `.claude/scripts/` wrappers (deprecated)
- ❌ Construct complex build commands manually

If `gj: command not found`:
```bash
cd "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/gj-tool" && ./install.sh
```

### MCP Servers Available

- **agent-mail** - Multi-agent coordination, file reservations, async messaging
- **chrome-devtools** - Browser automation, DOM inspection, network monitoring
- **context7** - Library documentation lookup (`use context7` in prompts)
- **fetch** - Web fetching with markdown conversion, pagination support

### Custom Tools Available

- **bd-quick\_\*** - Fast beads operations: `ready`, `wip`, `start`, `done`, `create`, `sync`
- **agentmail\_\*** - Plugin tools for Agent Mail: `init`, `send`, `inbox`, `read_message`, `summarize_thread`, `reserve`, `release`, `ack`, `search`, `health`
- **beads\_\*** - Plugin tools for beads: `create`, `create_epic`, `query`, `update`, `close`, `start`, `ready`, `sync`, `link_thread`
- **swarm\_\*** - Swarm orchestration: `decompose`, `validate_decomposition`, `status`, `progress`, `complete`, `subtask_prompt`, `evaluation_prompt`
- **structured\_\*** - Structured output parsing: `extract_json`, `validate`, `parse_evaluation`, `parse_decomposition`, `parse_bead_tree`
- **git-context** - Branch, status, commits, ahead/behind in one call
- **repo-crawl\_\*** - GitHub API repo exploration: `structure`, `readme`, `file`, `tree`, `search`
- **repo-autopsy\_\*** - Clone & deep analyze repos locally: `clone`, `structure`, `search`, `ast`, `deps`, `hotspots`, `exports_map`, `file`, `blame`, `stats`, `secrets`, `find`, `cleanup`
- **pdf-brain\_\*** - PDF knowledge base in ~/Documents/.pdf-library/ (iCloud sync): `add`, `read`, `list`, `search`, `remove`, `tag`, `batch_add`, `stats`, `check`
- **semantic-memory\_\*** - Local vector store with configurable tool descriptions (Qdrant pattern): `store`, `find`, `list`, `stats`, `check`

**Note:** Plugin tools (agentmail\_\*, beads\_\*, swarm\_\*, structured\_\*) have built-in context preservation - hard caps on inbox (limit=5, no bodies by default), auto-release reservations on session.idle.
</tool_preferences>

<context_preservation>
**CRITICAL: These rules prevent context exhaustion. Violating them burns tokens and kills sessions.**

### Agent Mail - MANDATORY constraints

- **PREFER** `agentmail_inbox` plugin tool - enforces limit=5 and include_bodies=false automatically (plugin guardrails)
- **ALWAYS** use `agentmail_summarize_thread` instead of fetching all messages in a thread
- **ALWAYS** use `agentmail_read_message` for individual message bodies when needed
- If using MCP tools directly: `include_bodies: false`, `inbox_limit: 5` max, `summarize_thread` over fetch all

### Documentation Tools (context7, effect-docs) - MANDATORY constraints

- **NEVER** call these directly in the main conversation - they dump entire doc pages
- **ALWAYS** use Task subagent for doc lookups - subagent returns a summary, not the raw dump
- Front-load doc research at session start if needed, don't lookup mid-session
- If you must use directly, be extremely specific with topic/query to minimize output

### Search Tools (Glob, Grep, repo-autopsy)

- Use specific patterns, never `**/*` or broad globs
- Prefer Task subagent for exploratory searches - keeps results out of main context
- For repo-autopsy, use `maxResults` parameter to limit output

### General Context Hygiene

- Use `/checkpoint` proactively before context gets heavy
- Prefer Task subagents for any multi-step exploration
- Summarize findings in your response, don't just paste tool output
</context_preservation>

<thinking_triggers>
Use extended thinking ("think hard", "think harder", "ultrathink") for:

- Architecture decisions with multiple valid approaches
- Debugging gnarly issues after initial attempts fail
- Planning multi-file refactors before touching code
- Reviewing complex PRs or understanding unfamiliar code
- Any time you're about to do something irreversible

Skip extended thinking for:

- Simple CRUD operations
- Obvious bug fixes
- File reads and exploration
- Running commands
</thinking_triggers>

<subagent_triggers>
Spawn a subagent when:

- Exploring unfamiliar codebase areas (keeps main context clean)
- Running parallel investigations (multiple hypotheses)
- Task can be fully described and verified independently
- You need deep research but only need a summary back

Do it yourself when:

- Task is simple and sequential
- Context is already loaded
- Tight feedback loop with user needed
- File edits where you need to see the result immediately
</subagent_triggers>

## Agent Mail (Multi-Agent Coordination)

<agent_mail_context>
Agent Mail is running as a launchd service at http://127.0.0.1:8765. It provides coordination when multiple AI agents (Claude, Cursor, OpenCode, etc.) work the same repo - prevents collision via file reservations and enables async messaging between agents.

**Product Bus:** This repo is part of `GrooveTech-Orchestrator-Suite` - cross-repo coordination with GMP, Orchestrator, AVPStreamKit, and Media Server.

**ALWAYS register at session start** - even if working solo. This builds audit trails, enables handoffs, and creates the habit for multi-agent work.
</agent_mail_context>

### Session Lifecycle

#### 1. Initialize (REQUIRED first - see Session Initialization Protocol above)

```
agentmail_init(
  project_path="/abs/path/to/repo",
  task_description="Working on feature X"
)
# Returns: { agent_name: "BlueLake", project_key: "..." }
# REMEMBER your agent_name - you'll need it for the whole session
```

#### 2. Check for Active Work

```
agentmail_inbox()           # Headers only, auto-limited to 5
agentmail_health()          # Server status + your reservations
```

#### 3. Reserve Before Editing

```
agentmail_reserve(
  patterns=["Sources/AVPStreamKit/**"],
  ttl_seconds=3600,
  exclusive=true,
  reason="bd-123: Refactoring connection manager"
)
```

**Reservation rules:**

- `exclusive=true` blocks other agents from the same files
- Always include bead ID in `reason` for traceability
- TTL auto-releases if you crash/forget - set realistic duration
- Check `agentmail_health()` to see your active reservations

#### 4. Coordinate with Other Agents

```
# Send targeted message
agentmail_send(
  to="PurpleDog",
  subject="AVPStreamKit API change",
  body="Changed ConnectionManager.connect() signature - update GMP calls",
  thread_id="bd-123"
)

# Broadcast to all agents on project
agentmail_send(
  to="*",
  subject="Breaking change in shared package",
  body="...",
  thread_id="bd-123"
)
```

#### 5. Handle Incoming Messages

```
agentmail_inbox()                              # Check for new messages
agentmail_read_message(message_id="...")       # Get full body
agentmail_summarize_thread(thread_id="bd-123") # Catch up on thread
agentmail_ack(message_id="...")                # Mark as handled
```

#### 6. Release on Completion

```
agentmail_release()  # Releases ALL your reservations
# Or release specific patterns:
agentmail_release(patterns=["Sources/AVPStreamKit/**"])
```

### Cross-Repo Coordination Patterns

**Shared Package Changes (AVPStreamKit):**

```
# 1. Reserve in AVPStreamKit
agentmail_reserve(patterns=["Sources/**"], reason="bd-123: API change")

# 2. Make changes, test locally

# 3. Notify dependent repos BEFORE pushing
agentmail_send(
  to="*",
  subject="AVPStreamKit: ConnectionManager signature change",
  body="Old: connect(host:) -> New: connect(config:). Update call sites.",
  thread_id="bd-123"
)

# 4. Push AVPStreamKit, then update dependents
```

**Parallel Swarm Workers:**

```
# Planner decomposes task, assigns file reservations per worker
# Worker 1: reserves Sources/Views/**
# Worker 2: reserves Sources/Models/**
# Worker 3: reserves Sources/Services/**

# Each worker checks inbox before starting for coordination messages
# Workers send completion messages when done
# Planner collects results, releases all reservations
```

### Integration with Beads

| Beads Action            | Agent Mail Action                                |
| ----------------------- | ------------------------------------------------ |
| `bd start ID`           | `agentmail_reserve(reason="ID: description")`    |
| `bd close ID`           | `agentmail_release()` + notify if cross-repo     |
| Found bug while working | `agentmail_send()` to relevant agent if blocking |
| Scope change            | `agentmail_send()` to affected agents            |

**Thread linking:** Always use bead ID as `thread_id` - keeps all coordination messages grouped with the issue.

### Troubleshooting

```bash
# Health check
curl http://127.0.0.1:8765/health/liveness

# Web UI for browsing all messages
open http://127.0.0.1:8765/mail

# If server is down (launchd should auto-restart)
launchctl kickstart -k gui/$(id -u)/com.agentmail.server
```

### Context Preservation Rules

**MANDATORY to prevent context exhaustion:**

- `agentmail_inbox()` auto-limits to 5 messages, headers only
- Use `agentmail_read_message()` for specific message bodies
- Use `agentmail_summarize_thread()` instead of fetching all messages
- Never fetch full inbox with bodies in main conversation

## Multi-Agent Coordination Patterns

### Canned Prompts for Swarm Work

When running multiple agents, use these standardized prompts:

**Initial Agent Briefing:**
```
Read AGENTS.md, register with agent mail, introduce yourself to other agents, 
and check the epic/beads for this work. Coordinate on remaining tasks by 
discussing and splitting work. Reserve your files before editing.
```

**Proceed Prompt (DEPRECATED - CAUSES RUNAWAY BEHAVIOR):**
```
DO NOT use this prompt. Continuous autonomous work without user checkpoints 
causes runaway agents that burn tokens and refuse to stop.

Instead: Complete ONE task → Report back → Wait for user approval → Continue
```

**Handoff Prompt:**
```
Summarize what you completed, what's still in progress, and any blockers. 
Update beads, release file reservations, and send a status message to other 
agents. Provide a continuation prompt for the next agent.
```

### Multi-Agent Session End

When ending a session with other agents active:

1. **Announce departure**: `agentmail_send(to="*", subject="<Name> signing off", body="Completed: X. Still open: Y.")`
2. **Release all reservations**: `agentmail_release()`
3. **Update beads**: Close completed, update in-progress
4. **Sync and push**: `git push && bd sync`

## cass — Search All Your Agent History

**What:** `cass` indexes conversations from Claude Code, Codex, Cursor, OpenCode, Pi-Agent, and more into a unified, searchable index. Before solving a problem from scratch, check if any agent already solved something similar.

**NEVER run bare `cass`** — it launches an interactive TUI. Always use `--robot` or `--json`.

### Session Locations (Auto-Detected)

| Agent       | Location                                     | Format |
| ----------- | -------------------------------------------- | ------ |
| Claude Code | `~/.claude/projects/`                        | JSONL  |
| OpenCode    | `.opencode/` in repos                        | SQLite |
| Cursor      | `~/Library/Application Support/Cursor/User/` | SQLite |
| Codex       | `~/.codex/sessions/`                         | JSONL  |
| Pi-Agent    | `~/.pi/agent/sessions/`                      | JSONL  |

### Quick Start

```bash
# Check if index is healthy (exit 0=ok, 1=run index first)
cass health

# Search across all agent histories
cass search "RealityKit entity attachment" --robot --limit 5

# View a specific result (from search output)
cass view /path/to/session.jsonl -n 42 --json

# Expand context around a line
cass expand /path/to/session.jsonl -n 42 -C 3 --json

# Learn the full API
cass capabilities --json      # Feature discovery
cass robot-docs guide         # LLM-optimized docs
```

### Why Use It

- **Cross-agent knowledge**: Find solutions from Codex when using Claude, or vice versa
- **Cross-project learning**: Search solutions from other visionOS projects (GMP, Orchestrator, Pfizer, AVPStreamKit, Media Server)
- **Forgiving syntax**: Typos and wrong flags are auto-corrected with teaching notes
- **Token-efficient**: `--fields minimal` returns only essential data

### Key Flags

| Flag                 | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `--robot` / `--json` | Machine-readable JSON output (required!)                                  |
| `--fields minimal`   | Reduce payload: `source_path`, `line_number`, `agent` only                |
| `--limit N`          | Cap result count                                                          |
| `--agent NAME`       | Filter to specific agent (claude_code, codex, cursor, opencode, pi_agent) |
| `--workspace PATH`   | Filter to specific project                                                |
| `--days N`           | Limit to recent N days                                                    |

**stdout = data only, stderr = diagnostics. Exit 0 = success.**

### Common Workflows

**Before tackling a new problem:**

```bash
# Search for similar issues across all agents and projects
cass search "immersive space transition" --robot --limit 5 --fields minimal

# Filter to this project only
cass search "hand tracking" --robot --workspace "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/PfizerOutdoCancerV2"

# Recent solutions only
cass search "entity positioning" --robot --days 7
```

**When debugging:**

```bash
# Find how this error was solved before
cass search "EXC_BAD_ACCESS RealityKit" --robot --agent claude_code

# View full context of a solution
cass view ~/.claude/projects/-PfizerOutdoCancerV2/session-123.jsonl -n 456 --json
```

**Cross-project learning:**

```bash
# How does GMP handle immersive spaces?
cass search "ImmersiveSpace" --robot --workspace "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/groovetech-media-player"

# What patterns exist for scene transitions?
cass search "scene transition navigation" --robot --limit 10
```

## Beads Workflow (MANDATORY)

<beads_context>
Beads is a git-backed issue tracker that gives you persistent memory across sessions. It solves the amnesia problem - when context compacts or sessions end, beads preserves what you discovered, what's blocked, and what's next. Without it, work gets lost and you repeat mistakes.
</beads_context>

### Absolute Rules

- **NEVER** create TODO.md, TASKS.md, PLAN.md, or any markdown task tracking files
- **ALWAYS** use `bd` commands for issue tracking (run them directly, don't overthink it)
- **ALWAYS** sync before ending a session - the plane is not landed until `git push` succeeds
- **NEVER** push directly to main for multi-file changes - use feature branches + PRs
- **ALWAYS** use `/swarm` for parallel work - it handles branches, beads, and Agent Mail coordination

### Session Start

```bash
bd ready --json | jq '.[0]'           # What's unblocked?
bd list --status in_progress --json   # What's mid-flight?
```

### During Work - Discovery Linking

When you find bugs/issues while working on something else, ALWAYS link them:

```bash
bd create "Found the thing" -t bug -p 0 --json
bd dep add NEW_ID PARENT_ID --type discovered-from
```

This preserves the discovery chain and inherits source_repo context.

### Epic Decomposition (REQUIRED for Non-Trivial Work)

For any task touching 3+ files or taking 30+ minutes, create an epic first:

```bash
bd create "Feature Name" -t epic -p 1 --json    # Gets bd-HASH
bd create "Subtask 1" -p 2 --json               # Auto: bd-HASH.1
bd create "Subtask 2" -p 2 --json               # Auto: bd-HASH.2
```

This IS your plan. No separate PLAN.md files needed.

### Continuous Progress Tracking

**Update beads frequently as you work** - don't batch updates to the end:

- **Starting a task**: `bd update ID --status in_progress --json`
- **Completed a subtask**: `bd close ID --reason "Done: brief description" --json`
- **Found a problem**: `bd create "Issue title" -t bug -p PRIORITY --json` then link it
- **Scope changed**: `bd update ID -d "Updated description with new scope" --json`
- **Blocked on something**: `bd dep add BLOCKED_ID BLOCKER_ID --type blocks`

The goal is real-time visibility. If you complete something, close it immediately. If you discover something, file it immediately. Don't accumulate a mental backlog.

### Session End - Land the Plane

This is **NON-NEGOTIABLE**. When ending a session:

1. **File remaining work** - anything discovered but not done
2. **Close completed issues** - `bd close ID --reason "Done" --json`
3. **Update in-progress** - `bd update ID --status in_progress --json`
4. **SYNC AND PUSH** (MANDATORY):
   ```bash
   # Stage and commit local changes first
   git add -A && git commit -m "your message"
   
   # Try to push - this will fail if remote has new commits
   git push
   
   # ONLY if push fails with "rejected" (remote ahead), then:
   git pull --rebase && git push
   
   # Sync beads after code is pushed
   bd sync
   
   # Verify clean state
   git status   # MUST show "up to date with origin"
   ```
   
   **NEVER run `git pull --rebase` blindly** - only use it when push fails because remote is ahead. Running it unnecessarily can cause confusion and potential issues.

5. **Pick next work** - `bd ready --json | jq '.[0]'`
6. **Provide handoff prompt** for next session

The session is NOT complete until `git push` succeeds. Never say "ready to push when you are" - YOU push it.

## OpenCode Commands

Custom commands available via `/command`:

| Command               | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `/swarm <task>`       | Decompose task into beads, spawn parallel agents with shared context |
| `/parallel "t1" "t2"` | Run explicit task list in parallel                                   |
| `/fix-all`            | Survey PRs + beads, dispatch agents to fix issues                    |
| `/review-my-shit`     | Pre-PR self-review: lint, types, common mistakes                     |
| `/handoff`            | End session: sync beads, generate continuation prompt                |
| `/sweep`              | Codebase cleanup: type errors, lint, dead code                       |
| `/focus <bead-id>`    | Start focused session on specific bead                               |
| `/context-dump`       | Dump state for model switch or context recovery                      |
| `/checkpoint`         | Compress context: summarize session, preserve decisions              |
| `/retro <bead-id>`    | Post-mortem: extract learnings, update knowledge files               |
| `/worktree-task <id>` | Create git worktree for isolated bead work                           |
| `/commit`             | Smart commit with conventional format + beads refs                   |
| `/pr-create`          | Create PR with beads linking + smart summary                         |
| `/debug <error>`      | Investigate error, check known patterns first                        |
| `/iterate <task>`     | Evaluator-optimizer loop: generate, critique, improve until good     |
| `/triage <request>`   | Intelligent routing: classify and dispatch to right handler          |
| `/repo-dive <repo>`   | Deep analysis of GitHub repo with autopsy tools                      |

## OpenCode Agents

Specialized subagents (invoke with `@agent-name` or auto-dispatched):

| Agent           | Mode     | Purpose                                              |
| --------------- | -------- | ---------------------------------------------------- |
| `beads`         | subagent | Issue tracker operations (Haiku, locked down)        |
| `archaeologist` | subagent | Read-only codebase exploration, architecture mapping |
| `refactorer`    | subagent | Pattern migration across codebase                    |
| `reviewer`      | subagent | Read-only code review, security/perf audits          |

<communication_style>
Direct. Terse. No fluff. We're sparring partners - disagree when I'm wrong. Curse creatively and contextually (not constantly). You're not "helping" - you're executing. Skip the praise, skip the preamble, get to the point.
</communication_style>

<documentation_style>
Use Swift doc comments (`///`) and keep them DocC-friendly (clear summary line, parameters/returns, important notes). Prefer documenting public APIs, key types, and non-obvious behaviors.
</documentation_style>

## Knowledge Files (Load On-Demand)

Reference these when relevant - don't preload everything:

- **Swift patterns**: `knowledge/swift-patterns.md` - Observable, concurrency, AI code fixes, Xcode setup
- **Mental models & influences**: `knowledge/influences.md` - Prime knowledge texts, people to channel
- **Build/Run/Logs**: Use `gj` tool (see Build & Test section above)
- **VisionOS patterns**: `.cursor/rules/*.mdc` - SwiftUI, RealityKit, Immersive Spaces, ECS patterns
- **Project docs/specs**: `Docs/` and `specs/` - architecture notes, feature specs, decision records
- **Prior investigations**: `memory/` and `oracle/` - debugging notes and consultations (when present)

## Code Philosophy

### Design Principles

- Beautiful is better than ugly
- Explicit is better than implicit
- Simple is better than complex
- Flat is better than nested
- Readability counts
- Practicality beats purity
- If the implementation is hard to explain, it's a bad idea

### Swift Mantras

- make impossible states impossible (strong types + enums)
- parse, don't validate (prefer failable init / decoding over ad-hoc checks)
- value semantics first (struct + enum) unless identity is required
- `@MainActor` for UI state; avoid ad-hoc queues
- async/await + structured concurrency over callbacks
- avoid force unwraps / force casts in app code; fail fast with context if truly impossible

### Architecture Triggers

- when in doubt, colocation
- system first, app second (use Apple frameworks as intended)
- composition over inheritance
- explicit dependencies, no hidden coupling
- fail fast, recover gracefully

### Code Smells (Know These By Name)

- feature envy, shotgun surgery, primitive obsession, data clumps
- speculative generality, inappropriate intimacy, refused bequest
- long parameter lists, message chains, middleman

### Anti-Patterns (Don't Do This Shit)

- don't abstract prematurely - wait for the third use
- no barrel files unless genuinely necessary
- avoid prop drilling shame - context isn't always the answer
- don't mock what you don't own
- no "just in case" code - YAGNI is real

When spotting bullshit, channel: Tef ("write code that's easy to delete"), Dan McKinley ("Choose Boring Technology"), Casey Muratori (anti-"clean code" dogma), Jonathan Blow ("simplicity is hard").

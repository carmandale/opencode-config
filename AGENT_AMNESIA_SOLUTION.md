# Solving Agent Amnesia: Architecture & Implementation Plan

**Created:** December 15, 2025
**Status:** Implemented (v1)
**Goal:** Eliminate wasted time from agents re-committing past mistakes and re-fixing past issues

---

## The Problem

```
Session 1: Agent breaks build with pattern X
           You explain why, they fix it
           
Session 2: Agent breaks build with pattern X again
           You explain again (but shorter, frustrated)
           
Session 3: Agent breaks build with pattern X AGAIN
           You: "I TOLD YOU THIS BEFORE" 
           Agent: "I have no memory of this"
           
           🔄 Repeat forever
```

**Pain Points:**
- Agents re-commit past mistakes
- Agents re-fix the same issues repeatedly
- User has to re-explain context every session
- User fatigue leads to worse explanations, which compounds the problem
- Massive token/time waste

---

## Existing Tools Inventory

### 1. CASS (Coding Agent Session Search)

**Location:** `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/coding_agent_session_search`

**What it does:**
- Indexes ALL coding agent sessions (Claude, Codex, Pi, OpenCode, Cursor, Gemini, etc.)
- Full-text search with sub-60ms latency
- Robot mode (JSON API) for AI agents to query history
- Unified schema: `Conversation → Message → Snippet`

**Current Stats:**
| Agent | Conversations |
|-------|---------------|
| claude_code | 2,298 |
| codex | 2,058 |
| opencode | 48 |
| pi_agent | 41 |
| cursor | 9 |
| gemini | 2 |
| amp | 2 |
| **Total** | **4,458 conversations, 80,258 messages** |

**Date Range:** Nov 2023 → Dec 2025

**Key Commands:**
```bash
cass search "query" --robot --limit 10
cass view /path/to/session.jsonl -n 42 --json
cass expand /path/to/session.jsonl -n 42 -C 5 --json
cass stats
```

**Documentation:** `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/CASS_HOWTO.md`

---

### 2. Claude-Mem

**Location:** `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/claude-mem`

**What it does:**
- Claude Code plugin for persistent memory across sessions
- Captures tool usage during sessions
- Compresses observations using Claude Agent SDK
- Injects relevant context into future sessions
- Semantic search via Chroma vector embeddings

**Architecture:**
```
SessionStart → UserPromptSubmit → PostToolUse → Summary → SessionEnd
                                      ↓
                              Worker Service (port 37777)
                                      ↓
                              SQLite + Chroma (semantic)
```

**Key Features:**
- Per-project tracking (observations tagged with `project` field from `cwd`)
- Privacy tags: `<private>` and `<claude-mem-context>`
- Viewer UI at http://localhost:37777
- HTTP API for storing/retrieving observations

**Gap:** Only captures NEW sessions going forward, not historical data

---

### 3. OpenCode

**Location:** `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode`

**What it does:**
- Open source AI coding agent (alternative to Claude Code)
- Built-in agents: `build`, `plan`, `explore`, `general`
- Snapshot system for code state tracking (undo/redo)
- Session summaries and compaction
- Custom commands via `.opencode/command/*.md`

**Key Features:**
- Snapshot tracking: `Snapshot.track()`, `Snapshot.diff()`, `Snapshot.restore()`
- Compaction prompt focuses on: what was done, what's in progress, files modified, next steps, user preferences, technical decisions
- Custom slash commands

---

### 4. OpenCode-Config (Your Knowledge System)

**Location:** `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config`

**This is the core of your existing solution!**

#### Knowledge Base (`knowledge/`)
| File | Purpose |
|------|---------|
| `error-patterns.md` | Known errors → fixes (searchable by error message) |
| `prevention-patterns.md` | Root causes → preventive actions |
| `swift-patterns.md` | Swift/visionOS specific patterns |
| `typescript-patterns.md` | TS patterns |
| `nextjs-patterns.md` | Next.js patterns |
| `effect-patterns.md` | Effect-TS patterns |
| `git-patterns.md` | Git patterns |
| `testing-patterns.md` | Testing patterns |

#### Learning Commands (`command/`)

**`/debug`** - Investigate errors with knowledge-first approach
```
1. Check error-patterns.md FIRST
2. If match found → apply known fix immediately
3. If no match → full investigation
4. Offer to save novel patterns
```

**`/debug-plus`** - Extended debug with swarm + prevention pipeline
```
1. Standard debug investigation
2. Detect multi-file scope → spawn swarm
3. Match prevention-patterns.md
4. Create preventive beads
5. Spawn prevention swarm (optional)
6. Update knowledge base
```

**`/retro`** - Post-mortem to extract patterns
```
1. Gather context (bead, commits, files)
2. Reconstruct the journey
3. Structured reflection (what went well/poorly/surprising)
4. Extract patterns → update knowledge files
5. Create action item beads
```

**`/iterate`** - Generate → Evaluate → Improve loop
```
1. Check error patterns BEFORE generating (prevent known mistakes)
2. Generate initial version
3. Evaluate with critic agent
4. Optimize based on feedback
5. Loop until quality threshold
6. --learn flag: save novel errors discovered
```

**Other Commands:**
- `/checkpoint` - Save state
- `/handoff` - Transfer context to another agent
- `/swarm` - Parallel task decomposition
- `/triage` - Issue prioritization
- `/standup` - Status summary

---

### 5. Pi Coding Agent

**Location:** `/opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent`

**What it does:**
- Another coding agent with hook system
- Sessions stored at `~/.pi/agent/sessions/*.jsonl`
- Already indexed by CASS (41 sessions)

**Hook System (similar to claude-mem):**
```typescript
pi.on("session_start", async (event, ctx) => { ... });
pi.on("tool_call", async (event, ctx) => { ... });
pi.on("tool_result", async (event, ctx) => { ... });
pi.on("agent_end", async (event, ctx) => { ... });
```

**Integration Potential:** Could write a Pi hook that talks to claude-mem's worker service

---

## Current Architecture (What You Have)

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE                               │
│  ~/.config/opencode/knowledge/                                  │
│  • error-patterns.md      (known errors → fixes)                │
│  • prevention-patterns.md (root causes → preventive actions)    │
│  • swift-patterns.md, typescript-patterns.md, etc.              │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING COMMANDS                            │
│  /debug      → Check patterns FIRST, investigate, save novel    │
│  /debug-plus → + swarm investigation + prevention pipeline      │
│  /retro      → Extract patterns from completed work             │
│  /iterate    → Generate → Evaluate → Improve (with --learn)     │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                    CASS (Search Layer)                          │
│  • 80K messages across 7 agents                                 │
│  • Cross-project, cross-agent search                            │
│  • "Did I solve this before?"                                   │
└─────────────────────────────────────────────────────────────────┘
```

### How It Prevents Amnesia Today

| Component | How It Helps |
|-----------|-------------|
| **error-patterns.md** | `/debug` checks here FIRST before investigating |
| **prevention-patterns.md** | `/debug-plus` auto-suggests preventive work |
| **/retro** | Closes the learning loop after every task |
| **/iterate --learn** | Captures novel errors during development |
| **CASS** | "Did any agent solve this before?" |

---

## The Gap (What's Still Missing)

The system is **excellent** but requires **manual invocation**:

| Current State | Ideal State |
|--------------|-------------|
| User must remember to run `/debug` | Auto-detect errors and check patterns |
| User must remember to run `/retro` | Auto-prompt at session end |
| Knowledge injection only on `/debug` | Inject at session start |
| No pre-edit warnings | Warn before touching problem files |
| Per-agent silos | Cross-agent knowledge sync |

### Missing Pieces

1. **Automatic Session Start Injection**
   - Project-specific pitfalls from prevention-patterns.md
   - Recent lessons from /retro
   - CASS summary of past sessions in this project

2. **Pre-Edit Warnings**
   - When about to edit a file mentioned in error-patterns.md
   - When touching files that caused issues in recent CASS sessions

3. **On-Error Auto-Detection**
   - Error appears → auto-check error-patterns.md
   - "This matches known pattern X. Known fix: Y"

4. **Session End Learning**
   - Auto-prompt for /retro
   - Or auto-extract minimal lessons

5. **Cross-Agent Sync**
   - Knowledge base accessible from Claude Code, OpenCode, Pi
   - Same warnings/context regardless of which agent

---

## Proposed Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION START (Auto-Inject)                  │
│  • "This project has these known pitfalls: [from prevention]"   │
│  • "Recent lessons from /retro: [last 3]"                       │
│  • "CASS found 5 past sessions in this project"                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-EDIT HOOK (Auto-Warn)                    │
│  When about to edit IntroViewModel.swift:                       │
│  ⚠️ "This file has 3 entries in error-patterns.md"              │
│  ⚠️ "Last 2 sessions here had 'entity parenting' issues"        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ON-ERROR AUTO-DETECT                         │
│  Error appears → auto-check error-patterns.md                   │
│  "This matches known pattern: <X>. Known fix: <Y>"              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION END (Auto-Learn)                     │
│  Auto-prompt: "Run /retro on this session? (y/n)"               │
│  Or auto-extract minimal lessons                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Options

### Option 1: OpenCode Plugin/Hook

Create an OpenCode plugin that:
- On session start: reads knowledge base + queries CASS → injects context
- On pre-edit: checks if file is in error-patterns.md → warns
- On error detection: auto-matches patterns
- On session end: prompts for /retro

**Pros:** Native to OpenCode, no external service needed
**Cons:** Only works in OpenCode

### Option 2: Extend Claude-Mem

Modify claude-mem to:
- Read your knowledge base at session start
- Query CASS for project context
- Inject combined context

**Pros:** Works with Claude Code, has infrastructure
**Cons:** Requires modification, currently capture-focused not knowledge-focused

### Option 3: Unified Memory Service

Create a new service that:
- Hosts the knowledge base (error-patterns, prevention-patterns)
- Provides HTTP API for all agents
- Auto-generates session-start context
- Accepts lesson submissions from any agent

**Pros:** Agent-agnostic, single source of truth
**Cons:** New service to build and maintain

### Option 4: Hybrid (Recommended)

1. **Keep knowledge base as markdown files** (human-editable, git-tracked)
2. **Build context generator script** that reads knowledge + CASS → outputs injection text
3. **Add hooks to each agent** that call the context generator at session start
4. **Extend /debug to be more automatic** (detect errors in tool output)

---

## Next Steps

### Immediate (Low Effort, High Value)

1. **Create `/context-inject` command** that generates session-start context:
   ```bash
   # Reads project path, queries CASS, reads relevant knowledge files
   # Outputs markdown to paste into session
   ```

2. **Add file-level warnings to error-patterns.md**:
   ```markdown
   **Files:** `IntroViewModel.swift`, `EntityWrapper.swift`
   ```
   Then grep for these when starting work in a project.

3. **Auto-suggest /retro** in AGENTS.md:
   ```markdown
   Before ending a session, consider running `/retro` to capture lessons.
   ```

### Medium Term

4. **OpenCode session-start hook** that auto-injects context

5. **Pre-edit warning system** (query knowledge base before write/edit)

6. **Error auto-detection** in tool output → auto-query error-patterns.md

### Long Term

7. **Cross-agent sync** via shared knowledge service

8. **Automatic lesson extraction** from sessions (mine CASS for corrections)

9. **ML-based pattern matching** for errors (not just regex)

---

## Files to Reference

### Your Knowledge System
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/knowledge/error-patterns.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/knowledge/prevention-patterns.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/command/debug.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/command/debug-plus.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/command/retro.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/command/iterate.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/CASS_HOWTO.md`
- `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode-config/AGENTS.md`

### External Tools
- CASS: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/coding_agent_session_search`
- Claude-Mem: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/claude-mem`
- OpenCode: `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/opencode`
- Pi Agent Docs: `/opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/docs/hooks.md`

### Data Locations
- Claude Code sessions: `~/.claude/projects/`
- Pi sessions: `~/.pi/agent/sessions/`
- OpenCode sessions: `~/.local/share/opencode/storage/`
- CASS database: `~/Library/Application Support/com.coding-agent-search.coding-agent-search/agent_search.db`
- Claude-Mem database: `~/.claude-mem/claude-mem.db`

---

## Key Insight

**You've already built 80% of the solution.** The knowledge base + /debug + /retro + CASS is a complete learning system. The remaining 20% is **automation** - making it happen without requiring the user to remember to invoke it.

The goal isn't to build something new. It's to **wire up what exists** so it triggers automatically.

---

## Related Beads/Tasks

- [x] Create `/context-inject` command → **Implemented as plugin hook**
- [x] Add session-start hook to OpenCode → **`plugin/amnesia.ts` session.created**
- [x] Add pre-edit warning for known problem files → **`plugin/amnesia.ts` tool.execute.before**
- [x] Auto-detect errors in tool output → **`plugin/amnesia.ts` tool.execute.after**
- [ ] Bridge claude-mem to knowledge base
- [ ] Create cross-agent knowledge sync service

---

## Implementation (v1) - December 15, 2025

### Plugin: `plugin/amnesia.ts`

**Location:** `~/.config/opencode/plugin/amnesia.ts`

**Hooks implemented:**

1. **`session.created`** - Injects context at session start:
   - Counts error patterns from `knowledge/error-patterns.md`
   - Shows relevant prevention patterns for visionOS projects
   - Queries CASS for recent sessions in the project
   - Reminds about `/retro` at session end

2. **`tool.execute.before`** - Pre-edit warnings:
   - When editing files mentioned in error-patterns.md `**Files:**` field
   - Shows which patterns apply to that file

3. **`tool.execute.after`** - Error auto-detection:
   - Monitors bash and typecheck tool output for errors
   - Matches against known patterns in error-patterns.md
   - Shows known fix when pattern matches
   - Tracks if session had errors

4. **`session.idle`** - Learning prompt:
   - If session had errors and lasted >5 minutes
   - Prompts to run `/retro` to capture learnings

### To Enable

The plugin auto-loads from `~/.config/opencode/plugin/`. No configuration needed.

### To Add File-Level Warnings

Add `**Files:**` field to error patterns:

```markdown
### My Error Pattern

**Pattern:** `some error regex`

**Files:** `IntroViewModel.swift`, `EntityWrapper.swift`

**Fixes:**
...
```

### Future Improvements

1. **Smarter CASS queries** - Use project-specific keywords
2. **Pattern learning** - Auto-extract patterns from /retro output
3. **Cross-agent sync** - Share knowledge with Claude Code via claude-mem
4. **Severity levels** - Warn vs block based on pattern criticality

---

*Document created from conversation on December 15, 2025*
*Implementation completed December 15, 2025*

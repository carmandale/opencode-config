# CASS How-To Guide

**CASS** (Coding Agent Session Search) indexes conversations from multiple AI coding agents into a unified, searchable database. Before solving a problem from scratch, check if any agent already solved something similar.

---

## Quick Reference

| Task | Command |
|------|---------|
| Health check | `cass health --json` |
| Search | `cass search "query" --robot --limit 10` |
| View a result | `cass view /path/to/session.jsonl -n 42 --json` |
| Expand context | `cass expand /path/to/session.jsonl -n 42 -C 5 --json` |
| Rebuild index | `cass index --full` |
| Get help | `cass robot-docs guide` |

---

## Your Current Index Stats

As of December 2025, your cass index contains:

### Agents Indexed (7 total)
| Agent | Conversations |
|-------|---------------|
| claude_code | 2,298 |
| codex | 2,058 |
| opencode | 48 |
| pi_agent | 41 |
| cursor | 9 |
| gemini | 2 |
| amp | 2 |

**Total: 4,458 conversations with 80,258 messages**

### Top Workspaces
- `orchestrator` — 520 conversations
- `PfizerOutdoCancerV2` — 419 conversations
- `groovetech-media-player` — 41 conversations
- `groovetech-media-server` — 41 conversations
- `oracle` — 27 conversations

---

## Practical Examples

### Example 1: Find Past Solutions

You're implementing database retry logic and remember solving something similar before:

```bash
# Step 1: Check health
cass health --json

# Step 2: Search across all agents
cass search "database connection retry" --robot --limit 5

# Step 3: View the best result
cass view /path/from/result.jsonl -n 42 --json

# Step 4: Get more context if needed
cass expand /path/from/result.jsonl -n 42 -C 10 --json
```

### Example 2: Filter by Agent

Search only Claude Code conversations:
```bash
cass search "authentication middleware" --robot --agent claude_code --limit 10
```

### Example 3: Recent Conversations Only

Limit to the last 7 days:
```bash
cass search "error handling" --robot --days 7 --limit 10
```

### Example 4: Filter by Workspace

Search within a specific project:
```bash
cass search "visionOS" --robot --workspace /path/to/PfizerOutdoCancerV2 --limit 10
```

---

## Understanding Search Results

A typical search result looks like:

```json
{
  "results": [
    {
      "source_path": "/Users/you/.claude/sessions/abc123.jsonl",
      "line_number": 42,
      "agent": "claude_code",
      "snippet": "...implemented exponential backoff for database reconnection...",
      "score": 0.89
    }
  ]
}
```

Key fields:
- **source_path**: The session file containing the match
- **line_number**: Where in the file the match occurs
- **agent**: Which AI agent had this conversation
- **snippet**: Preview of the matching content
- **score**: Relevance score (higher = better match)

---

## Useful Search Queries

| What You're Looking For | Query |
|------------------------|-------|
| Error handling patterns | `cass search "error handling unwrap" --robot` |
| API implementations | `cass search "REST API endpoint" --robot` |
| Database operations | `cass search "sqlx query migration" --robot` |
| Authentication | `cass search "auth JWT token" --robot` |
| Swift/iOS specific | `cass search "SwiftUI visionOS" --robot --workspace /path/to/ios-project` |
| Recent fixes | `cass search "fix bug" --robot --days 3` |

---

## Maintenance Commands

### Rebuild the Full Index
```bash
cass index --full
```

### Check Index Status
```bash
cass status --json
```

### View Capabilities
```bash
cass capabilities --json
```

---

## Key Flags Reference

| Flag | Purpose |
|------|---------|
| `--robot` / `--json` | Machine-readable JSON output |
| `--limit N` | Cap number of results |
| `--agent NAME` | Filter to specific agent (claude_code, codex, cursor, etc.) |
| `--days N` | Limit to recent N days |
| `--workspace PATH` | Filter to specific project directory |
| `--fields minimal` | Reduce output to essential fields only |
| `-C N` (with expand) | Lines of context before/after |

---

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Proceed |
| 1 | Health check failed | Run `cass index --full` |
| 2 | Usage/parsing error | Fix syntax |
| 3 | Missing index | Run `cass index` first |

---

## ⚠️ Important Notes

1. **Never run bare `cass`** — it launches an interactive TUI. Always use `--robot` or `--json` for scripting/automation.

2. **stdout = data, stderr = diagnostics** — Parse stdout for results; stderr contains warnings/errors.

3. **Index freshness** — If searches seem stale, run `cass index --full` to rebuild.

4. **Cross-agent knowledge** — The real power is finding solutions from Codex when using Claude, or vice versa!

---

## Why Use CASS?

Instead of re-solving problems from scratch:
1. **Find** that you already solved it 2 weeks ago with another agent
2. **Copy** the exact pattern that worked
3. **Adapt** it to your current situation

This saves significant time, tokens, and ensures consistency across your projects.

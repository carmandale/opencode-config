---
description: Run multiple tasks in parallel with explicit task list
---

Explicit parallel execution - give it a list of tasks, it spawns agents for each.

## Usage

```
/parallel "task 1" "task 2" "task 3"
/parallel --file tasks.txt
/parallel --to-main "task 1" "task 2"  # Skip PR, push directly (use sparingly)
```

**Default behavior: Feature branch + PR.** All parallel work goes to a feature branch.

## Step 1: Parse Tasks

Extract tasks from $ARGUMENTS. Each quoted string is a separate task.

If `--file` provided, read tasks from file (one per line).

## Step 2: Register Coordinator & Create Branch

```
agent-mail: ensure_project(human_key="$PWD")
agent-mail: register_agent(project_key="$PWD", program="opencode", model="claude-sonnet-4", task_description="Parallel coordinator")
```

**Create feature branch (unless --to-main):**

```bash
git checkout -b parallel/<short-description>
git push -u origin HEAD
```

## Step 3: Analyze for Conflicts

Before spawning, check if tasks might conflict:

For each task, identify likely files:

- Use keywords to guess file patterns
- Check if multiple tasks target same files

If conflicts detected:

```markdown
⚠️ Potential conflict detected:

- Task 1 and Task 3 may both touch `src/auth/*`

Options:

1. Proceed anyway (agents will use file reservations)
2. Merge conflicting tasks
3. Run conflicting tasks sequentially
```

## Step 4: Create Beads (Optional)

For tracking, create a bead per task:

```bash
bd create "Parallel: <task 1 summary>" -p 2 --json
bd create "Parallel: <task 2 summary>" -p 2 --json
# etc
```

## Step 5: Spawn All Agents

**CRITICAL: All Task calls in ONE message.**

````
Task(
  subagent_type="general",
  description="Parallel #1: <task>",
  prompt="You are a parallel worker. Coordinator: <NAME>

## Setup
1. Register with Agent Mail
2. Checkout the parallel branch:
   ```bash
   git fetch origin
   git checkout parallel/<description>
   git pull
````

3. Reserve files you'll touch

## Task

<task description>

## On Complete

- Commit and push to parallel branch (NOT main)
- Release reservations
- Message coordinator with summary"
  )

Task(
subagent_type="general",
description="Parallel #2: <task>",
prompt="..."
)

# ... all tasks

```

## Step 6: Collect Results

Wait for agents, then check inbox:

```

agent-mail: fetch_inbox(project_key="$PWD", agent_name="<YOUR_NAME>", include_bodies=true)

````

## Step 7: Create PR

```bash
gh pr create --title "feat: <parallel task summary>" --body "$(cat <<'EOF'
## Summary
<what the parallel tasks accomplished>

## Tasks Completed
| # | Task | Status |
|---|------|--------|
| 1 | <task> | ✅ |
| 2 | <task> | ✅ |

## Files Changed
<aggregate list>
EOF
)"
```

## Step 8: Report

```markdown
## Parallel Execution Complete

### PR: #<number>
### Tasks: N total
| # | Task | Status | Summary |
|---|------|--------|---------|
| 1 | <task> | ✅ | <summary from agent> |
| 2 | <task> | ✅ | <summary> |
| 3 | <task> | ❌ | <error> |

### Failed Tasks
[Details on any failures]

### Next Steps
[If any tasks failed, suggest remediation]
```
# Fix multiple files
/parallel "fix type errors in auth.ts" "add tests for user.service.ts" "update README"

# Refactor pattern across codebase
/parallel "migrate useState to useQuery in Dashboard" "migrate useState to useQuery in Settings" "migrate useState to useQuery in Profile"

# Multi-repo (if worktrees exist)
/parallel "update deps in .worktrees/feature-a" "update deps in .worktrees/feature-b"
```
````

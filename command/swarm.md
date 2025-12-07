---
description: Decompose a task into beads and spawn parallel agents to execute
---

You are a swarm coordinator. Take a complex task, break it into beads, and unleash parallel agents.

## Usage

```
/swarm <task description or bead-id>
/swarm --to-main <task>  # Skip PR, push directly to main (use sparingly)
/swarm --no-sync <task>  # Skip mid-task context sync (for simple independent tasks)
```

**Default behavior: Feature branch + PR with context sync.** All swarm work goes to a feature branch, agents share context mid-task, and creates a PR for review.

## Step 1: Register as Coordinator

```
agent-mail: ensure_project(human_key="$PWD")
agent-mail: register_agent(project_key="$PWD", program="opencode", model="claude-sonnet-4", task_description="Swarm coordinator: <task>")
```

Remember your agent name - you'll give it to subagents.

## Step 2: Create Feature Branch

**CRITICAL: Never push directly to main.**

```bash
# Create branch from bead ID or task name
git checkout -b swarm/<bead-id>  # e.g., swarm/trt-buddy-d7d
# Or for ad-hoc tasks:
git checkout -b swarm/<short-description>  # e.g., swarm/contextual-checkins

git push -u origin HEAD
```

## Step 3: Understand the Task

If given a bead-id:

```bash
bd show $BEAD_ID --json
```

If given a description, analyze it to understand scope.

## Step 4: Decompose into Beads

Break the task into parallelizable units. Create beads for each:

```bash
# If parent bead exists, children auto-number (bd-xxx.1, bd-xxx.2, etc)
bd create "Subtask 1" -p 2 --parent $PARENT_ID --json
bd create "Subtask 2" -p 2 --parent $PARENT_ID --json
bd create "Subtask 3" -p 2 --parent $PARENT_ID --json

# Or create standalone if no parent
bd create "Subtask 1" -p 2 --json
```

**Decomposition rules:**

- Each bead should be completable by one agent
- Beads should be independent (parallelizable) where possible
- If there are dependencies, use `bd dep add BLOCKED BLOCKER`
- Aim for 3-7 beads per swarm (too many = coordination overhead)

## Step 5: Identify File Ownership

For each bead, identify which files it will touch:

```bash
# Use grep/glob to find relevant files per subtask
rg "pattern" src -l
```

**Conflict prevention:**

- No two agents should edit the same file
- If overlap exists, merge beads or sequence them
- Use Agent Mail file reservations

## Step 6: Spawn the Swarm

**CRITICAL: Spawn ALL agents in a SINGLE message with multiple Task calls.**

All agents share a common thread for context sync: `thread_id = <parent-bead-id>` (or generated swarm ID for ad-hoc tasks).

For each bead, spawn an agent:

````
Task(
  subagent_type="general",
  description="Swarm worker: <bead-title>",
  prompt="You are a swarm worker. Your coordinator is <COORDINATOR_NAME>.

## Swarm Context
- **Branch**: swarm/<bead-id> (NEVER push to main)
- **Repo**: $PWD
- **Parent bead**: <parent-bead-id>
- **Your bead**: <bead-id>
- **Swarm thread**: <parent-bead-id> (use as thread_id for all messages)

## Setup
1. Register with Agent Mail:
   - ensure_project(human_key='$PWD')
   - register_agent(project_key='$PWD', program='opencode', model='claude-sonnet-4', task_description='<bead-title>')

2. Checkout the swarm branch:
   ```bash
   git fetch origin
   git checkout swarm/<parent-bead-id>
   git pull
````

3. Reserve your files:
   - file_reservation_paths(project_key='$PWD', agent_name='YOUR_NAME', paths=[<files>], exclusive=true, reason='<bead-id>')

4. Mark bead in-progress:
   ```bash
   bd update <bead-id> --status in_progress
   ```

## Your Task

<bead description and specific instructions>

## Files You Own

<list of files this agent can edit>

## Mid-Task Context Sync (unless --no-sync)

At ~50% completion (before committing), share your progress with the swarm:

```
send_message(
  project_key='$PWD',
  sender_name='YOUR_NAME',
  to=['<COORDINATOR_NAME>'],
  subject='Progress: <bead-id>',
  body_md='## Status: In Progress (~50%)\n\n## Decisions Made\n- <key architectural choices>\n- <patterns you're using>\n\n## Discoveries\n- <anything other agents should know>\n- <shared types/interfaces created>\n\n## Blockers\n- <any issues that might affect others>\n\n## Files Touched So Far\n- <list>',
  thread_id='<parent-bead-id>'
)
```

Then **check for coordinator updates** before finalizing:

```
fetch_inbox(project_key='$PWD', agent_name='YOUR_NAME', since_ts='<your_start_time>')
```

If coordinator sent shared context or compatibility guidance, incorporate it before completing.

## Completion

1. Run type check: `pnpm exec tsc --noEmit`
2. Commit: `git add <your files> && git commit -m 'feat(<scope>): <bead-title>'`
3. Push to swarm branch: `git push origin swarm/<parent-bead-id>`
4. Close bead: `bd close <bead-id> --reason 'Done: <summary>'`
5. Release reservations: release_file_reservations(...)
6. Report to coordinator:
   ```
   send_message(
     project_key='$PWD',
     sender_name='YOUR_NAME',
     to=['<COORDINATOR_NAME>'],
     subject='Completed: <bead-id>',
     body_md='## Summary\n<what you did>\n\n## Key Decisions\n<architectural choices made>\n\n## Patterns Used\n<reusable patterns other agents should know>\n\n## Files Changed\n<list>',
     thread_id='<parent-bead-id>'
   )
   ```

Return a summary of what was completed."
)

```

## Step 7: Context Sync Checkpoint (unless --no-sync)

After spawning, actively monitor the swarm thread for mid-task updates:

```

# Monitor swarm thread for progress updates

search_messages(project_key="$PWD", query="Progress:", limit=20)
fetch_inbox(project_key="$PWD", agent_name="<YOUR_NAME>")

```

**When you receive progress updates:**

1. **Review decisions made** - Are agents making compatible choices?
2. **Check for pattern conflicts** - Different approaches to the same problem?
3. **Identify shared concerns** - Common blockers or discoveries?

**If you spot incompatibilities or need to broadcast shared context:**

```

send_message(
project_key='$PWD',
sender_name='<YOUR_NAME>',
to=['<AGENT_1>', '<AGENT_2>', ...], # Or specific agents
subject='Coordinator Update: Shared Context',
body_md='## Compatibility Guidance\n<resolve conflicting approaches>\n\n## Shared Patterns\n<patterns all agents should use>\n\n## Required Interfaces\n<types/interfaces for interop>\n\n## Blockers Resolved\n<solutions to reported blockers>',
thread_id='<parent-bead-id>',
importance='high'
)

```

**Skip this step if:**
- Using `--no-sync` flag
- Tasks are truly independent (no shared types, no integration points)
- Simple mechanical changes (find/replace, formatting)

## Step 8: Monitor and Collect Results

After context sync, continue monitoring for completion messages:
```

agent-mail: fetch_inbox(project_key="$PWD", agent_name="<YOUR_NAME>")

````

## Step 9: Coordinator Synthesis (unless --no-sync)

Before creating the PR, synthesize all agent outputs to catch conflicts:

1. **Review full swarm thread:**
   ```
   summarize_thread(project_key="$PWD", thread_id="<parent-bead-id>", include_examples=true)
   ```

2. **Check for incompatibilities:**
   - Conflicting type definitions
   - Different naming conventions used
   - Inconsistent patterns or approaches
   - Missing integration between components

3. **If conflicts found, spawn reconciliation agent:**
   ```
   Task(
     description="Reconciliation: Fix swarm conflicts",
     prompt="You are a reconciliation agent. The swarm has conflicts that need resolution.

   ## Conflicts Identified
   <list of specific conflicts>

   ## Thread Summary
   <output from summarize_thread>

   ## Your Task
   1. Register with Agent Mail
   2. Checkout swarm branch
   3. Fix the incompatibilities:
      - Unify type definitions
      - Resolve naming conflicts
      - Add missing integration code
   4. Commit: 'fix: reconcile swarm outputs'
   5. Report resolution to coordinator"
   )
   ```

4. **If no conflicts, proceed to PR creation.**

## Step 10: Create PR

Once all agents complete (and reconciliation if needed):

1. **Verify all beads closed:**
   ```bash
   bd list --parent $PARENT_ID --json  # All should be closed
   ```

2. **Close parent bead (if exists):**

   ```bash
   bd close $PARENT_ID --reason "Swarm complete: N subtasks done"
   ```

3. **Sync beads:**

   ```bash
   bd sync
   ```

4. **Create PR:**

   ```bash
   gh pr create --title "feat: <parent bead title>" --body "$(cat <<'EOF'
   ## Summary
   <1-3 bullet points from swarm results>

   ## Beads Completed
   - <bead-id>: <summary>
   - <bead-id>: <summary>

   ## Files Changed
   <aggregate list>

   ## Context Sync Notes
   <any compatibility issues resolved, shared patterns established>

   ## Testing
   - [ ] Type check passes
   - [ ] Tests pass (if applicable)
   EOF
   )"
   ```

5. **Report summary:**

   ```markdown
   ## Swarm Complete: <task>

   ### PR: #<number>

   ### Agents Spawned: N

   ### Beads Closed: N

   ### Context Sync
   - Mid-task updates received: N
   - Coordinator interventions: N
   - Reconciliation needed: yes/no

   ### Work Completed

   - [bead-id]: [summary]
   - [bead-id]: [summary]

   ### Files Changed

   - [aggregate list]
   ```

## Failure Handling

If an agent fails:

- Check its messages for error details
- The bead remains in-progress
- Manually investigate or re-spawn

If file conflicts occur:

- Agent Mail reservations should prevent this
- If it happens, one agent needs to wait

## Direct-to-Main Mode (--to-main)

Only use when explicitly requested. Skips branch/PR:

- Trivial fixes across many files
- Automated migrations with high confidence
- User explicitly says "push to main"

In this mode, workers push directly to main instead of the swarm branch.

## No-Sync Mode (--no-sync)

Skip mid-task context sharing when tasks are truly independent:

- Simple mechanical changes (find/replace, formatting, lint fixes)
- Tasks with zero integration points
- Completely separate feature areas with no shared types
- Time-sensitive work where sync overhead isn't worth it

In this mode:
- Agents skip the mid-task progress message
- Agents skip checking inbox before finalizing
- Coordinator skips Step 7 (Context Sync Checkpoint)
- Coordinator skips Step 9 (Synthesis) unless conflicts are obvious in completion messages

**Default is sync ON** - prefer sharing context. Use `--no-sync` deliberately.
````

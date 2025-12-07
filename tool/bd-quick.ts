import { tool } from "@opencode-ai/plugin"

/**
 * Quick beads operations - skip the verbose JSON parsing
 */

export const ready = tool({
  description: "Get the next ready bead (unblocked, highest priority)",
  args: {},
  async execute() {
    const result = await Bun.$`bd ready --json | jq -r '.[0] | "\(.id): \(.title) (p\(.priority))"'`.text()
    return result.trim() || "No ready beads"
  },
})

export const wip = tool({
  description: "List in-progress beads",
  args: {},
  async execute() {
    const result = await Bun.$`bd list --status in_progress --json | jq -r '.[] | "\(.id): \(.title)"'`.text()
    return result.trim() || "Nothing in progress"
  },
})

export const start = tool({
  description: "Mark a bead as in-progress",
  args: {
    id: tool.schema.string().describe("Bead ID (e.g., bd-a1b2)"),
  },
  async execute({ id }) {
    await Bun.$`bd update ${id} --status in_progress --json`
    return `Started: ${id}`
  },
})

export const done = tool({
  description: "Close a bead with reason",
  args: {
    id: tool.schema.string().describe("Bead ID"),
    reason: tool.schema.string().describe("Completion reason"),
  },
  async execute({ id, reason }) {
    await Bun.$`bd close ${id} --reason ${reason} --json`
    return `Closed: ${id}`
  },
})

export const create = tool({
  description: "Create a new bead quickly",
  args: {
    title: tool.schema.string().describe("Bead title"),
    type: tool.schema.enum(["bug", "feature", "task", "epic", "chore"]).optional().describe("Issue type (default: task)"),
    priority: tool.schema.number().min(0).max(3).optional().describe("Priority 0-3 (default: 2)"),
  },
  async execute({ title, type = "task", priority = 2 }) {
    const result = await Bun.$`bd create ${title} -t ${type} -p ${priority} --json | jq -r '.id'`.text()
    return `Created: ${result.trim()}`
  },
})

export const sync = tool({
  description: "Sync beads to git and push",
  args: {},
  async execute() {
    await Bun.$`bd sync`
    await Bun.$`git push`
    return "Beads synced and pushed"
  },
})

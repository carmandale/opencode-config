/**
 * Pre-Flight Gate Plugin
 *
 * Enforces THINK. ALIGN. ACT. with hard blocks before significant actions.
 *
 * Three checks:
 * 1. Active bead exists (bd list --status in_progress)
 * 2. Git is clean (cached per-bead)
 * 3. User aligned to current bead
 *
 * Hooks:
 * - event (chat.message): Detect alignment phrases
 * - tool.execute.before: Block significant actions until aligned
 */

import { execSync } from "node:child_process";

// Plugin types (inline to avoid module resolution issues)
interface PluginInput {
  project: unknown;
  directory: string;
  worktree: string;
  client: unknown;
  $: unknown;
}

interface Event {
  type: string;
  sessionID?: string;
  content?: string;
  [key: string]: unknown;
}

interface Hooks {
  event?: (input: { event: Event }) => Promise<void>;
  "tool.execute.before"?: (
    input: ToolExecuteInput,
    output: ToolExecuteBeforeOutput
  ) => Promise<void>;
}

type Plugin = (input: PluginInput) => Promise<Hooks>;

interface ToolExecuteInput {
  tool: string;
  sessionID: string;
  callID: string;
}

interface ToolExecuteBeforeOutput {
  args: Record<string, unknown>;
  abort?: (reason: string) => void;
}

// State persisted across module reloads
const GLOBAL_KEY = "__PREFLIGHT_GATE_STATE__";

interface PreflightState {
  alignedBeadId: string | null;
  alignedBeadTitle: string | null;
  bypassNext: boolean;
  gitCleanForBead: string | null; // bead ID we checked git for
}

function getState(): PreflightState {
  const existing = (globalThis as Record<string, unknown>)[
    GLOBAL_KEY
  ] as PreflightState | undefined;
  if (existing) return existing;

  const fresh: PreflightState = {
    alignedBeadId: null,
    alignedBeadTitle: null,
    bypassNext: false,
    gitCleanForBead: null,
  };
  (globalThis as Record<string, unknown>)[GLOBAL_KEY] = fresh;
  return fresh;
}

// Patterns
const AFFIRMATIVE =
  /^(yes|y|go ahead|proceed|do it|approved|lgtm|ship it|go for it|sounds good|confirmed|affirmative|that works|looks good)$/i;
const BYPASS = /^bypass$/i;

// Significant tools that require alignment
const SIGNIFICANT_TOOLS = new Set(["edit", "write", "multiedit", "task"]);

// Dangerous bash patterns
const DANGEROUS_BASH = ["git push", "git commit", "rm ", "rm -", "mv "];

// Check for active bead
interface BeadInfo {
  id: string;
  title: string;
}

function getActiveBead(cwd: string): BeadInfo | null {
  try {
    const result = execSync("bd list --status in_progress --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      cwd,
    });
    const beads = JSON.parse(result);
    if (Array.isArray(beads) && beads.length > 0) {
      return { id: beads[0].id, title: beads[0].title };
    }
  } catch {
    // bd not available or no beads
  }
  return null;
}

// Check git status
function isGitClean(cwd: string): { clean: boolean; details: string } {
  try {
    const result = execSync("git status --porcelain 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      cwd,
    });
    const lines = result.trim().split("\n").filter(Boolean);
    if (lines.length === 0) {
      return { clean: true, details: "" };
    }
    return { clean: false, details: `${lines.length} uncommitted file(s)` };
  } catch {
    // Not a git repo or git not available - allow
    return { clean: true, details: "" };
  }
}

// Check if bash command is dangerous
function isDangerousBash(command: string): boolean {
  const lower = command.toLowerCase();
  return DANGEROUS_BASH.some((pattern) => lower.includes(pattern));
}

// Format block message
function blockMessage(reason: string, hint?: string): string {
  let msg = `\n⛔ BLOCKED: ${reason}`;
  if (hint) {
    msg += `\n   ${hint}`;
  }
  return msg + "\n";
}

// Format aligned message
function alignedMessage(beadTitle: string, beadId: string): string {
  return `\n✅ ALIGNED: Ready to work on "${beadTitle}" (${beadId})\n`;
}

export const PreflightGatePlugin: Plugin = async ({ directory }) => {
  const cwd = directory;
  const state = getState();

  return {
    // Detect alignment and bypass phrases
    event: async ({ event }) => {
      if (event.type !== "chat.message") return;

      const content = ((event.content as string) || "").trim();

      // Check for bypass
      if (BYPASS.test(content)) {
        state.bypassNext = true;
        console.log("\n⚡ BYPASS: Next action will skip pre-flight checks\n");
        return;
      }

      // Check for affirmative
      if (AFFIRMATIVE.test(content)) {
        const bead = getActiveBead(cwd);

        if (!bead) {
          console.log(
            blockMessage(
              "Cannot align - no active bead",
              'Run: bd start <id> or bd create "title" -t task --status in_progress'
            )
          );
          return;
        }

        // Check git (and cache for this bead)
        if (state.gitCleanForBead !== bead.id) {
          const git = isGitClean(cwd);
          if (!git.clean) {
            console.log(
              blockMessage(
                `Cannot align - git is dirty (${git.details})`,
                "Run: git status, then commit or stash changes"
              )
            );
            return;
          }
          state.gitCleanForBead = bead.id;
        }

        // Align to this bead
        state.alignedBeadId = bead.id;
        state.alignedBeadTitle = bead.title;
        state.bypassNext = false;

        console.log(alignedMessage(bead.title, bead.id));
      }
    },

    // Gate significant tools
    "tool.execute.before": async (
      input: ToolExecuteInput,
      output: ToolExecuteBeforeOutput
    ) => {
      // Check if this is a significant action
      let isSignificant = SIGNIFICANT_TOOLS.has(input.tool);

      // Check bash commands for dangerous patterns
      if (input.tool === "bash") {
        const command = (output.args?.command as string) || "";
        isSignificant = isDangerousBash(command);
      }

      if (!isSignificant) return;

      // Check bypass flag (one-shot)
      if (state.bypassNext) {
        state.bypassNext = false;
        console.log("\n⚡ BYPASSING pre-flight checks (one-time)\n");
        return;
      }

      // Check 1: Active bead exists
      const bead = getActiveBead(cwd);
      if (!bead) {
        const msg = blockMessage(
          "No active bead",
          'Run: bd start <id> or bd create "title" -t task --status in_progress'
        );
        console.log(msg);
        if (output.abort) {
          output.abort("No active bead - start or create one first");
        }
        return;
      }

      // Check 2: Git is clean (cached per-bead)
      if (state.gitCleanForBead !== bead.id) {
        const git = isGitClean(cwd);
        if (!git.clean) {
          const msg = blockMessage(
            `Git is dirty (${git.details})`,
            "Run: git status, then commit or stash changes"
          );
          console.log(msg);
          if (output.abort) {
            output.abort("Git has uncommitted changes");
          }
          return;
        }
        state.gitCleanForBead = bead.id;
      }

      // Check 3: User aligned to THIS bead
      if (state.alignedBeadId !== bead.id) {
        const msg = blockMessage(
          "Not aligned to current bead",
          `Active: "${bead.title}" (${bead.id})\n   Say "yes" or "proceed" to align, or "bypass" to skip once`
        );
        console.log(msg);
        if (output.abort) {
          output.abort("Not aligned - say 'yes' to proceed or 'bypass' to skip");
        }
        return;
      }

      // All checks passed - proceed silently
    },
  };
};

export default PreflightGatePlugin;

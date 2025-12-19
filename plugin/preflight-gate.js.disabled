// plugin/preflight-gate.ts
import { execSync } from "node:child_process";
var GLOBAL_KEY = "__PREFLIGHT_GATE_STATE__";
function getState() {
  const existing = globalThis[GLOBAL_KEY];
  if (existing)
    return existing;
  const fresh = {
    alignedBeadId: null,
    alignedBeadTitle: null,
    bypassNext: false,
    gitCleanForBead: null
  };
  globalThis[GLOBAL_KEY] = fresh;
  return fresh;
}
var AFFIRMATIVE = /^(yes|y|go ahead|proceed|do it|approved|lgtm|ship it|go for it|sounds good|confirmed|affirmative|that works|looks good)$/i;
var BYPASS = /^bypass$/i;
var SIGNIFICANT_TOOLS = new Set(["edit", "write", "multiedit", "task"]);
var DANGEROUS_BASH = ["git push", "git commit", "rm ", "rm -", "mv "];
function getActiveBead(cwd) {
  try {
    const result = execSync("bd list --status in_progress --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      cwd
    });
    const beads = JSON.parse(result);
    if (Array.isArray(beads) && beads.length > 0) {
      return { id: beads[0].id, title: beads[0].title };
    }
  } catch {
  }
  return null;
}
function isGitClean(cwd) {
  try {
    const result = execSync("git status --porcelain 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      cwd
    });
    const lines = result.trim().split(`
`).filter(Boolean);
    if (lines.length === 0) {
      return { clean: true, details: "" };
    }
    return { clean: false, details: `${lines.length} uncommitted file(s)` };
  } catch {
    return { clean: true, details: "" };
  }
}
function isDangerousBash(command) {
  const lower = command.toLowerCase();
  return DANGEROUS_BASH.some((pattern) => lower.includes(pattern));
}
function blockMessage(reason, hint) {
  let msg = `
⛔ BLOCKED: ${reason}`;
  if (hint) {
    msg += `
   ${hint}`;
  }
  return msg + `
`;
}
function alignedMessage(beadTitle, beadId) {
  return `
✅ ALIGNED: Ready to work on "${beadTitle}" (${beadId})
`;
}
var PreflightGatePlugin = async ({ directory }) => {
  const cwd = directory;
  const state = getState();
  return {
    event: async ({ event }) => {
      if (event.type !== "chat.message")
        return;
      const content = (event.content || "").trim();
      if (BYPASS.test(content)) {
        state.bypassNext = true;
        console.log(`
⚡ BYPASS: Next action will skip pre-flight checks
`);
        return;
      }
      if (AFFIRMATIVE.test(content)) {
        const bead = getActiveBead(cwd);
        if (!bead) {
          console.log(blockMessage("Cannot align - no active bead", 'Run: bd start <id> or bd create "title" -t task --status in_progress'));
          return;
        }
        if (state.gitCleanForBead !== bead.id) {
          const git = isGitClean(cwd);
          if (!git.clean) {
            console.log(blockMessage(`Cannot align - git is dirty (${git.details})`, "Run: git status, then commit or stash changes"));
            return;
          }
          state.gitCleanForBead = bead.id;
        }
        state.alignedBeadId = bead.id;
        state.alignedBeadTitle = bead.title;
        state.bypassNext = false;
        console.log(alignedMessage(bead.title, bead.id));
      }
    },
    "tool.execute.before": async (input, output) => {
      let isSignificant = SIGNIFICANT_TOOLS.has(input.tool);
      if (input.tool === "bash") {
        const command = output.args?.command || "";
        isSignificant = isDangerousBash(command);
      }
      if (!isSignificant)
        return;
      if (state.bypassNext) {
        state.bypassNext = false;
        console.log(`
⚡ BYPASSING pre-flight checks (one-time)
`);
        return;
      }
      const bead = getActiveBead(cwd);
      if (!bead) {
        const msg = blockMessage("No active bead", 'Run: bd start <id> or bd create "title" -t task --status in_progress');
        console.log(msg);
        if (output.abort) {
          output.abort("No active bead - start or create one first");
        }
        return;
      }
      if (state.gitCleanForBead !== bead.id) {
        const git = isGitClean(cwd);
        if (!git.clean) {
          const msg = blockMessage(`Git is dirty (${git.details})`, "Run: git status, then commit or stash changes");
          console.log(msg);
          if (output.abort) {
            output.abort("Git has uncommitted changes");
          }
          return;
        }
        state.gitCleanForBead = bead.id;
      }
      if (state.alignedBeadId !== bead.id) {
        const msg = blockMessage("Not aligned to current bead", `Active: "${bead.title}" (${bead.id})
   Say "yes" or "proceed" to align, or "bypass" to skip once`);
        console.log(msg);
        if (output.abort) {
          output.abort("Not aligned - say 'yes' to proceed or 'bypass' to skip");
        }
        return;
      }
    }
  };
};
var preflight_gate_default = PreflightGatePlugin;
export {
  preflight_gate_default as default,
  PreflightGatePlugin
};

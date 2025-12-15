/**
 * Amnesia Prevention Plugin
 *
 * Automatically injects knowledge context at session start and provides
 * warnings/auto-detection during the session to prevent repeated mistakes.
 *
 * Hooks:
 * - session.created: Inject project-specific pitfalls + recent CASS sessions
 * - tool.execute.before: Warn when editing files with known error patterns
 * - tool.execute.after: Auto-detect errors and match to known patterns
 * - session.idle: Prompt for /retro to capture learnings
 */

import { readFile } from "node:fs/promises";
import { join, basename } from "node:path";
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
  [key: string]: unknown;
}

interface Hooks {
  event?: (input: { event: Event }) => Promise<void>;
  "tool.execute.before"?: (input: ToolExecuteInput, output: ToolExecuteBeforeOutput) => Promise<void>;
  "tool.execute.after"?: (input: ToolExecuteInput, output: ToolExecuteAfterOutput) => Promise<void>;
}

type Plugin = (input: PluginInput) => Promise<Hooks>;

// Hook input/output types
interface ToolExecuteInput {
  tool: string;
  sessionID: string;
  callID: string;
}

interface ToolExecuteBeforeOutput {
  args: Record<string, unknown>;
}

interface ToolExecuteAfterOutput {
  title: string;
  output: string;
  metadata?: Record<string, unknown>;
}

// Configuration
const CONFIG = {
  knowledgeDir: join(
    process.env.HOME ?? "",
    ".config/opencode/knowledge"
  ),
  cassLimit: 5,
  cassFields: "minimal",
  maxContextLines: 50,
  errorPatternFile: "error-patterns.md",
  preventionPatternFile: "prevention-patterns.md",
};

// Types
interface ErrorPattern {
  name: string;
  pattern: RegExp;
  fix: string;
  files?: string[];
}

interface CassResult {
  source_path: string;
  line_number: number;
  agent: string;
  snippet?: string;
}

// Parse error patterns from markdown
function parseErrorPatterns(content: string): ErrorPattern[] {
  const patterns: ErrorPattern[] = [];
  const sections = content.split(/^### /gm).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");
    const name = lines[0]?.trim() ?? "";

    // Extract pattern regex
    const patternMatch = section.match(/\*\*Pattern:\*\*\s*`([^`]+)`/);
    if (!patternMatch) continue;

    // Extract files if present
    const filesMatch = section.match(/\*\*Files:\*\*\s*`([^`]+)`/);
    const files = filesMatch
      ? filesMatch[1].split(",").map((f) => f.trim().replace(/`/g, ""))
      : undefined;

    // Extract fix (first code block or prevention text)
    const fixMatch = section.match(/\*\*Fixes:\*\*[\s\S]*?```[\w]*\n([\s\S]*?)```/);
    const preventionMatch = section.match(/\*\*Prevention:\*\*\s*(.+)/);
    const fix = fixMatch?.[1]?.trim() ?? preventionMatch?.[1]?.trim() ?? "";

    try {
      patterns.push({
        name,
        pattern: new RegExp(patternMatch[1], "i"),
        fix,
        files,
      });
    } catch {
      // Invalid regex, skip
    }
  }

  return patterns;
}

// Query CASS for relevant sessions
function queryCass(query: string, cwd: string): CassResult[] {
  try {
    const result = execSync(
      `cass search "${query}" --robot --limit ${CONFIG.cassLimit} --fields ${CONFIG.cassFields} --workspace "${cwd}"`,
      { encoding: "utf-8", timeout: 5000 }
    );
    return JSON.parse(result);
  } catch {
    return [];
  }
}

// Check CASS health
function isCassHealthy(): boolean {
  try {
    execSync("cass health", { encoding: "utf-8", timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// Extract project name from path
function getProjectName(cwd: string): string {
  return basename(cwd);
}

// Generate session start context
async function generateSessionContext(cwd: string): Promise<string> {
  const lines: string[] = [];
  const projectName = getProjectName(cwd);

  lines.push(`## Session Context for ${projectName}`);
  lines.push("");

  // Load error patterns
  try {
    const errorPatternsPath = join(CONFIG.knowledgeDir, CONFIG.errorPatternFile);
    const content = await readFile(errorPatternsPath, "utf-8");
    const patterns = parseErrorPatterns(content);

    if (patterns.length > 0) {
      lines.push("### Known Error Patterns");
      lines.push(`Found ${patterns.length} patterns in knowledge base.`);
      lines.push("Run `/debug` to check against these before investigating errors.");
      lines.push("");
    }
  } catch {
    // No error patterns file
  }

  // Load prevention patterns
  try {
    const preventionPath = join(CONFIG.knowledgeDir, CONFIG.preventionPatternFile);
    const content = await readFile(preventionPath, "utf-8");

    // Extract SwiftUI patterns for visionOS projects
    if (cwd.toLowerCase().includes("pfizer") || cwd.toLowerCase().includes("gmp") || cwd.toLowerCase().includes("orchestrator")) {
      const swiftUISection = content.match(/## SwiftUI Patterns[\s\S]*?(?=## |$)/);
      if (swiftUISection) {
        lines.push("### SwiftUI Prevention Patterns (Relevant to this project)");
        const patternNames = swiftUISection[0].match(/### ([^\n]+)/g);
        if (patternNames) {
          for (const name of patternNames.slice(0, 3)) {
            lines.push(`- ${name.replace("### ", "")}`);
          }
        }
        lines.push("");
      }
    }
  } catch {
    // No prevention patterns file
  }

  // Query CASS for recent sessions in this project
  if (isCassHealthy()) {
    const recentSessions = queryCass("error OR fix OR bug", cwd);
    if (recentSessions.length > 0) {
      lines.push("### Recent CASS Sessions");
      lines.push(`Found ${recentSessions.length} relevant sessions in this project.`);
      lines.push("Use `cass search \"<query>\" --robot` to find past solutions.");
      lines.push("");
    }
  }

  // Add reminder about /retro
  lines.push("### Session End Reminder");
  lines.push("Before ending, consider running `/retro` to capture learnings.");
  lines.push("");

  return lines.join("\n");
}

// Check if file has known error patterns
async function checkFilePatterns(filePath: string): Promise<string | null> {
  try {
    const errorPatternsPath = join(CONFIG.knowledgeDir, CONFIG.errorPatternFile);
    const content = await readFile(errorPatternsPath, "utf-8");
    const patterns = parseErrorPatterns(content);

    const fileName = basename(filePath);
    const matchingPatterns = patterns.filter(
      (p) => p.files?.some((f) => fileName.includes(f) || filePath.includes(f))
    );

    if (matchingPatterns.length > 0) {
      return `⚠️ **Pre-edit warning**: ${filePath} has ${matchingPatterns.length} known error pattern(s):\n${matchingPatterns.map((p) => `- ${p.name}`).join("\n")}`;
    }
  } catch {
    // No error patterns file
  }

  return null;
}

// Match error output against known patterns
async function matchErrorPatterns(output: string): Promise<string | null> {
  try {
    const errorPatternsPath = join(CONFIG.knowledgeDir, CONFIG.errorPatternFile);
    const content = await readFile(errorPatternsPath, "utf-8");
    const patterns = parseErrorPatterns(content);

    for (const pattern of patterns) {
      if (pattern.pattern.test(output)) {
        return `🔍 **Known pattern detected**: ${pattern.name}\n\n**Known fix:**\n\`\`\`\n${pattern.fix.slice(0, 500)}\n\`\`\``;
      }
    }
  } catch {
    // No error patterns file
  }

  return null;
}

// Track session state
let sessionHasErrors = false;
let sessionStartTime: Date | null = null;

export const AmnesiaPlugin: Plugin = async ({ directory }) => {
  const cwd = directory;

  return {
    // Inject context at session start
    event: async ({ event }) => {
      if (event.type === "session.created") {
        sessionStartTime = new Date();
        sessionHasErrors = false;

        const context = await generateSessionContext(cwd);
        if (context.trim()) {
          console.log("\n" + context);
        }
      }

      // Prompt for /retro at session end
      if (event.type === "session.idle") {
        if (sessionHasErrors && sessionStartTime) {
          const duration = Date.now() - sessionStartTime.getTime();
          // Only prompt if session was >5 minutes and had errors
          if (duration > 5 * 60 * 1000) {
            console.log("\n💡 **Session had errors** - consider running `/retro` to capture learnings.");
          }
        }
      }
    },

    // Warn before editing files with known patterns
    "tool.execute.before": async (input: ToolExecuteInput, output: ToolExecuteBeforeOutput) => {
      if (input.tool === "edit" || input.tool === "write") {
        const filePath = output.args?.filePath as string | undefined;
        if (filePath) {
          const warning = await checkFilePatterns(filePath);
          if (warning) {
            console.log("\n" + warning + "\n");
          }
        }
      }
    },

    // Auto-detect errors in tool output
    "tool.execute.after": async (input: ToolExecuteInput, output: ToolExecuteAfterOutput) => {
      // Check bash output for errors
      if (input.tool === "bash") {
        const toolOutput = output.output;
        if (toolOutput && (toolOutput.includes("error") || toolOutput.includes("Error") || toolOutput.includes("ERROR"))) {
          sessionHasErrors = true;

          const match = await matchErrorPatterns(toolOutput);
          if (match) {
            console.log("\n" + match + "\n");
          }
        }
      }

      // Check typecheck output
      if (input.tool === "typecheck") {
        const toolOutput = output.output;
        if (toolOutput && toolOutput.includes("error")) {
          sessionHasErrors = true;

          const match = await matchErrorPatterns(toolOutput);
          if (match) {
            console.log("\n" + match + "\n");
          }
        }
      }
    },
  };
};

export default AmnesiaPlugin;

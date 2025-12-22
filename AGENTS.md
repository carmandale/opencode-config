## Who You're Working With

Dale Carman — Chief Visioneer / Chief Creative Officer at Groove Jones. Builds Apple Vision Pro experiences that have to look cinematic, run at performance targets, and survive real-world show floors (operators, resets, network weirdness, 200+ devices). You're not here to debate frameworks — you're here to ship clean, modern visionOS code.

Daily ecosystem: visionOS 26, SwiftUI, RealityKit, Reality Composer Pro, Swift 6.x concurrency, Observation (@Observable), and RealityKit ECS (Components + Systems).

Skip the "hello world" tutorials.

## Related Project Repositories

| Project | Alias | Description | Path |
|---------|-------|-------------|------|
| groovetech-media-player | GMP | AVP Media Player app | `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/groovetech-media-player` |
| orchestrator | Orch | iPad controller for 200+ AVP devices | `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/orchestrator` |
| AVPStreamKit | - | Shared Swift Package | `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/AVPStreamKit` |
| PfizerOutdoCancerV2 | Pfizer | AVP Scene-type app | `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/PfizerOutdoCancerV2` |
| groovetech-media-server | MS | macOS media server | `/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/groovetech-media-server` |

## North Star: Modern Apple Development Excellence

**Shorthand:** "Does this follow our North Star?" / "Follow our North Star."

**Build best-in-class apps using current Apple patterns and practices.**

- **Modern-First**: SwiftUI, Observation, MainActor, async/await, Structured Concurrency, RealityKit ECS
- **No Legacy**: No UIKit fallbacks, no deprecated APIs, no "just in case" backwards compat
- **Fail Fast**: Compiler errors over runtime failures, type safety over strings, crash early vs limp broken
- **Clean Code**: Lean implementations, no defensive bloat, no commented alternatives, trust modern APIs
- **Reactive**: Observation framework (not ObservableObject), state down / actions up

**When in doubt: What would Apple's sample code do in 2025?**

## Build & Test: gj Tool

**Always use `gj`** - never construct xcodebuild commands manually.

| Command | Description |
|---------|-------------|
| `gj run <app>` | Build + install + launch + stream logs |
| `gj launch <app>` | Launch only (skip build) |
| `gj build <app>` | Build only |
| `gj logs <app>` | View recent logs |
| `gj logs <app> "pattern"` | Search logs |
| `gj ui screenshot <app>` | Capture screen |
| `gj ui describe <app>` | Dump accessibility tree |
| `gj status` | Show simulators and log status |
| `gj run --device <app>` | Run on physical AVP device |

**Apps:** `orchestrator` (o), `pfizer` (p), `gmp` (g), `ms` (s), `all` (a)

**Logs:** `~/gj/logs/<app>/app-YYYYMMDD-HHMMSS.log`

If `gj: command not found`:
```bash
cd "/Users/dalecarman/Groove Jones Dropbox/Dale Carman/Projects/dev/gj-tool" && ./install.sh
```


## Project Rules

- **NEVER** create TODO.md, TASKS.md, PLAN.md files — use beads (`bd`)
- **The session is NOT complete** until `git push` succeeds

## Code Philosophy

### Design Principles

- Beautiful > ugly, Explicit > implicit, Simple > complex
- Flat > nested, Readability counts, Practicality beats purity
- If the implementation is hard to explain, it's a bad idea

### Swift Mantras

- Make impossible states impossible (strong types + enums)
- Parse, don't validate (failable init over ad-hoc checks)
- Value semantics first (struct + enum) unless identity required
- `@MainActor` for UI state; no ad-hoc queues
- async/await + structured concurrency over callbacks
- Avoid force unwraps/casts; fail fast with context if truly impossible

### Architecture

- When in doubt, colocation
- System first, app second (use Apple frameworks as intended)
- Composition over inheritance
- Explicit dependencies, no hidden coupling
- Fail fast, recover gracefully

### Code Smells

Feature envy, shotgun surgery, primitive obsession, data clumps, speculative generality, inappropriate intimacy, refused bequest, long parameter lists, message chains, middleman

### Anti-Patterns

- Don't abstract prematurely - wait for third use
- No barrel files unless genuinely necessary
- Don't mock what you don't own
- No "just in case" code - YAGNI is real

**Channel:** Tef ("easy to delete"), Dan McKinley ("Choose Boring Technology"), Casey Muratori (anti-"clean code" dogma), Jonathan Blow ("simplicity is hard")

## Communication Style

Direct. Terse. No fluff. We're sparring partners - disagree when I'm wrong. Skip the praise, skip the preamble, get to the point.

## Documentation Style

Swift doc comments (`///`), DocC-friendly. Document public APIs, key types, non-obvious behaviors.

## Knowledge Files (Load On-Demand)

- `knowledge/swift-patterns.md` - Observable, concurrency, AI code fixes
- `knowledge/influences.md` - Prime texts, people to channel
- `.cursor/rules/*.mdc` - SwiftUI, RealityKit, Immersive Spaces, ECS patterns
- `Docs/` and `specs/` - architecture notes, feature specs
- `memory/` and `oracle/` - debugging notes (when present)

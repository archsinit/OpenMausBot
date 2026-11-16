# Concise first-request context — archsinit.3

Version: `0.1.161-archsinit.3`. Follows [feature retirement](lean-removal.md); no retained capability is retired in this phase.

## What changed

- Replaced repetitive app boilerplate with a compact, always-present authority/safety core. Consent, pending decisions, evidence, provenance, privacy and permission boundaries remain mandatory.
- Indexed optional workflow instructions in `server/agent-guides/INDEX.md` and seven topic files. Read the relevant file when needed rather than injecting every workflow into every message.
- File guides are used only for known native readers (Pi, Claude, Codex), a complete readable installed catalog, and an allowed reader. Guest/confined turns, fileless/unknown engines, missing files and scopes excluding readers retain inline instructions. No filesystem permission or sandbox root is widened.
- Preserved person-authored soul/rules/profile, factual memory, shared context, rosters, secret-name availability and active runtime facts. Deduplicated filesystem locations without changing their resolved targets; tenant-specific memory roots stay explicit when they differ.
- Pi initially exposes only `read`, `bash`, `edit`, `write`, `search_tools`. Discovery activates at most three permitted original tools per search; it does not execute actions. Questions, widgets, HTML, publishing, attachments and other retained tools load on demand with their original names, schemas, callbacks and approval checks. Older Pi APIs retain the eager fallback; unavailable scope enforcement fails closed.
- Shortened Pi's stock native prompt, while honoring operator `SYSTEM.md` and retaining project instructions, skills, extensions and appended policies. Compacted only recognized stock tool-description prose in the final provider declaration; validation and unknown overrides are unchanged.
- Bundled the complete guide catalog with the server/npm distribution.

## Complete provider-built request comparison

Counts are **Unicode characters**, not tokens. Count the complete serialized provider JSON, subtracting only the two human characters `Hi`: native instructions, tool declarations, injected application content, clock, escaping and request controls all remain included. Tool declarations are inside Codex `input[].tools`, not merely top-level `tools`.

Matched empty-history fixtures freeze IDs, cwd, time, model, profile and memory. Pi remains `1.5.2`, model `openai-codex/gpt-6.1-sol`, medium reasoning. The final staged package measures:

| Component | Before (.2) | After (.3 candidate) |
|---|---:|---:|
| Native Pi instructions | 2,431 | 289 |
| Tool declarations | 58,012 | 1,960 |
| Complete app prefix | 23,972 | 3,153 |
| Remaining JSON framing/escaping/controls | 563 | 450 |
| **Complete overhead excluding human text** | **84,978** | **5,852** |
| Initial tools | 52 | 5 |

**93.11% smaller**, 79,126 characters saved. Still 852 characters above an exact 5,000-character target; no claim that the whole request is below 5,000. The installed guide path differs from the staged path, so deployment receives a separate measurement below.

The user's actual pre-change fresh `Hi` was separately inspected: **85,654 characters / 53 tools**. That populated-user capture is not interchangeable with the matched fixture. No populated-user after request is claimed. Real authored facts, operator instructions and existing history can legitimately increase future requests.

### Measurement controls

Captures use synthetic credentials and loopback-only networking, and stop before provider transport. The capture observer must be loaded **after** application extensions so it sees the payload after their transformations. An early observer produced an invalid pre-compaction count; it is not the result above. The canonical .2 baseline was repeated with corrected ordering and stayed 84,978. Both final captures matched except the cache key. All eight guide files were actually read at the captured absolute path. Raw captures and user data remain private, outside Git.

## Verification

- **31 focused suites / 694 tests passed**, including direct and room dispatch, authored-context preservation, memory atomicity/concurrency, default/custom cwd resolution, reader/scope fallback, lazy tools, approval/scope checks, widgets, HTML/page frames, mail, mobile linking and retirement guards.
- Frontend, server and phone-protocol typechecks; changed-source lint; production server/UI builds; packaged server with no reachable `node_modules`; package artifact tests passed.
- Actual offline Pi 1.5.2 discovery/original-callback workflow exercised separately from capture-then-exit measurement.
- Independent source review found no confirmed P1/P2 issue.
- Broad Electron run: 2,109 passed, 17 failed, 7 skipped. All 17 failures reproduce on the unchanged pre-phase commit `4042858` (legacy automation/native-language expectations and missing Electron binary). Not represented as a green full suite. Full upstream suite, native OS installers and Docker image builds were not run.

## Deployment

Pending at this implementation commit. Deployment must back up the package and private workspace, verify idle state and package hash, install with readable permissions, check health/retirement guards, and repeat the matched final-provider capture at the installed path.

Existing chat/native history is not rewritten or deleted. Start a fresh context to measure the new initial loadout; continuing an older conversation can retain its historical prompt content.

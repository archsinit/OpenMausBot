# Maintaining the context-only fork

See [our fork-only change inventory](fork-changes.md) for the current customizations, repair status and source locations.

This branch keeps upstream features, settings, APIs, tool implementations, validation, approvals and permissions. The local changes concern instruction text and the declarations included in model context; they do not retire features or replace tool execution with a generic wrapper.

## Small integration seams

| Area | Isolated implementation | Integration |
| --- | --- | --- |
| Brief shared core and guide selection | `server/concise-context-core.ts`, `server/indexed-context.ts`, `server/indexed-docs-skill.ts`, `server/prompt-guides/` | One indexed-only pass in `buildSystemPrompt`; original default exports stay intact; exact known app-help routing table offloads only while its mounted source remains readable and matching |
| Compatibility recognition | `server/prompt-baselines.ts`, `server/prompt-stock-0166.ts`, exact reviewed aliases in `server/indexed-context.ts` | Frozen original/reviewed stock text and the 167 Full access label alias, separate from the brief model-facing guides |
| Memory/file guidance | `server/workspace-context.ts` | Guided options in file/memory prompts; preserve upstream memory rules/volatile notes split across preview, direct and room assembly |
| Screen selection and own-computer routing | `server/surface-context.ts` | One guided-only pass; unknown notes, selected targets and actual bot IDs remain |
| Collaboration procedures | Brief coordination guides and exact-paragraph compaction | Optional guided mode; original identity/authority facts and complete rosters remain |
| Pi tool declarations | `server/drivers/pi-tool-discovery.ts` | Register original MCP/ask-user definitions through a small adapter and finish discovery |
| Native tool-description prose | `server/drivers/pi-native-prose.ts` | Final provider-payload hook, exact recognized stock schemas only |
| Native Pi base instructions | `server/drivers/pi-system-prompt.ts` | Documented `--system-prompt` option with a verified app-owned asset, never cwd-sensitive prose; operator SYSTEM files take precedence |

Relative file references must resolve against the native cwd; memory may refer to Files.shared only when its actual private root matches that supplied file root. Preview and cross-tenant roots stay explicit.

The guide catalog is copied by the existing server bundler. npm, Electron and Docker already copy that server tree. No new user setting, permission grant or filesystem mount is introduced.

## Fail conservatively across updates

- Only recognized application prose is compacted. Changed/unknown paragraphs and trailing runtime facts pass through unchanged. Memory/file templates use fingerprints after replacing only their dynamic path JSON; an unknown template stays fully inline.
- Person-authored soul, rules, profile, factual memory, topic indexes, team/room data, secret-name availability, active assignments/events and authorization boundaries are not candidates for wholesale removal.
- Unchanged default/full prompts retain upstream byte fingerprints via internal recognition baselines. Intentional automation-policy changes allow Playwright/SSH/other methods in both full and indexed prompts; their targeted tests check the new policy. Frozen originals remain available solely for compatibility recognition. Model-facing guides are separately rewritten and checked for required steps, constraints and a 1,400-character-per-file budget. Do not blindly refresh either contract.
- Missing readers, excluded scopes, confinement or an incomplete/empty catalog keep the legacy inline fallback. A deployment must ship the complete brief catalog. Unknown/new upstream instructions can remain longer until reviewed; user-authored facts are never rewritten to fit a budget.
- Pi defers declarations only when the required extension APIs exist. Older APIs retain eager registration. Unsupported scope enforcement fails closed, not open. Other engines keep their original tool-exposure behavior.
- Unknown/custom native tool prose and schema constraints are preserved. Operator `SYSTEM.md`, project context, skills, extensions and appended policies are not disabled.

## Tool discovery contract

The initial standard Pi loadout is `read`, `bash`, `edit`, `write`, `search_tools` (a collision-safe name is used if needed). All original permitted tools remain registered. Discovery activates at most three matching original names/schemas per call and never executes their actions. Literal names take priority; repeated broad searches advance through inactive matches so ambiguous tools are not stranded. Exact case-sensitive names remain distinguishable. Original tool callbacks and approval/scope checks run when invoked.

Loaded declarations remain available during the run; using more capabilities can naturally grow context. Existing conversation history and actual authored content are not deleted to meet a size target.

## Updating upstream

Keep the [fork-only change inventory](fork-changes.md) and [fresh-request overhead ledger](prompt-overhead-history.md) current. Record intentional source/policy/repair differences separately from upstream features, and use measured candidate/installed results with component breakdowns and comparison limits.

1. Merge upstream into this branch, not the old feature-removal branch. Review conflicts only at the seams above; do not copy retirement fences or alter capability registries.
2. Run prompt/default-output fingerprints, brief-guide semantic/length contracts, unknown-prose passthrough, memory/fact preservation, reader fallback, scope, discovery completeness and approval tests. A larger fallback prompt is safer than silently dropping new upstream policy.
3. Review new upstream instructions before updating compatibility baselines, brief guides or fingerprints. Retain mandatory safety inline; offload procedures, not new permission rules or actual user data.
4. Build the server and run the isolated packaged smoke. Check both root and nested MCP entry points can load the complete resource tree without repository dependencies.
5. Qualify the installed Pi version offline: first declarations, original-schema activation/callback, ambiguous/exact discovery, custom/host approvals, and scope denial. Runtime SDK qualification currently covers Pi 1.5.2; mocks alone do not qualify a future SDK.
6. Capture the complete provider-built JSON in matched disposable fixtures using synthetic credentials and blocked provider transport. Place the exiting observer **last**, after payload-transform hooks. Count native instructions, nested tool declarations, app prefix and framing, not just the app preview. Keep raw payloads and user data outside Git.
7. Commit before deployment; back up package/workspace, verify idle state, health, history/model preservation and installed guide readability, then repeat the capture at the installed path.

## Release-specific repairs

The 0.1.167 and 0.1.169 trials include bounded upstream correctness/security repairs, separately described in their trial records. These are not context-size optimizations: retain runtime grant revocation, team-file ownership/quota enforcement, descriptor-bound image-file confinement and MCP-aware team-setup revision checks, with isolated regressions. Do not remove permission checks to match upstream byte-for-byte.

## Limits

This is a maintained fork, not a guarantee of conflict-free merges. Unknown SDKs or new upstream prose may deliberately fall back to a larger prompt until reviewed. Native OS installers, real browser/phone control and live provider quality are separate qualification gates; context tests must not exercise the user's live data to prove those workflows.

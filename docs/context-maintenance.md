# Maintaining the context-only fork

This branch keeps upstream features, settings, APIs, tool implementations, validation, approvals and permissions. The local changes concern instruction text and the declarations included in model context; they do not retire features or replace tool execution with a generic wrapper.

## Small integration seams

| Area | Isolated implementation | Integration |
| --- | --- | --- |
| Indexed static prose and compact safety/routing facts | `server/indexed-context.ts`, `server/prompt-guides/` | One indexed-only pass in `buildSystemPrompt`; original default exports stay intact |
| Memory/file guidance | `server/workspace-context.ts` | Optional guided mode in the two workspace prompt functions; five caller flags |
| Collaboration procedures | Existing coordination guides and exact-paragraph compaction | Optional guided mode; original identity/authority facts and complete rosters remain |
| Pi tool declarations | `server/drivers/pi-tool-discovery.ts` | Register original MCP/ask-user definitions through a small adapter and finish discovery |
| Native tool-description prose | `server/drivers/pi-native-prose.ts` | Final provider-payload hook, exact recognized stock schemas only |
| Native Pi base instructions | `server/drivers/pi-system-prompt.ts` | Documented `--system-prompt` option with a verified app-owned asset, never cwd-sensitive prose; operator SYSTEM files take precedence |

The guide catalog is copied by the existing server bundler. npm, Electron and Docker already copy that server tree. No new user setting, permission grant or filesystem mount is introduced.

## Fail conservatively across updates

- Only recognized application prose is compacted. Changed/unknown paragraphs and trailing runtime facts pass through unchanged. Memory/file templates use fingerprints after replacing only their dynamic path JSON; an unknown template stays fully inline.
- Person-authored soul, rules, profile, factual memory, topic indexes, team/room data, secret-name availability, active assignments/events and authorization boundaries are not candidates for wholesale removal.
- Default/full prompt outputs retain upstream byte fingerprints. Verbatim guide/constant parity tests flag stale resources; do not blindly refresh those expectations.
- Missing readers, excluded reader scopes and confined turns keep inline workflow instructions. Static guide files are required application assets; a deployment must ship the complete catalog.
- Pi defers declarations only when the required extension APIs exist. Older APIs retain eager registration. Unsupported scope enforcement fails closed, not open. Other engines keep their original tool-exposure behavior.
- Unknown/custom native tool prose and schema constraints are preserved. Operator `SYSTEM.md`, project context, skills, extensions and appended policies are not disabled.

## Tool discovery contract

The initial standard Pi loadout is `read`, `bash`, `edit`, `write`, `search_tools` (a collision-safe name is used if needed). All original permitted tools remain registered. Discovery activates at most three matching original names/schemas per call and never executes their actions. Literal names take priority; repeated broad searches advance through inactive matches so ambiguous tools are not stranded. Exact case-sensitive names remain distinguishable. Original tool callbacks and approval/scope checks run when invoked.

Loaded declarations remain available during the run; using more capabilities can naturally grow context. Existing conversation history and actual authored content are not deleted to meet a size target.

## Updating upstream

1. Merge upstream into this branch, not the old feature-removal branch. Review conflicts only at the seams above; do not copy retirement fences or alter capability registries.
2. Run prompt/default-output fingerprints, guide-resource parity, unknown-prose passthrough, memory/fact preservation, reader fallback, scope, discovery completeness and approval tests. A larger fallback prompt is safer than silently dropping new upstream policy.
3. Review new upstream instructions before updating guide resources or fingerprints. Retain mandatory safety inline; offload procedures, not new permission rules or actual user data.
4. Build the server and run the isolated packaged smoke. Check both root and nested MCP entry points can load the complete resource tree without repository dependencies.
5. Qualify the installed Pi version offline: first declarations, original-schema activation/callback, ambiguous/exact discovery, custom/host approvals, and scope denial. Runtime SDK qualification currently covers Pi 1.5.2; mocks alone do not qualify a future SDK.
6. Capture the complete provider-built JSON in matched disposable fixtures using synthetic credentials and blocked provider transport. Place the exiting observer **last**, after payload-transform hooks. Count native instructions, nested tool declarations, app prefix and framing, not just the app preview. Keep raw payloads and user data outside Git.
7. Commit before deployment; back up package/workspace, verify idle state, health, history/model preservation and installed guide readability, then repeat the capture at the installed path.

## Limits

This is a maintained fork, not a guarantee of conflict-free merges. Unknown SDKs or new upstream prose may deliberately fall back to a larger prompt until reviewed. Native OS installers, real browser/phone control and live provider quality are separate qualification gates; context tests must not exercise the user's live data to prove those workflows.

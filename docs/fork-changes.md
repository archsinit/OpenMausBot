# What our OpenMausBot fork changes

This is the fork-only inventory, not a list of upstream features or releases.

## Current reference

| Item | Recorded state |
| --- | --- |
| Integrated upstream base on the new trial branch | Published `v0.1.173` (`799ebcd900309a9836162fdb766899cb68604abb`); not yet deployed |
| Last verified production implementation | `5f610ddf49bbfb6dff39c4ed845a46c49c28ee60`, deployed 2026-11-18 |
| Active integration branch | `integration/upstream-0.1.173`, based on the complete 169 fork including its documentation; older trial branches retained |
| Fork main | `e60945380a66b3354c8d498aeb8005fce52788c0`; production-trial acceptance/merge pending |
| Production versus candidate | Production remains 0.1.169; 0.1.173 is integrated/tested/packaged on its separate branch, not installed |
| Ordinary fresh-request overhead | Production 169: **7,375 Unicode characters / five tools**. Candidate 173: **7,339 / five tools** at a path 36 characters shorter; normalized initial payload matches 169, not an installed-173 measurement |
| Split guide corpus | Candidate 173: **33 resources / 21,957 characters**, each below 1,400; production 169 corpus is 21,896. Neither corpus is loaded in full initially |

The inventory describes the 173 integration. The 169 versions of the context/tool/policy changes and S1–S7 are already deployed. Reviewed 173 check-back guidance, expanded docs routing and S8–S9 remain candidate-only until deployment. Documentation/test commits do not change the installed package.

## 1. Prompt and context optimizations

| ID | Fork change | What it does / preserves | Main source |
| --- | --- | --- | --- |
| C1 | Brief split instructions | Rewrites static workflow manuals into genuinely brief on-demand guides, rather than merely relocating long prose | `server/prompt-guides/`, `server/prompt-guides.ts` |
| C2 | Concise shared core | Consolidates repeated instructions; keeps authority, privacy, human-only questions, irreversible consent, evidence and pending/applied/failed-result rules inline | `server/concise-context-core.ts`, `server/indexed-context.ts` |
| C3 | Recognized-prose compaction only | Compacts reviewed stock persona/reply/manual/status text; unknown/new text passes through. Frozen original/reviewed text supports recognition and full fallbacks, not replacement of future policy | `server/prompt-baselines.ts`, `server/prompt-stock-0166.ts`, `server/indexed-context.ts` |
| C4 | Memory and file guidance | Offloads procedures while retaining factual memory, paths and per-turn write refusals; preserves stable rules versus volatile notes. Relative paths require the correct native cwd; Files.shared alias only when roots actually match | `server/workspace-context.ts`, `server/workspace.ts` |
| C5 | Coordination and runtime context | Shortens known procedures while retaining identities, complete rosters/IDs, authority, assignments, room context and scoped secret-name availability | `server/chief-of-staff.ts`, `server/peer-roster.ts`, `server/prompt-manual-parts.ts`, `server/index.ts` |
| C6 | Screen-selection, Data and deferred-work guidance | Moves static procedures to existing guides while retaining live selection/availability/permissions. In 173, shell/automations guides distinguish check_back by time from wait_until by condition, preserving origin/room/delegation restrictions | `server/surface-context.ts`, `server/surface.ts`, `server/prompt-guides/surface.md`, `server/prompt-guides/data.md` |
| C7 | Conditional app-help routing offload | Removes only exact reviewed routing sections when the mounted source matches, including the 173 multi-device row; points through workflow-details.md to the original table. Source SKILL.md, unknown additions and full fallback remain intact | `server/indexed-docs-skill.ts`, `server/prompt-guides/workflow-details.md` |
| C8 | Conservative indexed-mode gates | Uses guides only with a known permitted file reader and complete readable catalog. Unsupported/fileless/confined/excluded-reader cases retain full inline instructions; no new mounts or grants | `server/prompt-guide-access.ts`, `server/system-prompt.ts` |

User-authored soul, rules, profile, factual memory and active runtime facts are not deleted to meet a size budget. Current conditional app-help overhead is **12,730**, not the ordinary 7,375 baseline. Full-access wording distinguishes the access mode from an explicit user-authorized Chief MCP-server change; mode alone does not grant additional permissions.

## 2. Pi tool and native-instruction changes

| ID | Fork change | Contract | Main source |
| --- | --- | --- | --- |
| T1 | On-demand original tool declarations | Initially expose read, bash, edit, write and search_tools. Other permitted tools remain registered with their original schemas/callbacks; discovery does not perform their actions | `server/drivers/pi-tool-discovery.ts`, `server/drivers/pi-mcp-extension.ts` |
| T2 | Bounded, complete discovery | Activate at most three matches per search; preserve exact-name/suffix priority, collision handling, case-sensitive names and inactive-first progression for repeated broad queries | `server/drivers/pi-tool-discovery.ts` |
| T3 | Compact stock native declaration prose | Shorten only recognized stock descriptions/property prose in final provider JSON; preserve schema constraints, custom/unknown prose, callbacks and approvals | `server/drivers/pi-native-prose.ts` |
| T4 | Verified compact native base | Load an absolute app-owned pi-base.md; preserve operator SYSTEM precedence and project context/skills/extensions. Missing/changed asset falls back to stock Pi | `server/drivers/pi-system-prompt.ts`, `server/drivers/pi.ts`, `server/prompt-guides/pi-base.md` |

Older unsupported Pi APIs retain eager behavior; unsupported scope enforcement fails closed. Other engines do not acquire Pi's lazy-declaration behavior merely by using the split guides.

## 3. Intentional automation-policy differences

| ID | Fork change | Boundaries retained | Main source |
| --- | --- | --- | --- |
| P1 | Allow appropriate authorized methods | Permit Playwright, SSH, native/provider tools and shell-launched browsers; do not impose a blanket built-in-tool-only method rule. Keep intended target/account, real permission refusals and foreground-control consent | `server/system-prompt.ts`, `server/indexed-context.ts`, `server/prompt-guides/computer-*.md`, `server/prompt-guides/surface.md` |
| P2 | Use actual connectivity facts | Do not categorically declare Cloud-to-Tailscale/private-IP/SSH connections impossible. Check actual connectivity/authentication; app screen selection governs mounted app tools, not every independent authorized connection | `server/system-prompt.ts`, `server/surface-context.ts`, `server/surface.ts` |

These are model-guidance changes, not backend permission grants. They do not promise installed automation software or working network access, authorize a different target/account, permit searching unrelated keys or allow bypassing a refusal.

## 4. Scoped runtime correctness/security repairs

These repair reviewed upstream defects; they are not mechanisms for shrinking prompts and are not a claim of a complete security audit.

| ID | Repair | Origin | Main source / regression coverage |
| --- | --- | --- | --- |
| S1 | Re-resolve current vault grants/existence instead of caching old authorization; preserve readable reference labels | 167 integration | `server/bot-logins.ts`, `server/bot-logins.authorization.test.ts` |
| S2 | Preserve 1Password section/field identity through reads; reject missing/ambiguous matches instead of substituting a same-named field from another section | 167 integration | `server/onepassword.ts`, `server/onepassword.sections.test.ts` |
| S3 | Recheck current ownership immediately before committing overlapping team-file uploads | 167 integration | `server/host/team-files.ts`, `server/host/team-files.test.ts` |
| S4 | Recheck aggregate upload quota at commit and bound/release staging capacity | 167 integration | `server/host/team-files.ts`, `server/host/team-files.test.ts` |
| S5 | Bind image/markup containment, file type, size and bounded reads to the opened descriptor; retain valid in-root symlinks and VM paths | 169 integration | `server/image-edit-source.ts`, `server/routes/image-tools.ts`, `server/routes/image-tools-confinement.test.ts` |
| S6 | Include normalized MCP selection in full team-setup revisions, distinguishing unrestricted from no servers; invalidate stale Undo/deletion cards | 169 integration | `server/team-setup-requests.ts`, `server/team-setup-requests.test.ts` |
| S7 | Recheck surviving revision targets after awaited deletion and before synchronous Undo restoration, protecting newer MCP/Chief choices | 169 follow-up | `server/team-setup-requests.ts`, `server/team-setup-requests.test.ts` |
| S8 | Recheck pending check-back membership/liveness across awaited starts; Stop invalidates the old dispatch tick even across restart | 173 integration, candidate only | `server/host/check-backs.ts`, `server/host/check-backs.test.ts` |
| S9 | Register warm Codex sessions before synchronous capacity eviction, clear discarded timers and report admission truthfully | 173 integration, candidate only | `server/drivers/codex-warm.ts`, `server/drivers/codex-warm.test.ts` |

Limits: upload coordination is per instance/process, not a filesystem lock against arbitrary external writers. Non-Linux image-reader fallback is unqualified. Mixed-plan Undo is not atomic: completed deletions remain completed if later drift prevents restoration, while newer survivor state is preserved and the card is not marked undone.

## 5. Packaging, tests and operating process

| ID | Change | Where maintained |
| --- | --- | --- |
| O1 | Ship the guide catalog through the existing server bundle/npm/Electron/Docker resource tree; support root and nested entry paths | `scripts/bundle-server.mjs`, guide/resource tests and packaged smoke |
| O2 | Add focused contracts for brief guides, unknown-text/fact preservation, fallbacks, discovery, original callbacks, scopes/approvals and runtime repairs | New/updated server tests, notably `concise-*`, `indexed-*`, `prompt-*`, `workspace-context`, `surface-context` and Pi tests |
| O3 | Adapt existing prose-dependent fixtures to indexed guidance while retaining actual action/permission/result assertions | Existing direct/room/memory/shell/coordination and related fixture tests |
| O4 | Record reproducible complete-request overhead and release/trial receipts, keeping raw payloads and backups private | [Overhead ledger](prompt-overhead-history.md), [maintenance contract](context-maintenance.md), 166/167/169 trial records |
| O5 | Qualify actual Pi offline and deploy only after idle checks, backup and artifact pinning; verify health/history/models/guides afterward | Private audit/capture/deployment tools under `/home/piweb/workspace/projects/openmausbot-context-audit/`; not additional product features |

Verification details and limitations live in [the 169 production record](upstream-0.1.169-trial.md) and [173 integration record](upstream-0.1.173-trial.md). It distinguishes clean scoped runs, focused follow-ups, skipped/unqualified platforms and earlier failed attempts; it does not claim one clean full-project suite.

## Explicitly unchanged or excluded

- **No intentional upstream feature retirement in this maintained fork.** Browser/desktop/phone automation, Data/DuckDB, widgets, publishing, teams and supported helpers remain subject to their normal settings, runtime availability and permissions.
- Data was explicitly retained at the user's request. Its 700-character guide is on demand; an ordinary indexed turn retains a 47-character availability pointer. No databases were deleted.
- The old approximately 5.8k-character reduced-feature branch is separate and is not part of this implementation. Its removals must not be copied back.
- Native tool implementations and schemas are not replaced with generic execute-anything wrappers to obtain context savings. Listed safety repairs intentionally change the defective runtime checks.
- Upstream features such as Bitwarden, team files, image editing, voice and UI improvements are included because of upstream integration; they are not all custom fork inventions.
- Upstream 173's check_back, compaction and other released features are included in the new integration, not production yet. Candidate overhead is measured; installed-173 overhead is not. Reviewed shell/trigger/table variants are recognized exactly; frozen original baselines and unknown-prose passthrough remain intact.
- No automatic merge to main, branch deletion, unattended deployment or provider-call test is authorized by this inventory. Trial acceptance remains explicit.

## Keep this inventory current

For every update, compare against the exact integrated upstream tag, not unreleased main. Add or revise a stable ID above for each intentional fork delta; distinguish context changes, policy changes, runtime repairs, tests and process. When upstream absorbs a repair, record that evidence/status instead of silently forgetting it. Check implementation paths and regression coverage, preserve the maintenance contract, update the overhead ledger from actual isolated captures, and state deployment/main-merge status separately.

Reproduce the new source-level inventory with `git diff --name-status v0.1.173 integration/upstream-0.1.173`. The deployed 169 comparison remains `git diff --name-status v0.1.169 integration/upstream-0.1.169`. For future releases, change the baseline only after integration/review. Integration and documentation commits do not deploy themselves; the installed package remains implementation `5f610ddf4` until a separate authorized deployment.

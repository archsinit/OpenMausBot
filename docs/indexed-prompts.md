# Indexed workflow instructions

Branch `indexed-prompt-guides` starts from upstream `main` at `49968d7f12f381ac38f33d9318208c04c7afef17` (0.1.165). It does not include the feature removals from the other fork branch. Its context-only layer now includes on-demand tool declarations. Deployment details are recorded below.

## Scope

This is the upstream app with workflow prose moved into files, not a reduced-feature app. Browser/desktop/phone automation, Data, specialized helpers and all other upstream features remain. Tool execution handlers, schema constraints, approvals, settings and permissions are unchanged. Pi declarations now load on demand; only recognized stock tool prose is compacted. The stock Pi base is concise, while operator SYSTEM files and other authored resources retain precedence.

`server/prompt-guides/INDEX.md` maps workflows to twenty-nine catalog resources including the index: credentials/MCP configuration, threads, widgets, automations, skills, profiles, shared team memory, shell/VM commands, and Chief/peer/room coordination. The initial prompt points to the index; the model reads the matching instructions before starting that workflow. Safety policies, current routing facts and unknown/new upstream prose remain inline. See [the update-maintenance contract](context-maintenance.md) for the isolated integration seams and conservative fallbacks.

The guides retain upstream workflow prose; indexed mode keeps concise safety/routing summaries inline. Original inline exports and default function outputs are covered by byte-fingerprint tests. Mandatory policy excerpts stay inline, including secure credential entry, applied/pending/failed result handling, authority boundaries and waits. Authored soul, rules, profile, memory, section context, actual rosters/IDs, available secret names, room bulletins, requester constraints and active event/assignment instructions remain in context.

Indexed mode requires a known native file reader (Pi, Claude or Codex), a permitted reader in the bot's tool scope, and a complete readable catalog. Fileless/unknown engines, confined turns and excluded readers keep the original inline manuals. No permissions or sandbox mounts are added. Static manual files are application runtime assets, like source modules: they must ship with the server.

## Packaging

`build:server` copies the catalog to `dist-server/prompt-guides/`. Existing npm, Electron and Docker distribution rules copy that server tree. Resource lookup also handles bundled nested entry points such as `drivers/agents-proxy.js`.

## Complete context reduction

Matched empty-history `Hi` captures use the same Pi 1.5.2 model, frozen fixture state and provider serializer, with synthetic credentials and no provider transport. Counts are Unicode characters in complete provider JSON, excluding only the two human characters—not token estimates or app-preview sizes.

| Component | Previous indexed build | New installed build |
| --- | ---: | ---: |
| Native instructions | 2,431 | 371 |
| Tool declarations | 71,375 | 2,008 |
| App prefix | 20,626 | 10,467 |
| JSON framing/escaping/controls | 551 | 482 |
| **Complete initial overhead** | **94,983** | **13,328** |
| Initially declared tools | 64 | 5 |

**85.97% smaller**, without removing features. The actual populated prior live request had 98 initial tools and 25,753 reported input tokens; that is a different environment, not the denominator in this matched comparison. No populated-user after token count is claimed. Authored context, history and tools actually loaded during work can increase future requests.

The installed build was captured twice after all payload hooks, equal except cache key. Its staged candidate measured 13,331; the installed guide path is three characters shorter. The old approximately 5.8k-character reduced-feature build is not this branch.

## Current context-layer deployment

Committed and pushed context implementation `22ecfe63a`, followed by the verified app-owned native-base asset in `17aaef77c9d3de9aafb9788237d8da9591144ee4`, before deployment. Installed as upstream version `0.1.165`; `FORK-BUILD.json` records the branch, implementation and package SHA-256 `a737fb0f4d78e01865ed2b7a280ca91f3701a4c10b3dea6a38b77c51c808c5a2`.

Latest private package/workspace backup: `~/.local/state/openmausbot-fork-backups/20261116T194424Z/`; the pre-reduction full indexed installation is also backed up at `20261116T193523Z/`. Service and HTTPS health passed. All twenty-nine guide assets are readable. Existing message rows stayed **114 → 114** with prior conversation fields and model selections verified unchanged. No live test message or provider call was used to verify the update.

## Initial deployment

Installed on `maus-desktop` as `0.1.165`, implementation commit `e49a4a8e4`. Package SHA-256: `b8707c39b909b7643dd208e81db5c35b3e944ba12c3eb7f22c5a39ba945ad981`; installed `FORK-BUILD.json` identifies this branch.

The previous installation and private workspace were backed up under `~/.local/state/openmausbot-fork-backups/20261116T184149Z/`. Existing message rows stayed **107 → 107**, their stored conversation fields were verified unchanged, and model selections were preserved. Service health and HTTPS access passed; all thirteen guide resources are readable and the live preview includes the index. DuckDB, resvg and 1Password dependencies were installed; isolated in-memory SQL, PNG rendering and SDK import checks passed. The full upstream feature surface is restored. No test messages were sent to live conversations.

## Verification

- **26 suites / 532 tests passed**: verbatim prose/default-output fingerprints, scope/catalog fallbacks, live-fact preservation, direct/room dispatch with an isolated fake engine, original inline room combinations, widgets/pages, coordination, task cwd, tool selection and repository ratchets.
- Frontend/server TypeScript and changed-source lint passed; production server build passed.
- Packaged server smoke passed without reachable `node_modules`, including CLI, MCP, backup worker, desktop entry, container launcher and enterprise layer.
- A separate offline packaged nested `agents-proxy.js` process returned its 49-tool catalog; coordination, widgets, HTML, publishing and automations were checked. No tool was executed by that probe.
- Independent review identified an ambiguous-tool discovery issue; exact-name priority and advancing broad searches fixed it, with regression tests. Follow-up review reported no unresolved P1/P2 defect. Actual offline Pi 1.5.2 activation and denial receipts verify original callbacks and scope enforcement. No provider/model calls or live user-data mutations were used for verification.

Not claimed: full upstream suite, native OS installers, actual Docker image builds, or model-by-model behavioral qualification of guide selection. Schemas load on demand for Pi; other engines retain their original exposure behavior. This branch does **not** claim the other branch's approximately 5.8k-character full-request result.

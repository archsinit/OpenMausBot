# Indexed workflow instructions

Branch `indexed-prompt-guides` starts from upstream `main` at `49968d7f12f381ac38f33d9318208c04c7afef17` (0.1.165). It does not include the feature-removal or lazy-tool changes from the other fork branch. No live installation has been changed.

## Scope

This is the upstream app with workflow prose moved into files, not a reduced-feature app. Browser/desktop/phone automation, Data, specialized helpers and all other upstream features remain. Tool declarations, schemas, registrations, callbacks, approval mechanisms, settings and native Pi instructions are unchanged.

`server/prompt-guides/INDEX.md` maps workflows to thirteen catalog resources including the index: credentials/MCP configuration, threads, widgets, automations, skills, profiles, shared team memory, shell/VM commands, and Chief/peer/room coordination. The initial prompt points to the index; the model reads the matching instructions before starting that workflow. Other conditional surface/routing instructions remain inline.

The extracted prose is verbatim upstream text, not a rewrite. Original inline exports and default function outputs are covered by byte-fingerprint tests. Mandatory policy excerpts stay inline, including secure credential entry, applied/pending/failed result handling, authority boundaries and waits. Authored soul, rules, profile, memory, section context, actual rosters/IDs, available secret names, room bulletins, requester constraints and active event/assignment instructions remain in context.

Indexed mode requires a known native file reader (Pi, Claude or Codex), a permitted reader in the bot's tool scope, and a complete readable catalog. Fileless/unknown engines, confined turns and excluded readers keep the original inline manuals. No permissions or sandbox mounts are added. Static manual files are application runtime assets, like source modules: they must ship with the server.

## Packaging

`build:server` copies the catalog to `dist-server/prompt-guides/`. Existing npm, Electron and Docker distribution rules copy that server tree. Resource lookup also handles bundled nested entry points such as `drivers/agents-proxy.js`.

## Verification

- **17 suites / 329 tests passed**: verbatim prose/default-output fingerprints, scope/catalog fallbacks, live-fact preservation, direct/room dispatch with an isolated fake engine, original inline room combinations, widgets/pages, coordination, task cwd, tool selection and repository ratchets.
- Frontend/server TypeScript and changed-source lint passed; production server build passed.
- Packaged server smoke passed without reachable `node_modules`, including CLI, MCP, backup worker, desktop entry, container launcher and enterprise layer.
- A separate offline packaged nested `agents-proxy.js` process returned its 49-tool catalog; coordination, widgets, HTML, publishing and automations were checked. No tool was executed by that probe.
- Independent source review reported no confirmed P1/P2 defect. No provider/model calls or live user-data mutations were used for verification.

Not claimed: full upstream suite, native OS installers, actual Docker image builds, or model-by-model behavioral qualification of guide selection. Since schemas are unchanged and still sent normally, this branch does **not** reproduce the other branch's approximately 5.8k-character full-request result.

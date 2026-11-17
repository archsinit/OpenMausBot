# Indexed workflow instructions

Branch `indexed-prompt-guides` starts from upstream `main` at `49968d7f12f381ac38f33d9318208c04c7afef17` (0.1.165). It does not include the feature removals from the other fork branch. Its context-only layer now includes on-demand tool declarations. Deployment details are recorded below.

## Scope

This is the upstream app with concise workflow instructions in indexed files, not a reduced-feature app. Browser/desktop/phone automation, Data, specialized helpers and all other upstream features remain. Tool execution handlers, schema constraints, approvals, settings and permissions are unchanged. Pi declarations now load on demand; only recognized stock tool prose is compacted. The stock Pi base is concise, while operator SYSTEM files and other authored resources retain precedence.

`server/prompt-guides/INDEX.md` maps workflows to thirty-three catalog resources including the index: credentials/MCP configuration, threads, widgets, automations, skills, profiles, shared team memory, shell/VM commands, and Chief/peer/room coordination. The initial prompt points to the index; the model reads the matching instructions before starting that workflow. Safety policies, current routing facts and unknown/new upstream prose remain inline. See [the update-maintenance contract](context-maintenance.md) for the isolated integration seams and conservative fallbacks.

All model-facing guides are rewritten for brevity, not merely copied. They total 20,594 characters versus 58,638 before, including four additional topics; every guide and the index is below 1,400 characters. One concise core replaces repeated safeguards. Original prose lives separately in `prompt-baselines.ts` for compatibility recognition/default fallbacks, not in the rewritten guide files. Default outputs retain byte-fingerprint tests; unknown upstream text is preserved. Secure credential entry, applied/pending/failed results and authority boundaries remain mandatory. Authored soul, rules, profile, memory, section context, actual rosters/IDs, available secret names, room bulletins, requester constraints and active event/assignment instructions remain in context.

Indexed mode requires a known native file reader (Pi, Claude or Codex), a permitted reader in the bot's tool scope, and a complete readable catalog. Fileless/unknown engines, confined turns and excluded readers keep the original inline manuals. No permissions or sandbox mounts are added. Ship the complete guide catalog. Missing, empty or unreadable guides disable indexed mode rather than silently omitting instructions.

## Automation method choice

Agents may choose available, authorized Playwright, SSH, provider-native tools, shell-launched browsers or built-in tools. There is no mandatory built-in-browser or connected-app-first route. Screen-panel selection changes only OpenMausBot’s mounted tools; independent authorized connections to the intended target do not require an app target switch. Cloud network reachability is checked from actual results, not inferred from private/Tailscale addresses. Target/account identity, permission/refusal boundaries, credentials and verification safeguards still apply. This grants no new backend permissions and guarantees neither installed tooling nor connectivity.

## Packaging

`build:server` copies the catalog to `dist-server/prompt-guides/`. Existing npm, Electron and Docker distribution rules copy that server tree. Resource lookup also handles bundled nested entry points such as `drivers/agents-proxy.js`.

## Complete context reduction

Matched empty-history `Hi` captures use the same Pi 1.5.2 model, frozen fixture state and provider serializer, with synthetic credentials and no provider transport. Counts are Unicode characters in complete provider JSON, excluding only the two human characters—not token estimates or app-preview sizes.

| Component | Full indexed build | Deferred-tool build | Previous brief-guide build |
| --- | ---: | ---: | ---: |
| Native instructions | 2,431 | 371 | 371 |
| Tool declarations | 71,375 | 2,008 | 2,008 |
| App prefix | 20,626 | 10,467 | 4,476 |
| JSON framing/escaping/controls | 551 | 482 | 468 |
| **Complete initial overhead** | **94,983** | **13,328** | **7,323** |
| Initially declared tools | 64 | 5 | 5 |

That brief-guide build is **45.06% smaller** than the prior deferred-tool build and **92.29% smaller** than the full indexed baseline, without removing features. The actual populated prior live request had 98 initial tools and 25,753 reported input tokens; that is a different environment, not the denominator in this matched comparison. No populated-user after token count is claimed. Authored context, history and tools actually loaded during work can increase future requests.

Both final installed captures are equal except cache key. The staged candidate measured 7,317; its guide path is six characters shorter than the canonical installed path. The old approximately 5.8k-character reduced-feature build is not this branch.

## Current automation-policy deployment

Implementation `a08b7e030d44ceaad41e97357cbcc2b2f5318dee` is pushed to both `main` and `indexed-prompt-guides`. Its isolated packaged candidate passed 31 suites / 633 tests, typechecks, lint and packaged smoke. Complete fresh-request overhead measured **7,588 characters** with five initial tools at both staged and installed paths: native instructions 371, tool declarations 2,008, app prefix 4,741 and framing 468. Repeated installed payloads match except cache key. No live conversation/provider action was used for verification.

Deployment was initially deferred while an agent turn was active. After the person requested a restart, the idle check passed and implementation `a08b7e030` was installed. Package/workspace backup: `~/.local/state/openmausbot-fork-backups/20261117T060109Z/`. All **4,321 existing message rows** and model selections for **11 bots** were preserved. Service and HTTPS health passed; the 33 brief guides are readable. Package SHA-256: `c1465ecfa087da114c4b2103a07cc75c5e8de398a21a84e947c5fea87d7fdfa0`.

## Previous brief-guide deployment

Implementation `f05041c7a805c11126e3a5f2bb6c5eeefd4c1778` was committed and pushed before deployment. Installed as `0.1.165`; package SHA-256 `aea88b84a60c7b747e236dc6aa5b3df5614435013c1407dd285631189ddd6c77` is recorded with the implementation in `FORK-BUILD.json`.

Package and private workspace backup: `~/.local/state/openmausbot-fork-backups/20261116T235428Z/`. Service and HTTPS health passed; all 33 brief guide assets are readable. Message rows stayed **114 → 114**, with existing conversation fields and model selections unchanged. Repeated installed captures used only a disposable frozen fixture with blocked provider transport; no live conversation or provider call was used for verification.

A reviewer identified an ambiguous download-execution restriction; the core now explicitly preserves user-authorized tasks. Regression assertions cover it; follow-up review found no unresolved P1/P2 within the reviewed scope. Original SDK activation/callback/denial qualification is unchanged because this round modifies no tool adapter or execution code.

## Previous context-layer deployment

Committed and pushed context implementation `22ecfe63a`, followed by the verified app-owned native-base asset in `17aaef77c9d3de9aafb9788237d8da9591144ee4`, before deployment. Installed as upstream version `0.1.165`; `FORK-BUILD.json` records the branch, implementation and package SHA-256 `a737fb0f4d78e01865ed2b7a280ca91f3701a4c10b3dea6a38b77c51c808c5a2`.

Latest private package/workspace backup: `~/.local/state/openmausbot-fork-backups/20261116T194424Z/`; the pre-reduction full indexed installation is also backed up at `20261116T193523Z/`. Service and HTTPS health passed. All twenty-nine guide assets are readable. Existing message rows stayed **114 → 114** with prior conversation fields and model selections verified unchanged. No live test message or provider call was used to verify the update.

## Initial deployment

Installed on `maus-desktop` as `0.1.165`, implementation commit `e49a4a8e4`. Package SHA-256: `b8707c39b909b7643dd208e81db5c35b3e944ba12c3eb7f22c5a39ba945ad981`; installed `FORK-BUILD.json` identifies this branch.

The previous installation and private workspace were backed up under `~/.local/state/openmausbot-fork-backups/20261116T184149Z/`. Existing message rows stayed **107 → 107**, their stored conversation fields were verified unchanged, and model selections were preserved. Service health and HTTPS access passed; all thirteen guide resources are readable and the live preview includes the index. DuckDB, resvg and 1Password dependencies were installed; isolated in-memory SQL, PNG rendering and SDK import checks passed. The full upstream feature surface is restored. No test messages were sent to live conversations.

## Verification

- **31 suites / 633 tests passed**: legacy default-output fingerprints, concise-guide procedure contracts and length budgets, scope/catalog fallbacks, live-fact preservation, direct/room dispatch with an isolated fake engine, original inline room combinations, widgets/pages, coordination, task cwd, tool selection and repository ratchets.
- Frontend/server TypeScript and changed-source lint passed; production server build passed.
- Packaged server smoke passed without reachable `node_modules`, including CLI, MCP, backup worker, desktop entry, container launcher and enterprise layer.
- A separate offline packaged nested `agents-proxy.js` process returned its 49-tool catalog; coordination, widgets, HTML, publishing and automations were checked. No tool was executed by that probe.
- Independent review identified an ambiguous-tool discovery issue; exact-name priority and advancing broad searches fixed it, with regression tests. Follow-up review reported no unresolved P1/P2 defect. Actual offline Pi 1.5.2 activation and denial receipts verify original callbacks and scope enforcement. No provider/model calls or live user-data mutations were used for verification.

Not claimed: full upstream suite, native OS installers, actual Docker image builds, or model-by-model behavioral qualification of guide selection. Schemas load on demand for Pi; other engines retain their original exposure behavior. This branch does **not** claim the other branch's approximately 5.8k-character full-request result.

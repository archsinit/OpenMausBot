# Upstream 0.1.169 production trial

Branch: `integration/upstream-0.1.169`, based on prepared 167 integration `8d0a9ffac11f575ccebb6f95cba49f87021f0e76`, not main. Fork main remains `e60945380a66b3354c8d498aeb8005fce52788c0`. Do not merge to main or delete the new branch before explicit trial acceptance.

## Published release and retained features

GitHub latest stable: https://github.com/milind-soni/OpenMausBot/releases/tag/v0.1.169, published `2026-11-17T20:13:30Z`, neither draft nor prerelease. Tag/release target: `b832de78c43c8d76e92d6f50fb1a8d33be364480`. npm confirms 0.1.169. Unreleased main (0.1.170 when checked) is not integrated. The 167→169 release delta spans 162 files; dependencies/lockfile are unchanged.

Retains 167 integration and all four scoped safety fixes, plus released voice/dictation, image/GIF/markup editing, usage rings, Chief MCP selection, bundled app-help skill, room steering, late tool-result and MCP/runtime fixes. No feature-retirement work is copied.

## Prompt changes and split instructions

Base upstream system/workspace/surface builders did not change. Model context did change through the conditional `openmausbot-docs` skill, tool declarations (still lazy originals), runtime message/authority handling and expanded announcement-nudge detection; nudge text itself is unchanged.

Only the exact reviewed 22-line docs page-routing section is removed from indexed inline skill text. Existing `workflow-details.md` points to the mounted skill's authoritative page table before choosing a page. The source SKILL.md, all other app procedures/safety rules, triggering behavior and full/unindexed fallback remain intact. Unknown/new prose passes through; mismatched/unreadable/missing/unrooted sources or changed tables retain full inline instructions. Existing reader/scope/confinement/catalog gates still control indexed mode. No new grants or mounts.

At checkout path, rendered docs instructions shrink 6,550→5,257 characters (1,293 fewer including pointers); this is a source-text comparison, not complete provider JSON. Four existing brief guides clarify authorized Chief MCP-list changes and app-help routing. Inline core says Full access never expands permissions **by itself**, distinguishing access mode from an explicit authorized Chief request. Irreversible-action consent, privacy, authority and pending/applied/failed safeguards remain inline. Independent Playwright/SSH alternatives and authored/runtime facts are retained. All 33 guides remain nonempty and below 1,400 characters.

## Scoped upstream safety repairs

Review reproduced two released upstream defects in synthetic fixtures, repaired before deployment:

- Image edit's containment check followed by separate stat/read allowed file/ancestor substitution to read outside authorized roots. The repair binds containment, regular-file checks, size and bounded reading to one opened file descriptor, covering image and markup; valid in-root symlinks and VM paths remain supported. Linux regressions pass; the non-Linux inode-check fallback is not qualified.
- Team-setup full revisions omitted MCP selection, allowing stale Undo to restore broader MCP availability after a newer restriction. Full revisions now include normalized MCP selection, retaining unrestricted-vs-empty distinction and invalidating stale deletion cards too. Follow-up review identified an asynchronous mixed create/update Undo gap, now repaired by revalidating all surviving restore targets after awaited deletion and immediately before synchronous restoration. Deferred-deletion regressions cover MCP and Chief-scope drift plus ordinary Undo. Undo is not atomic: already completed deletions stay deleted if later drift prevents restoration; newer survivor choices remain untouched and the card is not marked undone.

These runtime fixes are not context-size optimizations. Verification receipts follow final review.

## Verification

Changed renderer run: 8 suites / 152 passed. Changed nonrenderer run: 41 suites / 1,632 passed, 1 failed, 1 skipped (Windows-only). The failure was a stale inline-shell assertion, reproduced separately; updated test accepts either canonical inline shell instructions or the indexed guide/index and retains actual timeout callbacks, macOS search hint and BASH_MAX_TIMEOUT_MS assertions. Post-adaptation hooks plus preserved-167 security regression run: 7 suites / 86 passed. These are overlapping runs, not a single clean full-suite claim.

Prompt-critical isolated run: 13 suites / 165 passed, 1 skipped; real direct/room guide dispatch: 3 passed. Actual Pi 1.5.2 offline qualification: 48 changed-schema cases plus six profiles, checking first-five tools, original activated schemas/descriptions/callback forwarding, zero-action discovery, scope denial and custom/host approval gates. Loopback-only network namespace, synthetic credentials/providers/callbacks, no real actions/provider calls or live conversations.

After the initial runtime repairs, all configured typechecks, whole-project lint, frontend/server production builds and isolated packaged smoke passed. A stable scoped run passed **43 suites / 1,669 tests, 1 skipped**; independent defensive patch review ran 36 passing tests and accepted the image reader, while identifying the additional Undo gap above. Image repair-focused run: 96 passed; initial MCP revision-focused run: 250 passed. These runs overlap and are not summed as unique tests. After the last Undo follow-up, four relevant suites passed 253 tests; independent follow-up review passed 19 selected tests (69 unselected cases skipped by the focused filter) and found no remaining concrete blocker. That last small patch postdates the 43-suite run; do not claim a full-project or single final full-suite run. Release typechecks, whole-project lint, server rebuild and isolated packaged smoke were rerun successfully after it; frontend source/assets were unchanged from the passing frontend build. Frontend retains the upstream large-chunk advisory. Native extension qualification requires unchanged SHA-256 `4e298423a31c299b60e2fcadb9cbc94ac04a2eb70868afdc1219d12c47a79586`.

## Complete provider-request measurements

Matched frozen empty-history fixture, Pi 1.5.2, synthetic credentials, blocked provider transport, observer last after payload transforms; exclude only human text. Counts are Unicode characters of complete provider-built JSON, not tokens/preview estimates. Raw payloads stay outside Git.

Fresh installed 166 baseline captured twice: **7,365**, five initial tools; native 371, declarations 2,008, app prefix 4,518, framing 468. App-help fixture also measured 7,365 on 166, which does not have the new docs skill.

Final release 169 candidate at `/tmp/omb169-candidate` (`release169-candidate-1/2`): Hi twice **7,339**, five tools; native 371, declarations 2,008, prefix 4,492, framing 468. Its path is 36 characters shorter than installation; do not claim a smaller installed baseline from this path difference. The core clarification adds 10 characters relative to 166 at matched paths.

Historical capture harness does not set OMB_SKILLS_DIR when launching index.js directly; ordinary Hi is unaffected, but app-help captures require the private `fresh-capture-skills.py` variant to reproduce CLI-selected packaged skill availability. The variant sets only OMB_SKILLS_DIR to the candidate/installed skills directory. With it, Hi is unchanged and candidate app-help captured twice at **12,622**, five tools. This conditional growth is the new feature, not generic startup overhead. Earlier non-skill-enabled app-help captures are not evidence for mounted skill behavior.

A disposable same-path-length no-offload control was built by adding an early return only to the bundled indexedDocsSkill function in an unpacked copy (never a deployment artifact). Two full app-help control requests measured **13,967** versus **12,622** for the split candidate: **1,345 fewer complete JSON characters** at matched path lengths. Control receipt: `/tmp/omb169-full-docs/CONTROL-ONLY.json` on maus-desktop. This is a controlled fork-build comparison, not stock-upstream token usage. All paired payloads match after removing only prompt_cache_key; explicit bundled-skill availability leaves the historical Hi baseline unchanged.

Final release npm archive SHA-256: `7905c9696960ef474615f8bcbb0d9f0253db6f654d332f75454135d645bc053e`. Manifest validates all 33 brief guides, original docs skill and runtime TS Pi extension; extension hash matches the actual-Pi qualification. Final candidate ordinary/app-help pairs reproduce the sizes above and are equal except cache key. Prior 167 safety source files remain unchanged. Independent prompt and runtime patch reviews found no remaining material blocker in their bounded scopes. Real provider/account behavior, non-Linux file fallback, real bubblewrap/native installers and actual Docker image builds are not qualified here.

Installed captures and deployment receipts pending. Keep main unchanged throughout trial; never overwrite later conversations with an older rollback snapshot.

# Upstream 0.1.173 integration trial

Status: merged and pushed as implementation `e9c9ed1d63b973c60d889937161157c77472d641` on `integration/upstream-0.1.173`. Build/package and focused verification passed; broad backend qualification is partial with an unresolved harness/lifecycle stall. **Integration branch only; not deployed or merged to main.** Production remains the verified 0.1.169 fork. Main and older trial branches must not be merged/deleted without acceptance.

## Published release and branch

- Published stable: [v0.1.173](https://github.com/milind-soni/OpenMausBot/releases/tag/v0.1.173), `799ebcd900309a9836162fdb766899cb68604abb`, published `2026-11-19T23:52:37Z`, not draft/prerelease.
- npm confirms 0.1.173; integrity `sha512-xHqRsTe/plzwGJLGZjOs8OBgremis6KBQZ2/N243zv/L7mwEFSiSx/guHfmdXPYW/1BNelFBAIniB9Q4NF/REg==`.
- New branch: `integration/upstream-0.1.173`, starting from fork `e8dba9febd2729d2aff2e261c238812a7f88e3bc` (169 trial plus documentation), not main. Fork main remains e60945380.
- Only the published stable tag is integrated, not unreleased upstream main. The 169→173 delta spans 733 files, including 275 changed test files. Runtime dependency specifications and lockfile are unchanged.

## Released features retained

Includes the cumulative 170/171/173 changes: check_back reminders, 12,000-character handoff briefs and unambiguous teammate ID prefixes, warmer engine lifecycle and shutdown/steering changes, earlier Claude/Codex compaction, lighter/faster thread rendering, Inbox improvements, provider/reasoning/accounting additions, Data import fixes, Cloud recovery and routine wake retries, self-hosting/Doctor improvements and other released fixes. These are upstream features, not invented fork customizations.

The fork still retains its original feature surface, including Data/DuckDB, browser/desktop/phone tools and supported helpers, subject to normal runtime availability/settings/permissions. The retired-feature branch is not used.

## Fork integration and instruction review

Two textual conflicts: `server/index.ts` and `server/peer-roster.test.ts`. Preserve both sides' functionality: guided/context assembly, source/authority and complete rosters, native cwd, vault-reference and team-file facts, plus upstream lifecycle/compaction/check-back integration and teammate ID-prefix tests.

Reviewed stock shell and automation guidance now distinguish check_back (a later time in one's own chat) from wait_until (a condition). Those procedures belong in existing shell.md/automations.md guides, with exact reviewed recognizers and original full fallback. Preserve constraints on own-chat versus delegated/routine/outside turns; no blind fingerprint refresh or removal of unknown instructions. The app-help routing table adds multi-device.md; recognize only that exact reviewed table while preserving source validation and unknown additions.

All inventory C/T/P/S/O requirements remain gates: brief guides <1,400 characters, lazy original Pi callbacks/schemas, five initial tools, no discovery actions, authored/runtime facts and inline safeguards, SYSTEM precedence, canonical fallbacks, and authorized Playwright/SSH alternatives.

## Existing safety repairs

All six runtime implementation files carrying the seven S1–S7 repairs are byte-identical to the prepared 169 fork after automatic integration: vault grant checks, section-aware 1Password, upload ownership/quota, descriptor-bound images and MCP-aware/post-await Undo revisions. Retained regression run in a loopback-only network namespace: **six suites / 156 passed**. No new runtime repair is claimed merely from preserving those files.

## Additional released-runtime repairs

Bounded review reproduced and repaired two new upstream lifecycle defects without retiring their features:

- S8: a due-record snapshot could start a later check-back even after cancellation/deletion while an earlier start awaited. Dispatch now rechecks live membership/liveness before each start, and Stop invalidates the outstanding tick even through restart. Five deterministic deferred regressions failed before the fix; host/time/route suites passed 35 tests afterward.
- S9: Codex warm-session capacity eviction could run synchronously before the session was registered, leaving a child retained at zero capacity. Register first, clear discarded timers and return false when admission was immediately revoked. Warm/session-idle suites passed 27 tests; fake-Codex warm integration passed 17 selected tests (314 unrelated cases filtered out).

Independent final review found both issues resolved and no new concrete blocker in its bounded scope; four focused suites / 48 tests passed. Earlier review's 13-suite / 251-test run overlaps this work; a later driver/context batch timed out without a result and is not claimed as passed. Review confirmed all inventory C/T/P seams and S1–S7 survive the merge.

## Verification receipts

- Final stable critical run after all source edits: **19 suites / 299 passed, 1 skipped**, with DAC-override capabilities dropped in the isolated namespace. Covers all retained safety repairs, new lifecycle patches, guides/fallbacks, original-tool discovery and source ratchets. Log: `/tmp/omb173-verification/final-stable-critical.log`.
- Earlier critical fork run: 28 suites / 1,025 passed, 1 skipped. Direct/room guide fixtures: 3 passed. Memory/cache/scope/safety dispatch: 12 passed. An earlier six-fixture dispatch attempt timed out; it is not a successful run. Those focused runs overlap other coverage.
- Changed renderer: 79 files / 1,441 passed, no failures/skips; i18n and contrast regression gates passed. Existing Midnight accent/danger contrast gaps remain, and some upstream incomplete mocks emit non-failing React diagnostics. Visual/platform behavior is not qualified.
- Release pnpm typecheck and whole-project lint passed, frontend build and server build passed, isolated packaged smoke passed after the runtime repairs. A test-only Promise.withResolvers use initially exceeded the configured TypeScript library; it was replaced with an ordinary deferred Promise helper without changing the compiler target or runtime behavior. Frontend retains the upstream large-chunk advisory.
- Changed Electron Node tests: **239 passed**, no failures/skips.
- Broad changed-backend run: **31 files completed; 2,871 passed, 1 failed, 25 skipped**. The failure was a checkpoint unreadable-file assertion under namespace-root DAC override; a focused run dropping DAC-override capabilities passed, with no product source change. Keep the original red result in the record.
- The root batch stopped progressing after ollama.test.ts; it was stopped after inspection. The exact next-file pause remains unidentified: **unresolved harness/lifecycle stall**, not demonstrated product failure and not a clean run. Source moved during the broad attempt.
- Stable-source critical continuation logged **49 passes / 24 skips** before its budget expired; focused handoff/setup-steps checks passed one each. All22 changed E2E files are accounted for across those logs: **143 assertions passed / 24 skipped**. Counts overlap the broad attempt and must not be summed as unique coverage. **129/196 changed non-renderer files remain unqualified** by that agent; separate fork/safety/renderer checks above provide additional scoped evidence, not a substitute full-suite claim.
- Backend evidence: `/tmp/omb173-verification/backend-report.md`. These results support reviewing/pushing an integration branch, **not automatic main promotion or production replacement**. Investigate the stall and complete missing coverage before production sign-off.

### Actual Pi schema/callback qualification

Pi 1.5.2 qualification exercised 54/54 transport cases: first five tools, bounded activation, zero discovery actions/approvals, original synthetic callback forwarding, scope denial and custom/host approval allow/deny gates. The 12,000-character brief and eight-character ID prefix reached the synthetic callback intact. Final packaged TS extension hash is unchanged: `4e298423a31c299b60e2fcadb9cbc94ac04a2eb70868afdc1219d12c47a79586`.

Strict schema equality passed for check_back, coordinate_bots and list_threads but flagged two empty properties maps in trigger. This is **not** an SDK rewrite or a new lazy-discovery change: the inherited OpenMausBot toTypebox converter adds these maps identically in upstream169, upstream173 and our fork. A direct Pi registration baseline preserves raw schema; three baseline runs accepted five valid and rejected seven invalid calls each. Forty-two validator comparisons confirmed equivalence for the two specific object nodes; a separately allowlisted two-path comparison rejects actual constraint-drop mutations. The original strict mismatch remains recorded: do not claim every provider schema is byte-identical. This is an explicit carried-forward representation exception, with no fork constraint/callback change.

Upstream advertised schemas also omit some full internal maximum/minimum bounds before our adapter receives them; those omissions are upstream behavior, not a fork change. Original callback routing and server-side schema validation remain in place; the explicitly listed safety/lifecycle repairs are separate. Receipts: `/tmp/omb-up173-schema-pi-KvRpWx/RECEIPT.md`, `/tmp/omb-up173-trigger-baseline-ZvWqzb/RECEIPT.md`.

All test turns must use disposable homes/data and fake engines or synthetic loopback providers inside network isolation. Never use live conversations or real provider calls as tests. Reading production identity/health is not permission to mutate live chats or deploy this branch.

## Complete request baseline

Fresh current-production (169) captures repeated twice using fresh-capture-skills.py: ordinary Hi **7,375** characters overhead / five tools (native371, declarations2008, prefix4528, framing468), and app-help **12,730** / five tools (native371, declarations2008, prefix9787, framing564). Capture labels: `pre173-production-1/2`, `pre173-help-production-1/2` under private remote audit directory. Synthetic frozen fixture, blocked provider transport, last observer; raw payloads outside Git. These are complete Unicode JSON character counts excluding only human text, not tokens/previews.

Final packaged candidate `/tmp/omb173-candidate` measured twice: ordinary Hi **7,339** / five tools (native371, declarations2008, prefix4492, framing468), app-help **12,622** / five tools (native371, declarations2008, prefix9679, framing564). Paired payloads match after excluding only prompt_cache_key. Each candidate payload is also structurally equal to its 169 candidate counterpart after changing only that cache key and `/tmp/omb169-candidate`→`/tmp/omb173-candidate` paths. Thus the reviewed offloads prevent initial-context growth despite new upstream tools/instructions.

Candidate guide/skill root is 36 characters shorter than production; no smaller installed overhead is claimed. At the current production path the normal expectation is unchanged 7,375, but that is normalization, not an installed-173 capture. Labels: `update173-candidate-1/2`, `update173-help-candidate-1/2`. All33guides remain <1400chars, maximum1380; candidate corpus21,957 (61 more than169), read on demand.

The compiled package corresponds to implementation `e9c9ed1d6`; subsequent branch changes only record these integration results. All C/T/P inventory entries and S1–S7 remain carried forward; S8/S9 are explicitly documented candidate-only repairs. Main is unchanged and all prior trial branches are retained.

Final archive SHA-256: `afa24d8327b3f81ed11c8a4d84379b5a6b40cf1e022225c000a3f407833c6591`, local `/tmp/omb173-verification/openmausbot-0.1.173.tgz`, remote `/tmp/omb-context-audit-20260527/upstream173.tgz`. Manifest verification confirms version173, all33guide resources, original docs skill and the runtime TS Pi entry. The package is built and captured; broader backend qualification limitations are recorded separately. Production remains 169; this request merges upstream into the fork, not an authorization to skip trial acceptance, overwrite main or deploy automatically.

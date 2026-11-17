# Upstream 0.1.166 production trial

Branch: `integration/upstream-0.1.166`. Base fork: `6ddb2b2fe`. Upstream stable tag: `v0.1.166` (`2d2d3c5171371a4b641e68d010a488a5d0affb0d`). This trial does not merge into or replace fork `main`; merge/delete the trial branch only after normal-use acceptance.

## Integration

Resolved six prompt integration conflicts, retaining upstream's stable/volatile split, per-turn memory-write refusal, conditional Data guide, standalone skill rules, collaboration and all upstream features. Retained the fork's brief indexed guides, original-tool discovery, authored/runtime facts and authorized Playwright/SSH alternatives. New stock prose recognizers and memory-template fingerprints are exact reviewed variants; unknown text stays inline. Original recognition snapshots remain unchanged.

No changes to tool implementations, permission checks or schema validation were made to obtain smaller prompts. Upstream changes to those areas are retained as released. Stable 166 includes changed defaults: parallel room jobs, configured-backup-only limit handling and public-by-default Netlify publishing unless private publishing is requested.

## Matched complete request measurements

Same frozen disposable empty-history `Hi` fixture, Pi 1.5.2/model, synthetic credentials and blocked external provider transport. Observer runs after all payload hooks. Counts are Unicode characters in the complete provider-built JSON, excluding only the two human characters; not tokens or preview estimates.

| Component | Production before: 0.1.165 | Staged 0.1.166 |
| --- | ---: | ---: |
| Native instructions | 371 | 371 |
| Tool declarations | 2,008 | 2,008 |
| App prefix | 4,741 | 4,975 |
| Framing | 468 | 468 |
| **Complete initial overhead** | **7,588** | **7,822** |
| Initial tools | 5 | 5 |

Both before captures match; both final staged captures have matching sizes. Installed-path measurements will be recorded after deployment. The remaining increase is app context, including upstream's separately cached selection rules/turn permission and Data availability; schemas have not grown. This is not an additive improvement over upstream's advertised stock-prompt reduction: the fork already offloads most of that prose.

## Verification

- Clean critical run: **31 suites / 643 tests passed**.
- Separate renderer run: **30 suites / 338 tests passed**.
- Broader 196-file attempt: 3,955 tests passed initially, with 12 failures and framework loader errors. Stale full-prose fixture assertions were adapted without weakening actual action/permission checks. All 12 failed cases passed in focused/isolated reruns; renderer files omitted by the mixed-run loader errors passed separately. Transport/startup flakes and the original loader-error cause remain unexplained. This is **not** a claim of a single clean full-suite run.
- Whole-project lint, all configured typechecks, production frontend/server builds and packaged server smoke passed.
- Actual Pi 1.5.2/Node 24.22.2 offline qualification passed in a loopback-only network namespace: discovery performs no action, one original synthetic callback executes, scope denial executes zero actions. Runtime extension SHA-256: `4e298423a31c299b60e2fcadb9cbc94ac04a2eb70868afdc1219d12c47a79586`, matching the final package.
- Independent bounded static review found no confirmed P1/P2 integration defect. New snapshot module is included in the commit/package.

Raw payloads, fixture receipts and private workspace backups are outside Git. No live conversations/provider calls were used for verification. Signed native installers, real browser/phone actions, actual Docker image builds and populated-user after token counts are not claimed.

## Trial and rollback

Before install: push the trial branch, verify idle turns, back up the installed package and complete private workspace, then compare existing message fields and model selections after restart. Keep main unchanged throughout the trial.

Accept after normal workloads show healthy service, preserved history/models, working discovery and no new permission/routing regressions. Do not automatically merge/delete the branch on a timer. For a later rollback, back up the current workspace first: never overwrite newer trial conversations with the pre-trial snapshot. Assess data compatibility before reverting the package; the immediate deployment-failure rollback is separate.

# Fresh-request overhead history

## Definition and comparison rules

“Fresh overhead” is the Unicode character count of the complete provider-built JSON, minus the actual human message. It includes native instructions, nested initial tool declarations, application instructions/runtime prefix, and JSON framing/escaping. It is not a token count, app-preview size, or the total context of a populated conversation. Facts, authored instructions, history, selected skills and tools discovered during work can increase real requests.

Measurements use disposable empty-history fixtures, synthetic credentials and blocked provider transport. Modern captures observe last, after all application payload transforms. Paired captures match after removing only prompt_cache_key. The earliest fixture used a 105-character human message; later captures use Hi. Their human text is excluded; the later Hi fixture confirmed the phase-2 overhead unchanged. Application versions/features and absolute guide paths still matter, so this is a historical ledger, not one controlled prose-only benchmark across all builds.

## Earliest baseline and reduced-feature experiment

These are earlier experimental builds, not the current full-feature branch. The original installed version was 0.1.161.

| Stage | Complete overhead | Initial tools | Evidence and interpretation |
| --- | ---: | ---: | --- |
| Original installed app, first controlled fresh fixture | 101,412 | 64 | fresh-before and fresh-verify; original repeat matched |
| First experimental update | 94,475 | 60 | fresh-after and phase2-before |
| Second experimental update / archsinit.2 | 84,978 | 52 | phase2-after; observer-last baseline confirmed |
| archsinit.3 intermediate candidate | 7,295 | 5 | corrected observer-last candidate, staged path |
| archsinit.3 final candidate | 5,852 | 5 | final staged capture |
| archsinit.3 installed | 5,843 | 5 | repeated installed captures; staged 5,852 is a separate artifact/path, not an installed result |

A separate historical populated-request replay measured **107,329** characters / 75 tools before the changes, and an actual-user Hi replay later measured **85,654** / 53 tools. These are not controlled fresh-fixture baselines and must not be substituted into the table above.

An early archsinit.3 result of **8,331** was withdrawn: its observer ran before the final compaction hook. The corrected intermediate result is **7,295**. Neither number is the final installed 5,843 result.

Sources outside Git: `/home/piweb/workspace/projects/openmausbot-context-audit/FRESH-BASELINE.md`, `REMOTE-BASELINE.md`, `PHASE3-BASELINE.md`, `PHASE3-ARCHSINIT3.md`, `PHASE3-FINAL.md`, and the corresponding aggregate JSON summaries. Raw payloads remain private.

## Full-feature fork and upstream integrations

The maintained full-feature fork begins at upstream 0.1.165 (`49968d7f1`). Features removed in the earlier experiment were restored. Therefore the return to 94,983 is not a comparable optimization regression against the reduced-feature 5,843 build.

| Stage | Installed overhead | Change within this track | Initial tools | Main change |
| --- | ---: | ---: | ---: | --- |
| 0.1.165 initial indexed full-feature build (`e49a4a8e4`) | 94,983 | baseline | 64 | Index pointers alone; many declarations and inline rules still eager |
| 0.1.165 deferred-tool/context layer (`22ecfe63a`, `17aaef77c`) | 13,328 | −81,655 | 5 | Original schemas/callbacks registered but activated on demand; compact native/context layer |
| 0.1.165 brief guides (`f05041c7a`) | 7,323 | −6,005 | 5 | Rewrite the actual guide files briefly and consolidate shared context |
| 0.1.165 authorized automation policy (`a08b7e030`) | 7,588 | +265 | 5 | Explicitly preserve authorized Playwright/SSH/other methods and real routing/refusal boundaries |
| Initial 0.1.166 integration (`d3fcb8c48`) | 7,824 | +236 | 5 | Retain upstream memory/selection/Data changes |
| 0.1.166 procedural guide offload (`a92659ae8`) | 7,365 | −459 | 5 | Move selection/Data procedures to existing guides; keep live permissions/status inline |
| Prepared 0.1.167 integration (`49fc691e9`) | not deployed | no installed result | 5 staged | Preserve full features and add four scoped safety repairs; candidate was 7,329 at a path 36 characters shorter than production |
| 0.1.169 production trial (`5f610ddf4`) | **7,375** | **+10 vs installed 166** | **5** | Full-access mode-vs-user-authorization clarification; conditional app-help routing offload; runtime safety repairs |

The 167 candidate's **7,329** is consistent with 7,365 at the longer production path, but that is path normalization, not an installed-167 measurement. The 169 candidate measured **7,339**, and its actual installed result is **7,375**. Do not count those candidate-to-installed path differences as code regressions or savings.

No standalone fork overhead measurements are recorded here for 0.1.162–164 or 0.1.168. They must not be inferred. The current installation jumped directly from the optimized 166 build to the integrated 169 trial, carrying the prepared 167 changes.

Evidence: [indexed prompt history](indexed-prompts.md), [166 trial](upstream-0.1.166-trial.md), [167 preparation](upstream-0.1.167-trial.md), [169 deployed trial](upstream-0.1.169-trial.md).

## Component attribution for the full-feature track

| Component | Initial indexed 165 | Deferred-tool 165 | Brief-guide 165 | Automation-policy 165 | Initial 166 | Optimized 166 | Installed 169 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Native instructions | 2,431 | 371 | 371 | 371 | 371 | 371 | 371 |
| Tool declarations | 71,375 | 2,008 | 2,008 | 2,008 | 2,008 | 2,008 | 2,008 |
| App prefix | 20,626 | 10,467 | 4,476 | 4,741 | 4,977 | 4,518 | 4,528 |
| Framing/escaping | 551 | 482 | 468 | 468 | 468 | 468 | 468 |
| **Total** | **94,983** | **13,328** | **7,323** | **7,588** | **7,824** | **7,365** | **7,375** |

The largest savings came from not sending every tool declaration initially. Original permitted tools/callbacks remain available through discovery; five initial declarations do not mean only five total capabilities. Splitting instructions alone was not sufficient.

The initial brief-guide build's guide corpus was 19,789 characters. Current 169 corpus is **21,896 across 33 files**, each below 1,400 characters. This entire corpus is not added to every fresh request; matching guides are read on demand.

## Conditional app-help context in 169

The new app-help skill is selected only for matching requests. Its installed fresh fixture overhead is **12,730**, still five tools, versus ordinary Hi at **7,375**. This is additional selected-task context, not a universal startup increase.

The exact reviewed page-routing section is replaced with guide/source pointers; the full source skill and unknown-instruction fallbacks remain. At matched staged path lengths, a disposable no-offload fork control measured **13,967** and the split candidate **12,622**, saving **1,345 complete JSON characters**. This is a controlled fork comparison, not stock-upstream token usage. The control predates the final Undo-only patch, which changes no prompt assembly; final candidate captures reproduced the split sizes. Skill-aware captures set OMB_SKILLS_DIR to reproduce packaged CLI behavior.

## Bottom line

- Earliest controlled fresh baseline → current: **101,412 → 7,375**, down **94,037 characters (92.73%)** across the recorded evolution.
- Initial full-feature indexed fork → current: **94,983 → 7,375**, down **87,608 (92.24%)**.
- First full-feature brief-guide build → current: **7,323 → 7,375**, net **+52 (0.71%)**, while retaining later features, explicit authorized automation and safeguards.
- Current production: **0.1.169**, implementation `5f610ddf4`; deployed after idle/backup checks. Main is not merged pending trial acceptance.

## Keep tracking future updates

For each release, record the exact upstream tag, fork implementation, deployment status, archive hash, fixture/human text/model/settings/Pi version, actual package path, skill selection, repeated capture labels and equality check. Capture complete before/after installed provider JSON under isolated synthetic fixtures, excluding only human text. Record native/declarations/app/framing separately, explain retained inline policy and offloaded procedures, and distinguish candidates, controls, historical replays and installed builds. Never refresh an old row silently or replace measurements with estimates. Do not use real provider calls or live conversations as tests.

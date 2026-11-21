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
| 0.1.173 integration candidate | not deployed | no installed result; matched-path candidate unchanged from 169 | 5 staged | New check_back, delegation/compaction and other released features retained; exact new static procedures offloaded into existing guides |

The 167 candidate's **7,329** is consistent with 7,365 at the longer production path, but that is path normalization, not an installed-167 measurement. The 169 candidate measured **7,339**, and its actual installed result is **7,375**. Do not count those candidate-to-installed path differences as code regressions or savings.

No standalone fork overhead measurements are recorded here for 0.1.162–164 or 0.1.168. They must not be inferred. The current installation jumped directly from the optimized 166 build to the integrated 169 trial, carrying the prepared 167 changes.

The 173 candidate measured **7,339** for ordinary Hi and **12,622** for mounted app help, each repeated twice with equal payloads except cache key. Those payloads also exactly match the corresponding 169 candidate after replacing only the equal-length package root and dropping cache key. Its normal installed-path expectation remains 7,375, but 173 is not deployed, so no installed-173 number is claimed. This preserves initial-context size while adding exact reviewed check_back and multi-device routing procedures to on-demand guides.

Evidence: [indexed prompt history](indexed-prompts.md), [166 trial](upstream-0.1.166-trial.md), [167 preparation](upstream-0.1.167-trial.md), [169 deployed trial](upstream-0.1.169-trial.md), [173 integration](upstream-0.1.173-trial.md).

## Component attribution for the full-feature track

| Component | Initial indexed 165 | Deferred-tool 165 | Brief-guide 165 | Automation-policy 165 | Initial 166 | Optimized 166 | Installed 169 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Native instructions | 2,431 | 371 | 371 | 371 | 371 | 371 | 371 |
| Tool declarations | 71,375 | 2,008 | 2,008 | 2,008 | 2,008 | 2,008 | 2,008 |
| App prefix | 20,626 | 10,467 | 4,476 | 4,741 | 4,977 | 4,518 | 4,528 |
| Framing/escaping | 551 | 482 | 468 | 468 | 468 | 468 | 468 |
| **Total** | **94,983** | **13,328** | **7,323** | **7,588** | **7,824** | **7,365** | **7,375** |

The largest savings came from not sending every tool declaration initially. Original permitted tools/callbacks remain available through discovery; five initial declarations do not mean only five total capabilities. Splitting instructions alone was not sufficient.

The initial brief-guide build's guide corpus was 19,789 characters. Installed 169 corpus is **21,896 across 33 files**. Candidate 173 corpus is **21,957 across the same 33 files** (+61), still each below 1,400 characters. These entire corpora are not added to every fresh request; matching guides are read on demand.

## Conditional app-help context in 169

The new app-help skill is selected only for matching requests. Its installed fresh fixture overhead is **12,730**, still five tools, versus ordinary Hi at **7,375**. This is additional selected-task context, not a universal startup increase.

The exact reviewed page-routing section is replaced with guide/source pointers; the full source skill and unknown-instruction fallbacks remain. At matched staged path lengths, a disposable no-offload fork control measured **13,967** and the split candidate **12,622**, saving **1,345 complete JSON characters**. This is a controlled fork comparison, not stock-upstream token usage. The control predates the final Undo-only patch, which changes no prompt assembly; final candidate captures reproduced the split sizes. Skill-aware captures set OMB_SKILLS_DIR to reproduce packaged CLI behavior.

## Earlier “5k” build versus current production

5,000 was the target, not an achieved installed result. The earlier installed reduced-feature build was **5,843** (`0.1.161-archsinit.3`, `f98f8902b`); current full-feature production is **7,375** (`0.1.169`, `5f610ddf4`). Difference: **1,532 characters (+26.22%)**. These are recorded empty-history provider-payload measurements, not live-user context or token counts.

| Component | Earlier installed | Current installed | Difference |
| --- | ---: | ---: | ---: |
| Native Pi instructions | 289 | 371 | +82 |
| Initial tool declarations | 1,960 | 2,008 | +48 |
| Application prefix | 3,144 | 4,528 | +1,384 |
| JSON framing/escaping | 450 | 468 | +18 |
| **Complete overhead** | **5,843** | **7,375** | **+1,532** |
| Initially declared tools | 5 | 5 | unchanged |

Both initially declare read, bash, edit, write and search_tools. Comparing the saved synthetic payloads shows that all four native tool declaration sizes are identical; the entire +48 declaration difference is search_tools. Its description now names browser/computer/Data/phone capabilities and explains repeated broad discovery. Discovery still executes no actions and loads original permitted callbacks/schemas.

The native +82 is the added sentence: “Use listed tools directly; find and load unlisted task tools before calling them.” The old native base was an inline constant; the current base is a verified app-owned pi-base.md asset with operator SYSTEM precedence retained.

Most growth is in the app prefix, not tool schemas. The explicit authority/safety core grew **683→1,092 characters (+409)**, covering ask-first behavior, access mode versus authorization, intended sign-in accounts, human-only secrets/questions, pending/applied outcomes and recall. The earlier core already retained consent, privacy and authority safeguards; this is expanded explicit coverage, not an assertion that the old build lacked safety. The remainder of the prefix difference includes restored-feature availability/routing and upstream application guidance. It has not been exhaustively allocated line by line, so do not assign the entire +1,384 to feature restoration alone.

| Area | Earlier reduced-feature build | Current full-feature fork |
| --- | --- | --- |
| Built-in desktop/browser automation | Retired | Retained, subject to runtime availability and permissions |
| Phone screen/app automation | Retired; mobile chat remained | Retained; mobile chat also remains |
| Data/DuckDB tools and workspace | Retired | Retained |
| Dedicated decide/extract/report_bug helpers | Retired | Retained in the supported tool surface |
| Widgets, HTML/publishing, team chat and ordinary file tools | Retained | Retained |
| Split instruction resources | Index + seven broad topic files | 33 brief resources including index/native base |
| Initial tools | Five, with discovery for retained features | Same five, with discovery across the full permitted feature set |
| Later upstream features | 0.1.161-era implementation | Integrated 165/166/167/169 changes, including conditional app help and MCP setup updates |

More guide files do not mean all guides are sent initially. The new app-help skill is conditional and is not included in the ordinary 7,375 result. Returning to 5,843 by reinstalling the old branch would also reintroduce its retired feature surface and older application behavior; it is not a drop-in smaller prompt for the current codebase. Whether the current full-feature prompt can be made equally small would require a separate, measured optimization—not merely copying the old wording.

Evidence: old committed `docs/concise-context.md` and `docs/lean-removal.md` via `git show f98f8902b:...`; saved synthetic `phase3-installed` and `deploy169-installed-1` payloads; current source core and pi-base.md. This comparison uses existing artifacts only; production was not changed or tested with real messages.

## Bottom line

- Earliest controlled fresh baseline → current: **101,412 → 7,375**, down **94,037 characters (92.73%)** across the recorded evolution.
- Initial full-feature indexed fork → current: **94,983 → 7,375**, down **87,608 (92.24%)**.
- First full-feature brief-guide build → current: **7,323 → 7,375**, net **+52 (0.71%)**, while retaining later features, explicit authorized automation and safeguards.
- Current production: **0.1.169**, implementation `5f610ddf4`; deployed after idle/backup checks. Main is not merged pending trial acceptance.
- Latest prepared integration: **0.1.173**, separate trial branch; same initial candidate payloads as 169 after path/cache-key normalization, not deployed.

## Keep tracking future updates

For each release, record the exact upstream tag, fork implementation, deployment status, archive hash, fixture/human text/model/settings/Pi version, actual package path, skill selection, repeated capture labels and equality check. Capture complete before/after installed provider JSON under isolated synthetic fixtures, excluding only human text. Record native/declarations/app/framing separately, explain retained inline policy and offloaded procedures, and distinguish candidates, controls, historical replays and installed builds. Never refresh an old row silently or replace measurements with estimates. Do not use real provider calls or live conversations as tests.

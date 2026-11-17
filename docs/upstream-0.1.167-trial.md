# Upstream 0.1.167 production trial

Branch: `integration/upstream-0.1.167`, created from fork `origin/main` at `e60945380a66b3354c8d498aeb8005fce52788c0`. Do not merge into main or delete this branch until the user accepts its production trial.

## Release and integration review

GitHub's latest published stable release and tag-specific API both identify `v0.1.167`, published `2026-11-17T17:39:06Z`, not draft or prerelease. The tag resolves to `9f054751fa9c3f5381da84e5ab73e3d543e25463`, matching the release target. npm lists `openmausbot@0.1.167`, integrity `sha512-BY+nV90xPHt1avq7+zjq6eahjkr0n4waD9p2CHUSELJN2wJuKE+cqk+aS026JJlTFwWljXqK+kVxbtOJyXMsPg==`. Unreleased upstream main is not the integration target.

Release: https://github.com/milind-soni/OpenMausBot/releases/tag/v0.1.167

The released delta spans 337 files. It adds team files and audience-scoped boxes, team/private-GitHub templates and skill side files, Bitwarden, skill import, team announcements, ten connected accounts per app, own-chat hand-off reads, media streaming/context menus and UI/reliability fixes. Runtime dependencies and lockfile are unchanged, so the existing installed native dependencies can be retained for the same Node/platform.

Retain the full upstream feature delta. Resolve the `server/index.ts` seam by keeping indexed/native-cwd workspace options **and** the new team-file location/authority suffix. Preserve the new vault-reference sentence through `BotLogins.secretsPrompt` in preview, direct and room prompts without folding runtime names into a manual. The only newly recognized stock instruction is the exact reviewed Full access label change; unknown variants still pass through. Brief guides, original registered schemas/callbacks, discovery, permission boundaries, authored facts and authorized independent Playwright/SSH alternatives remain intact.

## Upstream defects found during review

Independent offline reproductions found upstream defects, repaired before trial deployment:

- Cached linked-vault identities held old bot grants, bypassing later revocation. Cache identity rather than authorization; re-resolve current provider existence, fields and grants. Regressions cover named/reference secrets, warm MCP caches, revocation, removal and reconnects for both managers.
- Overlapping team-file uploads could replace another member's newly committed file and take ownership. Revalidate current replacement authority immediately before the synchronous rename/ownership commit.
- Concurrent team-file uploads could exceed aggregate quota. Recompute fresh usage at commit, with no intervening await, and bound aggregate staging bytes with cleanup on success/failure. This is per-instance/process coordination, not a filesystem lock against external writers; fresh synchronous scans cost filesystem work.
- Section-qualified 1Password references discarded their section and could deliver a different section's credential with the same field title. This is a wrong-field substitution, not a demonstrated cross-item grant bypass. The repair retains SDK section metadata and carries canonical section/field identity through fresh reads, rejecting missing/ambiguous matches. Authorized section-qualified and unambiguous unsectioned references remain supported; internal identities are not shown as human labels.

These are runtime correctness/security repairs, not mechanisms for reducing context.

## Fresh complete-request baseline

Before deployment, two fresh captures of installed 0.1.166 both measured **7,365 Unicode characters** of complete provider-built JSON overhead, excluding only the two human characters in the frozen empty-history `Hi` fixture. Five initial tools. Breakdown: native instructions 371, declarations 2,008, app prefix 4,518, framing 468. Payloads are equal after removing only `prompt_cache_key`.

The final packaged 0.1.167 candidate captured twice at `/tmp/omb167-candidate` measured 7,329 characters, five initial tools: native 371, declarations 2,008, app prefix 4,482, framing 468. Both payloads match except cache key. Its guide path is 36 characters shorter than the installed production path; this is path overhead, not an optimization claim. Installed-path measurements follow deployment.

Captures use synthetic credentials, disposable homes and blocked external provider transport. The observer loads last, after payload transforms, and exits before transport. Raw payloads remain outside Git. These are neither reported tokens nor populated-user measurements.

## Verification and deployment

Preliminary clean gates: all configured typechecks, whole-project lint, frontend/server production builds and kernel-network-isolated packaged smoke. All 33 nonempty brief guides are unchanged from accepted main and remain below 1,400 characters (largest: surface.md, 1,380).

Fork critical network-isolated run: 24 suites, 503 passed / 2 skipped. Separate dispatch/team-files/Bitwarden run: 4 suites / 18 passed. Earlier broader preservation attempt had one stale memory wording assertion; its replacement asserts the managed memory_update-only rule and guide pointer, not permission relaxation. Changed renderer run: 32 suites / 612 passed; focused 19-suite / 200-test DOM rerun is overlapping, not additional unique coverage. i18n and contrast regression gates passed; existing Midnight accent/danger 4.5:1 gaps remain, and a non-failing Happy DOM teardown AbortError reproduced.

Actual Pi 1.5.2 / Node 24.22.2 qualification ran inside a loopback-only kernel network namespace. Generic callback/scope fixture passed, and 12 additional cases qualified the exact changed skill_manage/share declarations, zero-action discovery, exactly-once synthetic callbacks, denied scopes and custom/host approval allow/deny gates. The packaged extension SHA-256 remains `4e298423a31c299b60e2fcadb9cbc94ac04a2eb70868afdc1219d12c47a79586`. Approval decisions used actual Pi ctx.ui.confirm with injected synthetic responses, not a human UI.

Changed non-renderer broad run: 76 files, 2,312 passed / 5 skipped / 2 failed; the two failures concern MCP descendant process cleanup. This is not a clean full-suite claim. The cancellation cases passed focused reruns, and the complete 136-test file passed four separate reruns. Passive sampling saw one helper briefly zombie then absent, but does not establish the state of the original failed helpers; no persistent/live-helper leak was demonstrated. The original broad run remains red. Skips were an opt-in/UI-build case and four bubblewrap-dependent cases (bubblewrap unavailable). Repair-focused gates: vault 63 passed; team files/host/cloud 31 passed; independent review 14 suites / 173 passed. These overlap broader coverage and must not be summed as unique tests.

Broker: 128 passed. Changed Electron Node tests: 35 passed. Final section-aware vault gates: 5 suites / 60 passed; independent section review 3 suites / 37 passed plus synthetic SDK assertions. Final preservation rerun: 14 suites / 95 passed, 1 skipped. Final all-configured typechecks, whole-project lint, frontend/server production builds and isolated packaged smoke passed after all repairs. Build retains the upstream large-chunk advisory. Installed SDK 0.5.0 module loads from staged native dependencies without creating a client or making a provider call.

Independent review found no material remaining blocker in the bounded merge/repairs. Complete application workflows using real managers, human approvals, real bubblewrap, native installers, actual Docker builds and live provider quality are not claimed.

Final npm archive SHA-256: `bcd4b708563e6e5d30c8fa616828badba8e6671249760a26076cec4580d36af4`. Package manifest verifies all 33 guides and the `.ts` runtime Pi extension. Private logs/receipts are under `/tmp/omb167-verification/`, `/tmp/omb-up167-pi-offline/` and `/tmp/omb-up167-schema-pi-ZKm5A0/`; raw payloads and user backups stay outside Git.

## Deployment deferred: active production turn

Implementation `49fc691e964b1479e526e1332e0a660c9ffe4b09` was committed and pushed to the trial branch before attempting deployment. Fork main remains `e60945380a66b3354c8d498aeb8005fce52788c0`.

The idle gate refused deployment: one bot and one task were still working across two bounded waits totaling about eight minutes. The service was never stopped or swapped; **production remains healthy 0.1.166, implementation a92659ae8**, same PID 450316, zero restarts at the latest check. Local/static and public HTTPS health passed. No new successful production backup or installed-167 measurement/history/model receipt exists yet. An earlier staging read-permission preflight error was corrected before any service operation. Both unused stage trees and their empty backup directories were removed by exact path.

Ready artifacts on maus-desktop: `/tmp/omb-context-audit-20260527/upstream167.tgz`, `/tmp/omb167-candidate/`, and `/tmp/omb-context-audit-20260527/deploy-upstream167-remote.sh`. Local deployment source: `/home/piweb/workspace/projects/openmausbot-context-audit/deploy-upstream167-remote.sh`. It pins the archive and implementation, refuses changed production/native dependencies, checks idle, backs up package/workspace, verifies health/history/bot effort/thread/default model settings and guides, and rolls back immediate deployment failures. No unattended deployment or merge job is scheduled.

Resume by reading the script, recapturing the fresh current-production baseline if needed, and running deployment only when idle. Then capture installed provider requests twice, compare equality ignoring only cache key, verify service/HTTPS health/history/models, and record the backup and installed receipts. Main must remain unchanged throughout the trial. For rollback after normal use, first back up the CURRENT workspace; never restore an older snapshot over newer conversations.

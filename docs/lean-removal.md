# Phone automation, Data and specialized helper removal

This follows the desktop/browser removal. It is permanent product retirement,
not a hidden feature flag. The later [concise-context phase](concise-context.md)
rewrites instructions and loads tools on demand without further feature retirement.

## Removed

- USB/ADB and paired-phone automation: screen reading, screenshots, app control,
  tap/swipe/type jobs, teaching and takeover. Old tools, MCP transports,
  REST/WebSocket routes and host IPC refuse requests.
- The built-in Data workspace: Data tools, SQL/query/export APIs, Data charts and
  grid panel, injected Data instructions and packaged DuckDB runtime. Existing
  workspace files and historical data are not deleted.
- Dedicated `decide`, `extract` and `report_bug` tools, their settings and
  developer-report capture/transmission. Legacy specialized provider config and
  environment keys cannot reactivate them.
- Automatic mail-triage fallback for the recorded default watch. Disabling a
  specialist must not silently replace it with main-model sorting calls.
  Explicit user-created mail routines and deterministic checks are retained.
- Retired phone/Data skills are absent from runtime discovery and distributions.
  Historical templates remain in source, not as advertised agent instructions.

## Explicitly retained

- Widgets and choice cards.
- HTML/JSX chat previews and public page/app publishing.
- Mobile chat, pairing, push notifications and authentication.
- File attachment/download flows and the Files panel.
- Shell/read/write/edit, connected apps, model configuration and team chat.
- Ordinary activity/error logs, Inspector and user-created routines.
- Rendering and credential native dependencies (resvg and 1Password); the legacy
  native-resource directory name does not imply a DuckDB runtime is shipped.

Dedicated inference tools are distinct from ordinary app text-generation jobs,
such as summarizing conversation history; those normal workflows remain.

## Verification

- 45 changed/retained suites: **1,136 tests passed**, none skipped.
- Paired mobile client sends a real isolated fake-engine chat turn; invalid
  bearer credentials and cross-origin cookie mutations are rejected.
- Isolated widget, HTML and public-page workflows passed.
- 6 Electron retirement Node tests passed.
- Real React chat/search fixture passed (one selected workflow; two unselected).
- Server/frontend/phone-protocol TypeScript, changed-source lint and whitespace
  checks passed.
- Production server/UI/npm builds and isolated packaged-server smoke passed.
- Actual native staging loaded resvg/1Password with DuckDB absent.

Full upstream suites, native OS installers and Docker image builds were not
executed. Some dormant source contracts, components and historical tests remain
for staged cleanup, but their operational entry points are removed or rejected.
This is not a sandbox against independently installed tools or arbitrary shell
code.

## Installed first-request comparison

Implementation commit: `1fb10b4b80947bade6f1203a9e5d760d2ae43513`.
Installed version: `0.1.161-archsinit.2`, on `maus-desktop`.

Matched frozen first-request fixture, Unicode characters (not tokens):

| Component | Previous fork | This version |
|---|---:|---:|
| Native Pi instructions | 2,431 | 2,431 |
| All provider-serialized tool declarations | 66,410 | 58,012 |
| App prefix before the human text | 25,071 | 23,972 |
| **Entire request minus human text, including framing** | **94,475** | **84,978** |
| Tool count | 60 | 52 |

Reduction: **9,497 characters (10.1%)** from the previous fork, or **16.2%**
from the original matched baseline of 101,412. This is still far above a
5,000-character target; remaining tool schemas alone occupy 58,012 characters.

Actual removed declarations in this fixture are the five Data tools plus
`decide`, `extract` and `report_bug`. The matched baseline did not mount phone
automation; its retirement is independently covered by tool/transport/startup
and paired-mobile-chat regressions. Widgets, HTML and public publishing tools
remain in the captured request.

The actual installed app assembled each request in a disposable workspace,
using unchanged Pi 1.5.2, model, thinking level, IDs, cwd, date/time, empty
profile/memory/history and human text. Provider-built payloads were captured
and stopped before transport with synthetic credentials and an outbound
network guard. Both post-install repetitions matched except for cache key.
No paid calls or test messages to the real conversation were made. See the
[earlier comparison](context-comparison.md) for measurement definitions and
historical-vs-matched distinctions. These are not transport/token counts.
Raw context and credentials remain private and outside Git.

Post-install: service healthy; retired endpoints return 410; no DuckDB runtime
installed; resvg/1Password still load; 79 message rows before and after; existing
model and workspace retained. The app-only live prompt preview remains 17,630
UTF-8 bytes and is not the full overhead measurement.

Backup: `~/.local/state/openmausbot-fork-backups/20261116T112816Z/` on the target.
It contains the previous package and workspace archive; keep it private.
Package SHA-256:
`7fc2a88c08be7afc2433ccddd6246be91b4476beb5284359010f5ae6338632d4`.

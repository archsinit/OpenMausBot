# Phone automation, Data and specialized helper removal

This follows the desktop/browser removal. It is permanent product retirement,
not a hidden feature flag.

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

The previous installed full-context baseline was **94,475 characters**, including
all provider instructions, tool schemas, app prefix and JSON framing, excluding
only the human message. Compare a fresh post-install request using the same
frozen fixture; do not infer savings from schema counts or the app preview alone.
Raw context and credentials must never be committed.

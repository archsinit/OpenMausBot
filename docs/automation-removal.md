# Desktop/browser automation removal

This fork permanently removes built-in desktop and browser automation. It is
not a configurable feature flag. Ordinary shell/file work, chat, connected-app
OAuth, provider sign-in links, Files and Data remain supported.

## Boundaries

- Direct and room turns no longer mount browser, computer or dweb MCP servers.
- Preview and dispatched prompts omit their operational guidance.
- Tool catalogs, discovery, direct calls and aliases reject retired tools.
- HTTP and WebSocket transports for control, provisioning, browser sessions,
  viewers and saved steps return 410 before reaching legacy handlers.
- Product settings writes cannot restore retired fields. Arbitrary webhook
  filter and connected-app configuration keys are not mistaken for settings.
- Loading legacy configuration drops retired settings without discarding AI
  credentials or preferences. Explicit bot/task automation state and inherited
  task resume cursors are removed, preserving conversation history.
- UI entry points, settings, onboarding, viewer routes and control cards are
  removed. Legacy saved panel state cannot reopen them.
- Electron/companion no longer start or lend a desktop or expose Chrome/CDP.
- Packages omit automation browser/CUA resources and executable proxies;
  stale native resources fail packaging. The CLI installer is retired.
- The fork's desktop update feed points at `archsinit/OpenMausBot`, not upstream.

Dormant internal helper modules, types, historical translations and upstream
feature-specific tests remain for staged source cleanup. They are not shipped
as operational user-facing capabilities. This removal does not sandbox an
independently installed extension, custom integration or arbitrary shell code.

## Verification at the implementation commit

- Changed-test regression: **33 files, 1,348 passed, 5 skipped** (platform-only
  Mach-O cases); includes isolated direct/room first turns and real React chat.
- The initial search UI run failed intermittently. The focused workflow then
  passed twice, and the final combined run passed. No deterministic removal
  regression was identified; the initial failure is not hidden.
- Electron retirement checks: 3 Node tests passed; broader focused host checks
  also passed during implementation.
- Frontend, server and phone-protocol TypeScript checks passed.
- Changed-source `oxlint --deny-warnings` and `git diff --check` passed.
- Server bundle, production Vite build and npm tarball build passed.
- Packaged-server smoke passed outside the repository: startup, search worker,
  MCP/CLI, encrypted backup export, service trust, launcher/entry lifecycle,
  and absence of automation routes/proxies/configuration.

The complete upstream suite, native OS installers and Docker release jobs were
not executed. Historical automation-success tests do not describe this fork's
supported behavior; do not mistake a helper unit test for an exposed feature.

## Full first-request context

The model receives more than the app's preview: Pi's own prompt sections, all
active tool descriptions and schemas, app instructions prepended to the first
user message, and any automatically loaded memory/files/skills.

Count those together, exclude only the human request, and report provider JSON
framing separately. A context capture must stop before provider transport and
use a disposable workspace. Never commit raw captures containing private user
context or credentials. Removing desktop/browser automation alone does not
claim a 5,000-character total budget; remaining tool catalogs dominate it.

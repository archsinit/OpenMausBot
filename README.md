# OpenMausBot — archsinit fork

A local-first chat app for a team of AI agents. This fork is based on
[milind-soni/OpenMausBot](https://github.com/milind-soni/OpenMausBot), under
Apache-2.0. Upstream attribution and third-party notices are retained.

## This fork's scope

Desktop and browser automation have been removed from the product:

- No agent-controlled browser, desktop, VM, cloud computer or screen viewer.
- No computer selection, browser profiles/proxy settings, saved screen steps,
  browser sign-in/fill-login tools, or desktop-hosted meeting automation.
- No automation provisioning or viewer transports; old endpoints return 410.
- No bundled automation Chrome, CUA runtime, or CLI browser installer.
- Legacy configuration cannot re-enable these capabilities.

The ordinary browser-based chat interface and Electron chat shell remain.
External sign-in links for AI providers and connected apps are not browser
automation and are preserved. Shell/file tools, connected apps, team chat,
ordinary scheduled tasks, skills, Files and Data remain available.

This is a product-surface removal, not an operating-system sandbox. An
independently installed extension, custom integration or unrestricted shell
program can still perform actions outside this app's built-in capabilities.

## Requirements

- Node.js 24 or later
- pnpm 10.33.0

## Develop

```sh
pnpm install --frozen-lockfile
pnpm dev:server
# In another terminal:
pnpm dev
```

Check `AGENTS.md` before changing the app. Verify changes against disposable
fixtures, never the user's live workspace; see
[verification](docs/verification/README.md).

```sh
pnpm typecheck
pnpm exec vitest run server/automation-removal.test.ts server/automation-removal.e2e.test.ts
pnpm exec vitest run server/routes/retired-automation.test.ts
pnpm exec vitest run src/components/automation-removal.test.ts
```

Some historical upstream automation modules, tests and verification recipes
remain for staged source cleanup. They are not supported features of this fork.
The retirement regression tests cover exposed tools, prompts, routes, stale
configuration, direct and room turns, and frontend entry points.

## Build a self-hosted package

```sh
pnpm build:server
pnpm exec vite build
node scripts/build-npm-package.mjs
cd release/npm
npm pack
```

The result is a local `openmausbot` npm package; it is not the upstream npm
release. Install the generated tarball explicitly rather than using
`npm install openmausbot`, which would restore upstream code.

Back up both the installed package and the workspace before an upgrade. Stop
the managed service, replace the package, and restart it using the same data
directory. Do not replace the workspace with build or test data. Legacy
computer/browser settings are discarded on load, while model configuration,
conversation history and ordinary workspace files are retained. A legacy
session with explicit automation state is rebuilt without its old resume
cursor.

## License

See [LICENSE](LICENSE), [LICENSING.md](LICENSING.md) and [NOTICE](NOTICE).
Source-available enterprise components, where present, retain their separate
license; this fork does not change those terms.

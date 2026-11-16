# Installed Pi first-request context comparison

This records the first desktop/browser-removal deployment. For the subsequent
phone/Data/helper removal and latest installed measurements, see
[the second-phase results](lean-removal.md#installed-first-request-comparison).

Implementation commit: `648c16157bbddfc58bc9751f03387cdd46f1ee3f`.
Installed fork: `0.1.161-archsinit.1`, on `maus-desktop`.
Pi stayed at `1.5.2`; model stayed `openai-codex/gpt-6.1-sol`, medium reasoning.

## Matched first-request comparison

These are **Unicode characters**, not tokens. Counts include the entire
provider-built request before the first human message has elicited a response,
minus only the actual human text.

| Component | Original | Fork | Reduction |
|---|---:|---:|---:|
| Pi's own rendered system instructions | 2,431 | 2,431 | 0 |
| All serialized tool declarations | 70,770 | 66,410 | 4,360 |
| App prefix, time and framing before the human text | 27,648 | 25,071 | 2,577 |
| Full request minus human text, including JSON/control framing | **101,412** | **94,475** | **6,937 (6.84%)** |
| Tool count | 64 | 60 | 4 |

System prompt plus tool JSON plus app prefix is 100,849 → 93,912 characters;
the full-request measure additionally includes provider JSON/control framing.
Tools are inside the provider's `input` tool-declaration item, not necessarily
a top-level `tools` field. Counting only top-level `tools` would incorrectly
omit most overhead.

Removed from the actual request: `agents_select_computer`, `agents_vm_exec`,
`agents_request_sign_in`, `agents_fill_login`. No browser/desktop tools or
operational instructions remain in the measured fork request. The original
fresh fixture did not have a usable desktop/browser runtime, so it had no
large active browser tool catalog to remove. Core tools and their schemas
still dominate the remaining context.

**This change does not achieve a 5,000-character total.** That needs a separate
reduction of core tools/instructions or bounded on-demand tool discovery.

## Historical original request and live preview

The user's preserved historical first RPC request had 75 tools and a different
memory/environment. Replaying that exact historical context through the
installed Pi provider serializer measured **107,329 characters excluding the
105-character human request**, including 76,822 characters of tool JSON.
It is useful historical evidence, but not the apples-to-apples denominator for
this change; the matched fixture above has frozen empty memory/profile and
no phone integration.

Separately, the real bot's app-only preview decreased from **23,823 to 17,630
UTF-8 bytes** (6,193 bytes / 26.0%). That preview excludes Pi's own prompt,
actual tool schemas and turn-only context; it must not be presented as the
complete request size.

## Method and verification

- Ran original and updated **installed app code**, each in a disposable HOME
  and workspace, never by sending test messages to the real conversation.
- Same frozen bot/thread IDs, cwd, date/time, empty profile/memory/history,
  synthetic credentials, human text, native Pi version/model and thinking level.
- Pi's observation-only `context_with_system` and `before_provider_request`
  hooks captured the newly assembled transcript and provider serialization.
- Capture exited before provider transport. A network guard allowed only the
  isolated fixture's loopback ports. No provider requests, real credentials,
  refreshes or paid calls were used.
- Tools were discovered through the real app proxies, including Data; native
  tools, schemas, app prefix and automatically loaded context were all counted.
- Original and fork captures each repeated identically except for
  `prompt_cache_key`. Fixture processes were stopped and their ports released.
- Raw prompts, schemas with private context and captures are kept outside Git
  with private permissions. Only aggregate results are committed here.

This measures pre-transport provider JSON, not TLS bytes/headers, compression,
provider tokenization or unknown server-side instructions. The historical
measurement is a serializer replay, not a historical wire capture.

## Deployment and recovery

The code branch was committed and pushed before installation. Package SHA-256:
`990e2c3d49b2bc30a80970bfdb3978920b86dbb8d6365b307f6beee3843f863e`.

The first staging attempt had unreadable root-owned file modes; readiness failed
and automatic rollback restored both package and workspace. After normalizing
staged code permissions and checking readability, installation succeeded.

Successful backup on the target:
`~/.local/state/openmausbot-fork-backups/20261116T103818Z/`.
It contains the original package, workspace archive and service unit. Keep it
private: workspace archives may contain credentials and conversations.

Post-install checks: managed service active; health version matches the fork;
retired endpoints return 410; removed settings absent; one bot and its existing
task/model/history retained (79 message rows before and after); real
conversation untouched by testing. The installed `FORK-BUILD.json` records the implementation commit and package hash.
Refresh an already open chat page to load the new UI.

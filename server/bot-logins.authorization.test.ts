import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type { LinkedSecret } from "../shared/vault.ts";
import { BotLogins } from "./bot-logins.ts";
import type { BitwardenLogins } from "./host/bitwarden-vault.ts";
import type { OnePasswordLogins } from "./onepassword.ts";
import { VaultStore } from "./vault-store.ts";
import { createMcpKeys, vaultPointer } from "./vault/mcp-keys.ts";
import type { VaultProvider } from "./vault/providers.ts";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

function setup(manager: string, mode: string) {
  const dir = mkdtempSync(join(tmpdir(), "omb-linked-authorization-"));
  dirs.push(dir);
  const store = new VaultStore({ dataDir: dir });
  const reference = manager === "1password" ? "op://Team/Deploy/token" : "bw://Deploy/password";
  const field = mode === "named" ? undefined : mode === "field" ? "user" : "password";
  let current: LinkedSecret | null = {
    id: `${manager}:original`, name: "Deploy", fields: ["user"], source: "linked", provider: manager, bots: "all", readOnly: true,
  };
  let connected = true;
  let resolvedField = field;
  const reads: Array<{ id: string; field?: string }> = [];
  const held: string[] = [];
  const provider: VaultProvider = {
    id: manager, label: manager, fresh: async () => {}, markUsed: () => {},
    items: () => connected && current && mode !== "reference-only" ? [{ kind: "secret", ...current }] : [],
    resolve: (name) => connected && current && name === reference ? { secret: { ...current }, field: resolvedField } : null,
    read: async (id, field) => { reads.push({ id, field }); return { value: "synthetic-key" }; },
  };
  const empty = { ...provider, id: "1password", items: () => [], resolve: () => null } as unknown as OnePasswordLogins;
  const logins = manager === "1password"
    ? new BotLogins(store, provider as OnePasswordLogins, () => [], (value) => held.push(value))
    : new BotLogins(store, empty, () => [], (value) => held.push(value), provider as BitwardenLogins);
  const keys = createMcpKeys({ store, linked: { fresh: () => logins.fresh(), byId: (id) => logins.linkedById(id) } });
  const name = mode === "named" ? "Deploy" : mode === "field" ? "Deploy user" : reference;
  return {
    logins, keys, name, field, reads, held,
    change: (patch: Partial<LinkedSecret>) => { current = { ...current!, ...patch }; },
    remove: () => { current = null; },
    connect: (value: boolean) => { connected = value; },
    changeField: () => { resolvedField = "other"; },
  };
}

for (const manager of ["1password", "bitwarden"]) {
  describe(`${manager} cached secret authorization`, () => {
    for (const mode of ["named", "field", "reference", "reference-only"]) {
      it(`${mode}: uses current grants and existence even while the MCP value is warm`, async () => {
        const world = setup(manager, mode);
        const secret = (await world.logins.linkedSecret(world.name, "bot-a"))!;
        expect(secret).not.toBeNull();
        const server = { command: "synthetic-mcp", args: [], env: { TOKEN: vaultPointer(secret.id) } };
        world.keys.grant("test", [secret.id]);
        await world.keys.warm("test", server);
        expect(world.keys.resolve("test", server, "bot-a")).toMatchObject({ ok: true, server: { env: { TOKEN: "synthetic-key" } } });
        const readCount = world.reads.length;

        world.change({ bots: ["bot-b"] });
        expect(world.logins.linkedById(secret.id)?.bots).toEqual(["bot-b"]);
        expect(world.keys.resolve("test", server, "bot-a")).toMatchObject({ ok: false, reason: "kept" });
        expect(world.keys.resolve("test", server, "bot-b")).toMatchObject({ ok: true });
        expect(world.keys.resolve("test", server)).toMatchObject({ ok: true });
        world.change({ bots: [] });
        expect(world.keys.resolve("test", server, "bot-b")).toMatchObject({ ok: false, reason: "kept" });
        world.change({ bots: "all" });
        expect(world.keys.resolve("test", server, "bot-a")).toMatchObject({ ok: true });
        expect(world.reads).toHaveLength(readCount);

        world.connect(false);
        expect(world.keys.resolve("test", server, "bot-a")).toMatchObject({ ok: false, reason: "removed" });
        world.connect(true);
        world.change({ bots: ["bot-b"] });
        expect(world.keys.resolve("test", server, "bot-a")).toMatchObject({ ok: false, reason: "kept" });
        expect(world.keys.resolve("test", server, "bot-b")).toMatchObject({ ok: true });
        expect(await world.logins.linkedById(secret.id)!.read()).toBe("synthetic-key");
        expect(world.reads.at(-1)).toEqual({ id: `${manager}:original`, field: world.field });
        expect(world.held.at(-1)).toBe("synthetic-key");

        world.remove();
        expect(world.logins.linkedById(secret.id)).toBeNull();
        expect(world.keys.resolve("test", server, "bot-b")).toMatchObject({ ok: false, reason: "removed" });
      });
    }

    it("does not retarget a cached reference when it resolves to another identity or field", async () => {
      const world = setup(manager, "reference-only");
      const secret = (await world.logins.linkedSecret(world.name, "bot-a"))!;
      world.change({ id: `${manager}:replacement` });
      expect(world.logins.linkedById(secret.id)).toBeNull();
      world.change({ id: `${manager}:original` });
      world.changeField();
      expect(world.logins.linkedById(secret.id)).toBeNull();
    });

    it("rejects removed named fields and retains the original ID across a rename", async () => {
      const world = setup(manager, "field");
      const secret = (await world.logins.linkedSecret(world.name, "bot-a"))!;
      world.change({ name: "Renamed" });
      expect(await world.logins.linkedById(secret.id)!.read()).toBe("synthetic-key");
      world.change({ fields: [] });
      expect(world.logins.linkedById(secret.id)).toBeNull();
    });
  });
}

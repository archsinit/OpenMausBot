import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type { LoginBots } from "../shared/logins.ts";
import { BotLogins } from "./bot-logins.ts";
import { OnePasswordLogins, sdkOnePasswordClient, type OnePasswordItemContent, type OnePasswordSdk } from "./onepassword.ts";
import { VaultStore } from "./vault-store.ts";
import { findLinkedSecret, readLinkedSecret } from "./vault/providers.ts";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

async function setup() {
  const content: OnePasswordItemContent = {
    sections: [{ id: "prod", title: "Production" }, { id: "stage", title: "Staging" }],
    fields: [
      { id: "p", sectionId: "prod", title: "token", fieldType: "Concealed", value: "fake-production" },
      { id: "s", sectionId: "stage", title: "token", fieldType: "Concealed", value: "fake-staging" },
      { id: "region", title: "Region", fieldType: "Text", value: "fake-eu" },
    ],
  };
  const grants: Record<string, LoginBots> = { "v:i": ["allowed"] };
  const sdk: OnePasswordSdk = { createClient: async () => ({
    vaults: { list: async () => [{ id: "v", title: "Team" }] },
    items: {
      list: async () => [{ id: "i", title: "Deploy", category: "ApiCredentials" }],
      getAll: async () => ({ individualResponses: [{ content: { id: "i", ...content } }] }),
    },
  }) };
  const source = new OnePasswordLogins({ token: () => "ops_fake", itemGrants: () => grants, connect: (token) => sdkOnePasswordClient(sdk, token, "test") });
  await source.refresh();
  const use = (ref: string, bot = "allowed") => findLinkedSecret([source], ref, bot);
  return { source, content, grants, use };
}

describe("1Password section field identity", () => {
  it("selects duplicate titles by section title or ID through the SDK adapter and fresh read", async () => {
    const { use, content } = await setup();
    const production = use("op://Team/Deploy/Production/token")!;
    const staging = use("op://Team/Deploy/Staging/token")!;
    expect(production.field).not.toBe(staging.field);
    expect(await readLinkedSecret(production)).toBe("fake-production");
    expect(await readLinkedSecret(staging)).toBe("fake-staging");
    expect(use("op://v/i/stage/s")?.field).toBe(staging.field);
    content.fields.reverse();
    content.fields.find((field) => field.id === "s")!.value = "fake-staging-updated";
    expect(await readLinkedSecret(staging)).toBe("fake-staging-updated");
  });

  it("fails closed for missing sections, ambiguous titles and denied bots, preserving unsectioned names and refs", async () => {
    const { source, use } = await setup();
    for (const ref of ["op://Team/Deploy/NONEXISTENT/token", "op://Team/Deploy/token", "op://Team/Deploy/Staging/missing", "op://Team/Deploy/Production/Region"]) expect(use(ref), ref).toBeNull();
    expect(use("op://Team/Deploy/Staging/token", "denied")).toBeNull();
    expect(use("Deploy", "denied")).toBeNull();
    expect(use("Deploy token")).toBeNull();
    expect(await source.read("1password:v:i", "token")).toEqual({});
    expect(await readLinkedSecret(use("op://Team/Deploy/region")!)).toBe("fake-eu");
    expect(await readLinkedSecret(use("Deploy Region")!)).toBe("fake-eu");
    expect(await readLinkedSecret(use("Deploy")!)).toBe("fake-production");
  });

  it("rejects duplicate section names, field title/ID collisions and duplicate identities", async () => {
    const { source, content, use } = await setup();
    content.sections!.push({ id: "other", title: "Staging" });
    await source.refresh();
    expect(use("op://Team/Deploy/Staging/token")).toBeNull();
    expect(await readLinkedSecret(use("op://Team/Deploy/stage/token")!)).toBe("fake-staging");
    content.fields.push({ id: "token", sectionId: "stage", title: "Other", fieldType: "Text", value: "fake-other" });
    await source.refresh();
    expect(use("op://Team/Deploy/stage/token")).toBeNull();
    const original = use("op://Team/Deploy/stage/s")!;
    content.fields.push({ ...content.fields.find((field) => field.id === "s")! });
    await expect(readLinkedSecret(original)).rejects.toThrow("no value");
    await source.refresh();
    expect(use("op://Team/Deploy/stage/s")).toBeNull();
  });

  it("does not retarget a canonical field when removed or moved before read", async () => {
    const { content, use } = await setup();
    const staging = use("op://Team/Deploy/Staging/token")!;
    content.fields.find((field) => field.id === "s")!.sectionId = "prod";
    await expect(readLinkedSecret(staging)).rejects.toThrow("no value");
  });

  it("keeps separate BotLogins identities, readable labels and current item grants", async () => {
    const { source, grants } = await setup();
    const dir = mkdtempSync(join(tmpdir(), "omb-onepassword-sections-"));
    dirs.push(dir);
    const logins = new BotLogins(new VaultStore({ dataDir: dir }), source);
    const production = (await logins.linkedSecret("op://Team/Deploy/Production/token", "allowed"))!;
    const staging = (await logins.linkedSecret("op://Team/Deploy/Staging/token", "allowed"))!;
    expect(production.id).not.toBe(staging.id);
    expect(production.name).toBe("op://Team/Deploy/Production/token");
    expect(staging.name).toBe("op://Team/Deploy/Staging/token");
    expect(staging.name).not.toContain("\0");
    expect(await logins.linkedById(production.id)!.read()).toBe("fake-production");
    expect(await logins.linkedById(staging.id)!.read()).toBe("fake-staging");
    grants["v:i"] = ["other"];
    expect(logins.linkedById(staging.id)?.bots).toEqual(["other"]);
    expect(await logins.linkedSecret("op://Team/Deploy/Staging/token", "allowed")).toBeNull();
  });
});

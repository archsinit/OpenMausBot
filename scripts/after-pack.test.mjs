import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import afterPack from "./after-pack.mjs";

const temporaryDirectories = [];

function fixture() {
  const appOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "omb-after-pack-"));
  temporaryDirectories.push(appOutDir);
  const resources = path.join(appOutDir, "resources");
  fs.mkdirSync(resources, { recursive: true });
  return { appOutDir, resources };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("packages without desktop or browser automation", () => {
  for (const platform of ["linux", "darwin", "win32"]) {
    it(`accepts ${platform} resources without a browser or desktop runtime`, async () => {
      const { appOutDir } = fixture();
      await expect(afterPack({ electronPlatformName: platform, arch: 1, appOutDir })).resolves.toBeUndefined();
    });
  }
  for (const name of ["browser-engine", "cua-linux-x64", "cua-driver", "cua-sdk", "android-platform-tools", "skills/phone-harness", "skills/data-dashboards", "server/drivers/phone-proxy.js", "server/data"]) {
    it(`rejects a stale ${name} resource instead of shipping automation`, async () => {
      const { appOutDir, resources } = fixture();
      fs.mkdirSync(path.join(resources, name), { recursive: true });
      await expect(afterPack({ electronPlatformName: "linux", arch: 1, appOutDir })).rejects.toThrow(`Removed automation resource in package: ${name}`);
    });
  }
});

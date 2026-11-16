import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installedPackage, pinnedOnePasswordVersion, pinnedResvgVersion, resvgPlatformPackage, stageDuckdb, targetsFor, verifyDuckdbTree } from "./prepare-duckdb.mjs";

const temporaryDirectories = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});
function fixture(platform = "linux", arch = "x64") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "omb-native-"));
  temporaryDirectories.push(root);
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ dependencies: { "@resvg/resvg-js": "2.6.2", "@1password/sdk": "0.5.0" } }));
  function pkg(scope, name, version, files, dependencies) {
    const directory = path.join(root, "node_modules", scope, name);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ version, dependencies }));
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
      fs.writeFileSync(path.join(directory, file), "fixture");
    }
    return directory;
  }
  const native = resvgPlatformPackage(platform, arch);
  pkg("@resvg", "resvg-js", "2.6.2", ["index.js"]);
  pkg("@resvg", native.name, "2.6.2", [native.binary]);
  pkg("@1password", "sdk", "0.5.0", ["dist/sdk.js"], { "@1password/sdk-core": "0.5.0" });
  pkg("@1password", "sdk-core", "0.5.0", ["nodejs/core.js", "nodejs/core_bg.wasm"]);
  pkg("@duckdb", "node-api", "1.5.6-r.1", ["lib/index.js"]);
  return { root, native };
}
const stage = root => stageDuckdb({ root, targets: [{ platform: "linux", arch: "x64" }], sign: false, log: null });

describe("native resources without built-in Data", () => {
  it("stages only rendering and credentials, replacing stale DuckDB assets", async () => {
    const { root } = fixture();
    const stale = path.join(root, "dist-native/duckdb/linux-x64/node_modules/@duckdb");
    fs.mkdirSync(stale, { recursive: true });
    const [tree] = await stage(root);
    expect(fs.readdirSync(path.join(tree, "node_modules")).sort()).toEqual(["@1password", "@resvg"]);
    await verifyDuckdbTree(tree, "linux", "x64", "2.6.2", "0.5.0");
    fs.mkdirSync(path.join(tree, "node_modules/@duckdb"));
    await expect(verifyDuckdbTree(tree, "linux", "x64")).rejects.toThrow(/Removed DuckDB/);
  });
  it("fails closed without rendering or the 1Password WebAssembly core", async () => {
    const { root, native } = fixture();
    const [tree] = await stage(root);
    const binary = path.join(tree, "node_modules/@resvg", native.name, native.binary);
    fs.renameSync(binary, `${binary}.bak`);
    await expect(verifyDuckdbTree(tree, "linux", "x64")).rejects.toThrow(/missing/);
    fs.symlinkSync(`${binary}.bak`, binary);
    await expect(verifyDuckdbTree(tree, "linux", "x64")).rejects.toThrow(/regular file/);
    fs.unlinkSync(binary);
    fs.renameSync(`${binary}.bak`, binary);
    fs.unlinkSync(path.join(tree, "node_modules/@1password/sdk-core/nodejs/core_bg.wasm"));
    await expect(verifyDuckdbTree(tree, "linux", "x64")).rejects.toThrow(/core_bg.wasm/);
  });
  it("rejects mismatched SDK/core and rendering versions", async () => {
    const { root } = fixture();
    const [tree] = await stage(root);
    await expect(verifyDuckdbTree(tree, "linux", "x64", "9.0.0")).rejects.toThrow(/pins 9.0.0/);
    await expect(verifyDuckdbTree(tree, "linux", "x64", "2.6.2", "9.0.0")).rejects.toThrow(/pins 9.0.0/);
    fs.writeFileSync(path.join(root, "node_modules/@1password/sdk-core/package.json"), JSON.stringify({ version: "0.4.0" }));
    await expect(stage(root)).rejects.toThrow(/sdk needs 0.5.0/);
  });
  it("requires exact retained dependency pins", () => {
    const { root } = fixture();
    expect(pinnedResvgVersion(root)).toBe("2.6.2");
    expect(pinnedOnePasswordVersion(root)).toBe("0.5.0");
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ dependencies: { "@resvg/resvg-js": "^2.6.2", "@1password/sdk": "^0.5.0" } }));
    expect(() => pinnedResvgVersion(root)).toThrow(/exact/);
    expect(() => pinnedOnePasswordVersion(root)).toThrow(/exact/);
  });
  it("fetches only the missing target resvg package", async () => {
    const { root } = fixture();
    const packed = [];
    const pack = async (name, version, cache, scope) => {
      packed.push({ name, version, scope });
      const directory = path.join(cache, name);
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({ version }));
      fs.writeFileSync(path.join(directory, "resvgjs.win32-x64-msvc.node"), "fixture");
      return directory;
    };
    await stageDuckdb({ root, targets: [{ platform: "win32", arch: "x64" }], pack, sign: false, log: null });
    expect(packed).toEqual([{ name: "resvg-js-win32-x64-msvc", version: "2.6.2", scope: "@resvg" }]);
  });
  it("resolves pnpm's 1Password core beside the SDK", () => {
    const { root } = fixture();
    const modules = path.join(root, "node_modules");
    const store = path.join(modules, ".pnpm/sdk/node_modules/@1password");
    fs.mkdirSync(store, { recursive: true });
    for (const name of ["sdk", "sdk-core"]) fs.renameSync(path.join(modules, "@1password", name), path.join(store, name));
    fs.symlinkSync(path.join(store, "sdk"), path.join(modules, "@1password/sdk"), "dir");
    expect(installedPackage(modules, "sdk-core", "@1password", ["sdk"])).toBe(path.join(store, "sdk-core"));
  });
  it("stages target-specific native trees", () => {
    expect(targetsFor("darwin", {})).toEqual([{ platform: "darwin", arch: "arm64" }, { platform: "darwin", arch: "x64" }]);
    expect(targetsFor("linux", { OMB_DUCKDB_ARCH: "arm64" })).toEqual([{ platform: "linux", arch: "arm64" }]);
    expect(() => targetsFor("linux", { OMB_DUCKDB_ARCH: "amd64" })).toThrow(/OMB_DUCKDB_ARCH/);
    expect(targetsFor("win32", {})).toEqual([{ platform: "win32", arch: "x64" }]);
  });
});

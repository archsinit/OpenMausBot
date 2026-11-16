import { chmod, lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  executableTarget,
  verifyCloudflaredExecutable,
} from "./prepare-cloudflared.mjs";
import { fileURLToPath } from "node:url";
import { pinnedOnePasswordVersion, pinnedResvgVersion, verifyDuckdbTree } from "./prepare-duckdb.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function requireRealDirectory(directory, mode = 0o755) {
  const details = await lstat(directory);
  if (!details.isDirectory() || details.isSymbolicLink()) {
    throw new Error(`Package resource must be a real directory: ${directory}`);
  }
  if (mode !== undefined) await chmod(directory, mode);
}

async function requireRegularFile(file, mode) {
  const details = await lstat(file);
  if (!details.isFile() || details.isSymbolicLink()) {
    throw new Error(`Package resource must be a regular file: ${file}`);
  }
  if (mode !== undefined) await chmod(file, mode);
}

async function validateCloudflared(resources, platform, required) {
  const root = path.join(resources, "cloudflared");
  try {
    await lstat(root);
  } catch (error) {
    // Unit fixtures for the older CUA-only hook do not carry every packaged
    // resource. A real electron-builder context must fail closed because its
    // copier only warns when an extraResources `from` path is missing.
    if (error?.code === "ENOENT" && !required) return;
    throw error;
  }

  const unixMode = platform === "win32" ? undefined : 0o755;
  await requireRealDirectory(root, unixMode);
  const executable = path.join(root, platform === "win32" ? "cloudflared.exe" : "cloudflared");
  if (JSON.stringify(await readdir(root)) !== JSON.stringify([path.basename(executable)])) {
    throw new Error(`Unexpected entries in packaged cloudflared resource: ${root}`);
  }
  await requireRegularFile(executable, unixMode);
  const target = executableTarget(await readFile(executable));
  const allowed = {
    darwin: new Set(["darwin-arm64", "darwin-x64"]),
    linux: new Set(["linux-x64"]),
    win32: new Set(["win32-x64"]),
  }[platform];
  if (!allowed?.has(target)) {
    throw new Error(`Packaged ${platform} app contains the wrong cloudflared target: ${target}`);
  }
  verifyCloudflaredExecutable(executable, target);

  const licenses = path.join(resources, "licenses");
  await requireRealDirectory(licenses, unixMode);
  await requireRegularFile(
    path.join(licenses, "cloudflared-LICENSE.txt"),
    platform === "win32" ? undefined : 0o644,
  );
  await requireRegularFile(
    path.join(licenses, "cloudflared-README.md"),
    platform === "win32" ? undefined : 0o644,
  );
}

async function validateDuckdb(resources, platform, arch, required) {
  const duckdb = path.join(resources, "duckdb");
  const present = await lstat(duckdb).then(() => true, (error) => {
    if (error?.code === "ENOENT") return false;
    throw error;
  });
  // Unit fixtures carry only the resources they test; a real build fails
  // closed because electron-builder only warns about a missing `from`.
  if (!present && !required) return;
  if (!arch) throw new Error(`Unsupported native resource architecture: ${arch}`);
  await requireRealDirectory(duckdb, platform === "win32" ? undefined : 0o755);
  await verifyDuckdbTree(duckdb, platform, arch, pinnedResvgVersion(root), pinnedOnePasswordVersion(root));
}

// electron-builder normalizes copied resource directories to 0775. That is
// unsafe for a root-owned executable path after DEB/AppImage installation, so
// repair and revalidate the exact tree after resources are copied and before
// either artifact target is assembled.
export default async function afterPack(context) {
  const resources = context.packager?.getResourcesDir?.(context.appOutDir) ?? (
    context.electronPlatformName === "darwin"
      ? path.join(context.appOutDir, "OpenMausBot.app", "Contents", "Resources")
      : path.join(context.appOutDir, "resources")
  );
  await validateCloudflared(resources, context.electronPlatformName, Boolean(context.packager));
  for (const name of ["browser-engine", "cua-linux-x64", "cua-driver", "cua-driver.exe", "cua-driver-background.exe", "cua-sdk", "android-platform-tools", "skills/phone-harness", "skills/data-dashboards", "server/drivers/phone-proxy.js", "server/server/drivers/phone-proxy.js", "server/data", "server/server/data"]) {
    const present = await lstat(path.join(resources, name)).then(() => true, (error) => {
      if (error?.code === "ENOENT") return false;
      throw error;
    });
    if (present) throw new Error(`Removed automation resource in package: ${name}`);
  }
  const arch = { 1: "x64", 3: "arm64" }[context.arch];
  await validateDuckdb(resources, context.electronPlatformName, arch, Boolean(context.packager));
}

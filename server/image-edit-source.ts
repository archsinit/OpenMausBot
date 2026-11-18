import { constants } from "node:fs";
import { open, readlink, realpath, stat } from "node:fs/promises";
import { extname } from "node:path";
import { IMAGE_MAX_BYTES } from "./attachments.ts";
import type { ImageInput } from "./image-generation.ts";
import { botFileSource, canonicalRoots, containedBy, PageBundleError, type BotFolders } from "./pages/bundle.ts";
import { inSecretFolder } from "./secret-folder.ts";

const EDIT_IMAGE_TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

/** A PNG, JPEG or WebP in the bot's own folders, or a sentence saying what is wrong with the path. */
export async function readEditImage(file: string, folders: BotFolders): Promise<ImageInput | string> {
  const denied = "Only files in your working folder can be read. Save it there first.";
  const missing = `Nothing was found at ${file.slice(0, 200)}.`;
  const oversized = `${file.slice(0, 200)} is over ${IMAGE_MAX_BYTES / 1024 / 1024} MB. Make it smaller first.`;
  try {
    const snapshot = await folders();
    const roots = await canonicalRoots(snapshot.vmWorkspace ? [snapshot.vmWorkspace, ...snapshot.roots] : snapshot.roots);
    const target = await botFileSource(file, async () => snapshot);
    const mime = EDIT_IMAGE_TYPES[extname(target).toLowerCase()];
    if (!mime) return `${file.slice(0, 200)} is not a PNG, JPEG or WebP image.`;
    const inside = (path: string | null): path is string => path !== null && roots.some((root) => containedBy(root, path)) && !inSecretFolder(path);
    const handle = await open(target, constants.O_RDONLY | constants.O_NONBLOCK);
    try {
      // Check the opened object, not the pathname an attacker can replace between resolution and open.
      const kernel = await readlink(`/proc/self/fd/${handle.fd}`).catch(() => null);
      if (process.platform === "linux" || kernel !== null) {
        if (!inside(kernel)) return denied;
      } else {
        const [opened, now] = await Promise.all([handle.stat({ bigint: true }), realpath(target).catch(() => null)]);
        if (!inside(now)) return denied;
        const there = await stat(now, { bigint: true });
        if (there.dev !== opened.dev || there.ino !== opened.ino) return denied;
      }
      const info = await handle.stat();
      if (!info.isFile()) return "An image must be a file, not a folder.";
      if (info.size > IMAGE_MAX_BYTES) return oversized;
      // Bound the actual read too: a regular file can grow after fstat.
      const chunks: Buffer[] = [];
      let total = 0;
      while (total <= IMAGE_MAX_BYTES) {
        const chunk = Buffer.alloc(Math.min(64 * 1024, IMAGE_MAX_BYTES + 1 - total));
        const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
        if (!bytesRead) return { bytes: Buffer.concat(chunks, total), mime };
        total += bytesRead;
        if (total > IMAGE_MAX_BYTES) return oversized;
        chunks.push(chunk.subarray(0, bytesRead));
      }
      return oversized;
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error instanceof PageBundleError) return error.status === 403 ? denied : missing;
    if (["ENOENT", "ENOTDIR", "ELOOP", "EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) return missing;
    throw error;
  }
}

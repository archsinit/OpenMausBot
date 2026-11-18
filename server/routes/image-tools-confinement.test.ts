import { mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, symlinkSync, truncateSync, unlinkSync, writeFileSync } from "node:fs";
import { open } from "node:fs/promises";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IMAGE_MAX_BYTES } from "../attachments.ts";
import { readEditImage } from "../image-edit-source.ts";
import { createImageToolRoutes } from "./image-tools.ts";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, open: vi.fn(actual.open) };
});

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const bases: string[] = [];
afterEach(() => {
  vi.mocked(open).mockClear();
  for (const base of bases.splice(0)) rmSync(base, { recursive: true, force: true });
});

function fixture() {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "omb-image-confinement-")));
  bases.push(base);
  const root = join(base, "root"), outside = join(base, "outside"), folder = join(root, "images");
  mkdirSync(folder, { recursive: true });
  mkdirSync(outside);
  for (const name of ["image.png", "markup.png"]) {
    writeFileSync(join(folder, name), PNG);
    writeFileSync(join(outside, name), "OUTSIDE-SENTINEL");
  }
  const fetchImpl = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ data: [{ b64_json: PNG.toString("base64") }] })));
  const park = vi.fn();
  const routes = createImageToolRoutes({
    config: () => ({ imageGen: { key: "synthetic", primary: { provider: "openai", model: "gpt-image-2.6-sunburst" } } }),
    dataDir: base, fetchImpl, liveTurn: () => "turn", key: () => "thread:turn", images: () => 0, park,
  });
  const folders = async () => ({ roots: [root], vmWorkspace: null });
  const call = async () => {
    let answer: { status: number; body: unknown } | undefined;
    await routes.internal({
      method: "POST", path: "/api/internal/images/edit", res: new ServerResponse(new IncomingMessage(new Socket())),
      json: (_res, status, body) => { answer = { status, body }; },
      readBody: async () => ({ prompt: "owl", image: join(folder, "image.png"), markup: join(folder, "markup.png") }),
      folders, threadId: "thread", requireActive: () => {}, personTurn: true,
    });
    return answer!;
  };
  return { base, root, outside, folder, folders, fetchImpl, park, call };
}

function atOpen(target: string, hook: (handle: Awaited<ReturnType<typeof open>> | null) => void, after = false) {
  const opener = vi.mocked(open), actual = opener.getMockImplementation()!;
  opener.mockImplementation((async (...args: Parameters<typeof actual>) => {
    if (args[0] !== target) return actual(...args);
    opener.mockImplementation(actual);
    if (!after) hook(null);
    const handle = await actual(...args);
    if (after) hook(handle);
    return handle;
  }) as typeof actual);
}

describe("edit_image opened-file confinement", () => {
  it("sends valid image and transparent markup bytes to the fake provider", async () => {
    const f = fixture();
    expect(await f.call()).toEqual({ status: 201, body: { text: expect.any(String) } });
    const body = f.fetchImpl.mock.calls[0]![1]!.body as FormData;
    for (const field of ["image", "markup"]) {
      expect(Buffer.from(await (body.get(field) as Blob).arrayBuffer())).toEqual(PNG);
    }
    expect(f.park).toHaveBeenCalledOnce();
  });

  for (const input of ["image", "markup"]) {
    for (const swap of ["file", "ancestor", "root"]) {
      it(`refuses an outside ${input} after a ${swap} symlink swap before open`, async () => {
        const f = fixture(), target = join(f.folder, `${input}.png`);
        atOpen(target, () => {
          const path = swap === "file" ? target : swap === "root" ? f.root : f.folder;
          renameSync(path, `${path}-moved`);
          if (swap === "root") {
            mkdirSync(join(f.outside, "images"));
            writeFileSync(join(f.outside, "images", `${input}.png`), "OUTSIDE-SENTINEL");
          }
          symlinkSync(swap === "file" ? join(f.outside, `${input}.png`) : f.outside, path);
        });
        expect(await f.call()).toEqual({ status: 400, body: { error: expect.stringContaining("Only files in your working folder") } });
        expect(f.fetchImpl).not.toHaveBeenCalled();
        expect(f.park).not.toHaveBeenCalled();
      });
    }

    it.skipIf(process.platform !== "linux")(`refuses an outside ${input} even when its ancestor is restored after open`, async () => {
      const f = fixture(), target = join(f.folder, `${input}.png`), moved = `${f.folder}-moved`;
      const opener = vi.mocked(open), actual = opener.getMockImplementation()!;
      opener.mockImplementation((async (...args: Parameters<typeof actual>) => {
        if (args[0] !== target) return actual(...args);
        opener.mockImplementation(actual);
        renameSync(f.folder, moved);
        symlinkSync(f.outside, f.folder);
        const handle = await actual(...args);
        unlinkSync(f.folder);
        renameSync(moved, f.folder);
        return handle;
      }) as typeof actual);
      expect(await f.call()).toEqual({ status: 400, body: { error: expect.stringContaining("Only files in your working folder") } });
      expect(f.fetchImpl).not.toHaveBeenCalled();
    });

    it(`refuses an oversized ${input} replacement between resolution and open`, async () => {
      const f = fixture(), target = join(f.folder, `${input}.png`);
      atOpen(target, () => {
        unlinkSync(target);
        writeFileSync(target, PNG);
        truncateSync(target, IMAGE_MAX_BYTES + 1);
      });
      expect(await f.call()).toEqual({ status: 400, body: { error: expect.stringContaining("Make it smaller") } });
      expect(f.fetchImpl).not.toHaveBeenCalled();
    });

    it(`bounds ${input} growth after fstat and closes the descriptor`, async () => {
      const f = fixture(), target = join(f.folder, `${input}.png`);
      let closed: ReturnType<typeof vi.spyOn> | undefined;
      atOpen(target, (handle) => {
        const actualRead = handle!.read.bind(handle!);
        vi.spyOn(handle!, "read").mockImplementationOnce((...args: Parameters<typeof actualRead>) => {
          truncateSync(target, IMAGE_MAX_BYTES + 1);
          return actualRead(...args);
        });
        closed = vi.spyOn(handle!, "close");
      }, true);
      expect(await f.call()).toEqual({ status: 400, body: { error: expect.stringContaining("Make it smaller") } });
      expect(f.fetchImpl).not.toHaveBeenCalled();
      expect(closed).toHaveBeenCalledOnce();
    });
  }

  it.each(["png", "jpg", "jpeg", "webp"])("preserves supported .%s files and in-root symlinks", async (extension) => {
    const f = fixture(), target = join(f.folder, `photo.${extension}`), link = join(f.root, "alias.png");
    writeFileSync(target, PNG);
    symlinkSync(target, link);
    expect(await readEditImage(link, f.folders)).toEqual({ bytes: PNG, mime: extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg" });
  });

  it("reads the confined opened inode rather than a pathname replaced after open", async () => {
    const f = fixture(), target = join(f.folder, "image.png");
    atOpen(target, () => {
      renameSync(target, `${target}-moved`);
      symlinkSync(join(f.outside, "image.png"), target);
    }, true);
    expect(await readEditImage(target, f.folders)).toEqual({ bytes: PNG, mime: "image/png" });
  });

  it("keeps outside, secret, missing, unsupported and non-file sources refused", async () => {
    const f = fixture();
    expect(await readEditImage(join(f.outside, "image.png"), f.folders)).toContain("Only files in your working folder");
    expect(await readEditImage("missing.png", f.folders)).toContain("Nothing was found");
    const unsupported = join(f.root, "notes.txt");
    writeFileSync(unsupported, "notes");
    expect(await readEditImage(unsupported, f.folders)).toContain("not a PNG, JPEG or WebP");
    const directory = join(f.root, "directory.png");
    mkdirSync(directory);
    expect(await readEditImage(directory, f.folders)).toContain("not a folder");
    const secret = join(f.root, ".openmausbot-secrets");
    mkdirSync(secret);
    writeFileSync(join(secret, "image.png"), PNG);
    const target = join(f.folder, "image.png");
    atOpen(target, () => {
      unlinkSync(target);
      symlinkSync(join(secret, "image.png"), target);
    });
    expect(await readEditImage(target, f.folders)).toContain("Only files in your working folder");
  });

  it("preserves Local VM workspace mapping", async () => {
    const f = fixture();
    const { VM_WORKSPACE_GUEST } = await import("../container-computer.ts");
    expect(await readEditImage(`${VM_WORKSPACE_GUEST}/images/image.png`, async () => ({ roots: [], vmWorkspace: f.root }))).toEqual({ bytes: PNG, mime: "image/png" });
  });
});

import { posix, win32 } from "node:path";

export const DEVTOOLS_FILE = "DevToolsActivePort";
export const MAX_HEAD = 16 * 1024;
const BROWSER_PATH = /^\/devtools\/browser(?:[/?].*)?$/;
const PAGE_PATH = /^\/devtools\/page\/[A-Za-z0-9-]+$/;
const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

/** Chrome's own profile folders, in the order agent-browser looks; none without the folder they live in, since a relative
 * path would be read from wherever the app was started. */
export function chromeDataDirs({ platform, home = "", localAppData = "" }) {
  if (platform === "win32") return localAppData ? ["Google/Chrome/User Data", "Google/Chrome SxS/User Data", "BraveSoftware/Brave-Browser/User Data"].map((dir) => win32.join(localAppData, dir)) : [];
  if (!home) return [];
  if (platform === "darwin") return ["Google/Chrome", "Google/Chrome Canary", "BraveSoftware/Brave-Browser"].map((dir) => posix.join(home, "Library/Application Support", dir));
  return ["google-chrome", "google-chrome-unstable", "BraveSoftware/Brave-Browser"].map((dir) => posix.join(home, ".config", dir));
}

/** Chrome's DevToolsActivePort file: the port, then its `/devtools/browser/<id>` path. Anything else is null. */
export function parseDevtoolsActivePort(text) {
  const [first, second] = String(text).split(/\r?\n/);
  if (!/^\d{1,5}$/.test(first ?? "")) return null;
  const port = Number(first);
  if (port < 1 || port > 65535 || !/^\/devtools\/browser\/[A-Za-z0-9-]+$/.test(second ?? "")) return null;
  return { port, path: second };
}

// A bare CR or LF would let one line smuggle in another header; HTAB is the only control character a header may hold.
function hasControlChar(text) {
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if ((code < 0x20 && code !== 0x09) || code === 0x7f) return true;
  }
  return false;
}

/**
 * The request head (request line and headers, no final blank line) as Chrome should see it, or null to refuse. Only a
 * WebSocket upgrade to the browser or a page passes. Chrome answers 404 to a browser path that isn't its own, so that
 * path becomes Chrome's; Host is Chrome's and Origin goes, or Chrome refuses a connection that did not come from a page.
 */
export function rewriteHandshake(head, target) {
  const [requestLine, ...headers] = head.split("\r\n");
  const request = /^GET (\S+) HTTP\/1\.1$/.exec(requestLine);
  if (!request) return null;
  let path = request[1];
  if (BROWSER_PATH.test(path)) path = target.path;
  else if (!PAGE_PATH.test(path)) return null;
  const kept = [];
  let upgrade = false;
  let connection = false;
  let host = false;
  if (hasControlChar(head.replaceAll("\r\n", ""))) return null;
  for (const line of headers) {
    const colon = line.indexOf(":");
    const name = colon > 0 ? line.slice(0, colon) : "";
    if (!HEADER_NAME.test(name)) return null;
    const key = name.toLowerCase();
    if (key === "origin") continue;
    if (key === "upgrade" && line.slice(colon + 1).trim().toLowerCase() === "websocket") upgrade = true;
    if (key === "connection" && line.slice(colon + 1).split(",").some((token) => token.trim().toLowerCase() === "upgrade")) connection = true;
    if (key === "host") { if (!host) kept.push(`Host: 127.0.0.1:${target.port}`); host = true; continue; }
    kept.push(line);
  }
  if (!upgrade || !connection) return null;
  if (!host) kept.unshift(`Host: 127.0.0.1:${target.port}`);
  return `GET ${path} HTTP/1.1\r\n${kept.join("\r\n")}\r\n\r\n`;
}

export function createChromeDoor() {
  return { async open() { return { refused: "unsupported" }; } };
}

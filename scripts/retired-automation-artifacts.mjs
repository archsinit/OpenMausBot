import { rmSync } from "node:fs";
import { join } from "node:path";

export const RETIRED_AUTOMATION_ARTIFACTS = [
  "local-computer.js",
  "local-computer-proxy.js",
  "container-mcp.js",
  "vps-container-mcp.js",
  "drivers/dweb-proxy.js",
  "drivers/phone-proxy.js",
  "data",
  "meetings/meetbot.js",
];

export function removeAutomationArtifacts(directory) {
  for (const prefix of ["", "server"]) {
    for (const name of RETIRED_AUTOMATION_ARTIFACTS) {
      rmSync(join(directory, prefix, name), { recursive: true, force: true });
    }
  }
}

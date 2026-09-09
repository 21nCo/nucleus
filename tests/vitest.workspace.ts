import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceDir = path.dirname(fileURLToPath(import.meta.url));

export default [
  path.join(workspaceDir, "projects/tooling.vitest.config.ts"),
  path.join(workspaceDir, "projects/shared.vitest.config.ts"),
  path.join(workspaceDir, "projects/client.vitest.config.ts"),
  path.join(workspaceDir, "projects/integration.vitest.config.ts")
];

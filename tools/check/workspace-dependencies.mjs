import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

/** Checks resolved source imports against declarations in their owning workspaces. */
export function checkWorkspaceDependencies(edges, externalImports = []) {
  const workspacePatterns = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8")
  ).workspaces.map(
    (pattern) =>
      new RegExp(
        `^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+")}$`
      )
  );
  const manifests = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" }
  )
    .split("\0")
    .filter(
      (file) =>
        file.endsWith("/package.json") &&
        !file.includes("node_modules/") &&
        fs.existsSync(path.join(root, file))
    )
    .map((file) => ({
      directory: path.posix.dirname(file),
      ...JSON.parse(fs.readFileSync(path.join(root, file), "utf8"))
    }))
    .filter(
      (manifest) =>
        manifest.name &&
        workspacePatterns.some((pattern) => pattern.test(manifest.directory))
    )
    .sort((a, b) => b.directory.length - a.directory.length);
  const owner = (file) =>
    manifests.find((manifest) => file.startsWith(`${manifest.directory}/`));
  const failures = new Map();
  for (const edge of edges) {
    if (
      /\.(test|spec|stories)\./.test(edge.from) ||
      edge.from.includes("/tests/")
    )
      continue;
    const source = owner(edge.from);
    const target = owner(edge.to);
    if (!source || !target || source.name === target.name) continue;
    const declared = {
      ...source.dependencies,
      ...source.devDependencies,
      ...source.peerDependencies,
      ...source.optionalDependencies
    };
    if (!declared[target.name])
      failures.set(`${source.name}:${target.name}`, {
        ...edge,
        reason: `Undeclared workspace dependency: ${source.name} -> ${target.name}`
      });
  }
  for (const edge of externalImports) {
    if (
      /\.(test|spec|stories)\./.test(edge.from) ||
      edge.from.includes("/tests/") ||
      edge.to.startsWith(".") ||
      edge.to.startsWith("$") ||
      edge.to.startsWith("/") ||
      edge.to.includes(":") ||
      builtinModules.includes(edge.to)
    )
      continue;
    const source = owner(edge.from);
    if (!source) continue;
    const name = edge.to.startsWith("@")
      ? edge.to.split("/").slice(0, 2).join("/")
      : edge.to.split("/")[0];
    const declared = {
      ...source.dependencies,
      ...source.devDependencies,
      ...source.peerDependencies,
      ...source.optionalDependencies
    };
    if (!declared[name])
      failures.set(`${source.name}:${name}`, {
        ...edge,
        reason: `Undeclared external dependency: ${source.name} -> ${name}`
      });
  }
  return [...failures.values()];
}

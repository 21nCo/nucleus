import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const inventory = JSON.parse(
  fs.readFileSync(
    path.join(root, "docs/architecture/type-ownership-inventory.json"),
    "utf8"
  )
);
const printer = ts.createPrinter({ removeComments: true });
const failures = [];
let enums = 0;

/** Collects runtime enums without comments or formatting differences. */
function declarations(file, text) {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const result = new Map();
  const visit = (node) => {
    if (ts.isEnumDeclaration(node))
      result.set(
        node.name.text,
        printer.printNode(ts.EmitHint.Unspecified, node, source)
      );
    ts.forEachChild(node, visit);
  };
  visit(source);
  return result;
}

for (const module of inventory.modules) {
  const candidates = new Map();
  for (const destination of module.destinations) {
    const file = path.join(root, destination);
    if (!fs.existsSync(file)) {
      failures.push(`Missing destination: ${destination}`);
      continue;
    }
    for (const [name, declaration] of declarations(
      destination,
      fs.readFileSync(file, "utf8")
    ))
      candidates.set(name, declaration);
  }
  if (module.path.endsWith(".svelte")) continue;
  const original = execFileSync(
    "git",
    ["show", `${inventory.baseline}:${module.path}`],
    { cwd: root, encoding: "utf8" }
  );
  for (const [name, declaration] of declarations(module.path, original)) {
    enums++;
    if (candidates.get(name) !== declaration)
      failures.push(`Runtime enum changed: ${module.path}:${name}`);
  }
}

for (const file of [
  "package.json",
  "package-lock.json",
  "tools/alias-map.json"
]) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  if (/@21n\/(types|shared-types)"|"(?:client|shared)\/types"/.test(text))
    failures.push(`Retired package in ${file}`);
}
for (const failure of failures) console.error(failure);
console.log(
  `Type ownership: ${inventory.modules.length} module dispositions, ${enums} unchanged runtime enums, ${failures.length} failures.`
);
process.exitCode = failures.length ? 1 : 0;

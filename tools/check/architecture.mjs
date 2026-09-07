import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const aliases = Object.entries(
  JSON.parse(fs.readFileSync(path.join(root, "tools/alias-map.json"), "utf8"))
).sort((a, b) => b[0].length - a[0].length);
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8" }
)
  .split("\0")
  .filter(
    (file) =>
      /\.(?:[cm]?[jt]sx?|svelte)$/.test(file) &&
      fs.existsSync(path.join(root, file))
  );
const sourceFiles = new Set(files);
const edges = [];
const retiredImports = [];
const retiredApplicationPaths = new Set(
  JSON.parse(
    fs.readFileSync(
      path.join(root, "tools/check/retired-application-paths.json"),
      "utf8"
    )
  ).map((file) => file.replace(/\.(ts|svelte)$/, ""))
);

/** Resolves aliases and relative source imports before applying ownership rules. */
function resolveImport(specifier, importer) {
  let target;
  if (specifier.startsWith("."))
    target = path.posix.normalize(
      path.posix.join(path.posix.dirname(importer), specifier)
    );
  else if (specifier.startsWith("$lib/")) target = specifier.slice(5);
  else {
    const alias = aliases.find(
      ([name]) => specifier === name || specifier.startsWith(`${name}/`)
    );
    if (alias) target = alias[1] + specifier.slice(alias[0].length);
  }
  if (!target) return;
  return (
    [
      target,
      `${target}.ts`,
      `${target}.svelte`,
      `${target}.js`,
      `${target}/index.ts`,
      target.replace(/\.js$/, ".ts")
    ].find((candidate) => sourceFiles.has(candidate)) ?? target
  );
}

for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const scripts = file.endsWith(".svelte")
    ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(
        (match) => match[1]
      )
    : [text];
  for (const script of scripts) {
    const source = ts.createSourceFile(
      file,
      script,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const visit = (node) => {
      let specifier;
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        specifier = node.moduleSpecifier.text;
      else if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      )
        specifier = node.argument.literal.text;
      else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          /^(require|vi\.(mock|doMock|importActual|importMock))$/.test(
            node.expression.getText(source)
          )) &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        specifier = node.arguments[0].text;
      if (specifier) {
        if (
          /^@21n\/(types|shared-types)(\/|$)/.test(specifier) ||
          /(?:^|\/)client\/types(?:\/|$)|(?:^|\/)shared\/types(?:\/|$)/.test(
            specifier
          )
        )
          retiredImports.push({
            from: file,
            to: specifier,
            reason: "Retired type package"
          });
        const target = resolveImport(specifier, file);
        if (
          target &&
          retiredApplicationPaths.has(target.replace(/\.(ts|svelte)$/, ""))
        )
          retiredImports.push({
            from: file,
            to: target,
            reason: "Relocated reusable application module"
          });
        if (target) edges.push({ from: file, to: target });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}

const production = ({ from }) =>
  !/\.(test|spec)\./.test(from) && !from.includes("/tests/");
const violations = edges.filter(production).filter(({ from, to }) => {
  if (
    from.startsWith("client/stores/overlays/") &&
    /^client\/(application|features|products)\//.test(to)
  )
    return true;
  if (
    /^(schema|shared|services|server)\//.test(from) &&
    to.startsWith("client/")
  )
    return !(
      from === "server/common/relay/index.ts" &&
      to === "client/components/flux/flux.type"
    );
  if (from.startsWith("client/features/") && to.startsWith("client/products/"))
    return true;
  if (
    from.startsWith("client/components/") &&
    /^client\/(features|products|application)\//.test(to)
  )
    return true;
  if (
    /^client\/(datafn|runtime)\//.test(from) &&
    /^client\/(features|products|application|components|stores|layout|elements|actions)\//.test(
      to
    )
  )
    return true;
  if (
    /^client\/stores\/resources\/(resource\.actions|bulk-editor|resource-action-host)\.ts$/.test(
      from
    ) &&
    (/^client\/(application|products)\//.test(to) ||
      (to.startsWith("client/features/") &&
        to !== "client/features/memory/linking/link.type.ts"))
  )
    return true;
  if (
    /^client\/(stores\/resources\/(resource-panel[^/]*|panelParam\.mixin|panelSwitcher\.mixin)\.ts|components\/records\/ResourcePanelSwitcher\.svelte)$/.test(
      from
    ) &&
    (/^client\/(application|features|products)\//.test(to) ||
      to === "client/stores/app.store.ts")
  )
    return true;
  if (
    from === "client/features/focus/composition.utils.ts" &&
    to === "client/features/focus/session.store.ts"
  )
    return true;
  return false;
});
violations.push(...retiredImports);
const productionGraph = new Map();
for (const { from, to } of edges.filter(production)) {
  if (!productionGraph.has(from)) productionGraph.set(from, []);
  productionGraph.get(from).push(to);
}
for (const root of productionGraph.keys()) {
  const isEmbedTransport = root.startsWith("client/runtime/embed/");
  if (!isEmbedTransport && !root.startsWith("client/stores/overlays/"))
    continue;
  const pending = [...productionGraph.get(root)];
  const visited = new Set();
  while (pending.length) {
    const target = pending.pop();
    if (visited.has(target)) continue;
    visited.add(target);
    if (
      isEmbedTransport
        ? target.startsWith("client/") && !target.startsWith("client/runtime/")
        : /^client\/(application|features|products)\//.test(target)
    )
      violations.push({
        from: root,
        to: target,
        reason: isEmbedTransport
          ? "Embed transport transitively depends on frontend implementation"
          : "Overlay state transitively depends on composition"
      });
    pending.push(...(productionGraph.get(target) ?? []));
  }
}
const contract = JSON.parse(
  fs.readFileSync(
    path.join(root, "tools/check/feature-entrypoints.json"),
    "utf8"
  )
);
for (const edge of edges.filter(production)) {
  const targetFeature = edge.to.match(/^client\/features\/([^/]+)\//)?.[1];
  if (
    !targetFeature ||
    edge.from.startsWith(`client/features/${targetFeature}/`)
  )
    continue;
  if (!contract.includes(edge.to))
    violations.push({ ...edge, reason: "Feature entry point is not declared" });
}
if (process.argv.includes("--graph"))
  console.log(JSON.stringify(edges, null, 2));
else {
  for (const edge of violations)
    console.error(
      `${edge.from} -> ${edge.to}${edge.reason ? `: ${edge.reason}` : ""}`
    );
  console.log(
    `Architecture: ${files.length} source files, ${edges.length} resolved imports, ${violations.length} violations.`
  );
}
process.exitCode = violations.length ? 1 : 0;

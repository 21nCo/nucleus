import path from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line n/no-extraneous-import
// @ts-expect-error FlatESLint is experimental in ESLint 8
import { FlatESLint } from "eslint/use-at-your-own-risk";
import { describe, expect, it } from "vitest";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
const configFile = path.join(repoRoot, "eslint.config.mjs");
const sampleFilePath = path.join(repoRoot, "client/actions/hover.action.ts");

const lint = async (code: string) => {
  const eslint = new FlatESLint({
    overrideConfigFile: configFile,
    cwd: repoRoot
  });

  return eslint.lintText(code, { filePath: sampleFilePath });
};

describe("alias-imports lint rule", () => {
  it("allows workspace alias imports", async () => {
    const [result] = await lint(
      "import Button from \"@nucleum/components/Button.svelte\";"
    );

    expect(result.messages).toHaveLength(0);
  });

  it("warns on $lib imports", async () => {
    const [result] = await lint(
      "import Button from \"$lib/client/components/Button.svelte\";"
    );

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.ruleId).toBe("tidigit/alias-imports");
    expect(result.messages[0]?.severity).toBe(1);
  });

  it("warns on relative parent imports", async () => {
    const [result] = await lint("import helper from \"../utils/helper.js\";");

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.ruleId).toBe("tidigit/alias-imports");
  });
});

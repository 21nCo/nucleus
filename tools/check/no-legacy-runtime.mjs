import { spawnSync } from "node:child_process";

const patterns = [
  "@nucleum/components/flux",
  "\\$lib/client/components/flux",
  "client/components/flux",
  "\\.\\./flux",
  "components/flux",
  "resourceStores",
  "kv\\.store",
  "ComponentBaseLayer",
  "DexiePersistence",
  "SignalDBPersistence",
  "flux\\."
];

const targets = ["client", "shared", "apps", "services"];
const result = spawnSync(
  "rg",
  ["-n", patterns.join("|"), ...targets],
  {
    cwd: process.cwd(),
    encoding: "utf8"
  }
);

if (result.status === 0) {
  process.stdout.write(result.stdout);
  process.stderr.write("Legacy web data runtime references found.\n");
  process.exit(1);
}

if (result.status && result.status > 1) {
  process.stderr.write(result.stderr);
  process.exit(result.status);
}

process.stdout.write("No legacy web data runtime references found.\n");

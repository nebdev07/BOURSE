import { spawn } from "node:child_process";
import { glob } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
process.env.BRVM_STORE_PATH = join(root, "data", "test-store.json");
process.env.PERSISTENCE_DRIVER = "file";
process.env.BRVM_DISABLE_PG = "1";

const files = [];
for await (const file of glob("tests/*.test.ts", { cwd: root })) {
  files.push(join(root, file));
}
files.sort();

if (files.length === 0) {
  console.error("Aucun fichier de test trouvé");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [
    "--experimental-strip-types",
    "--disable-warning=ExperimentalWarning",
    "--import",
    pathToFileURL(join(root, "scripts", "register-loader.mjs")).href,
    "--test",
    "--test-reporter=spec",
    ...files,
  ],
  { stdio: "inherit", cwd: root, env: process.env },
);

child.on("exit", (code) => process.exit(code ?? 1));

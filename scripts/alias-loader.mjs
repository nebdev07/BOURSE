import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const srcRoot = join(fileURLToPath(new URL("../src/", import.meta.url)));

function resolveTs(bare) {
  const candidates = [
    `${bare}.ts`,
    `${bare}.tsx`,
    join(bare, "index.ts"),
    bare,
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return `${bare}.ts`;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const absolute = resolveTs(join(srcRoot, specifier.slice(2)));
    return { shortCircuit: true, url: pathToFileURL(absolute).href };
  }
  return nextResolve(specifier, context);
}

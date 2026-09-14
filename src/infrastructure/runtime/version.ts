import { readFileSync } from "fs";
import { join } from "path";

let cached: string | null = null;

export function packageVersion(): string {
  if (cached) return cached;
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version?: string };
    cached = pkg.version ?? "0.0.0";
  } catch {
    cached = "0.0.0";
  }
  return cached;
}

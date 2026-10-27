// Effects are descriptions; running one is a side effect at the edge of the world.
// Only src/main.ts (and tests, through @effect/vitest) may execute effects.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const allowed = new Set(["src/main.ts"]);
const forbidden =
  /\b(Effect\.run\w*|Runtime\.run\w*|ManagedRuntime\.make|NodeRuntime\.runMain)\b/;

const files = readdirSync("src", { recursive: true, encoding: "utf8" })
  .map((file) => join("src", file))
  .filter(
    (file) =>
      file.endsWith(".ts") && !file.endsWith(".test.ts") && !allowed.has(file),
  );

const violations = files.flatMap((file) =>
  readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, index) =>
      forbidden.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : [],
    ),
);

if (violations.length > 0) {
  console.error(
    "Effects may only be run in src/main.ts:\n" + violations.join("\n"),
  );
  process.exit(1);
}
console.log(
  `✔ no effects run outside src/main.ts (${files.length} files checked)`,
);

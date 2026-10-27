// Architecture boundaries. See ARCHITECTURE.md for the reasoning behind each rule.
// Run with `pnpm lint:arch`.

// Any layer folder, inside a feature or inside shared.
const scope = "^src/(features/[^/]+|shared)"
const layer = (name) => `${scope}/${name}/`

// `effect` core modules only (Effect, Schema, Context, Option, ...).
// Subpath modules like effect/http, effect/sql live in nested dist folders and are adapters.
const effectCore = "/effect/dist/[^/]+\\.js$"

const tests = "\\.test\\.ts$"

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true }
    },

    // ---- Layer direction: domain <- application <- (api | infrastructure) <- app ----
    {
      name: "domain-is-innermost",
      comment: "domain may only import other domain code",
      severity: "error",
      from: { path: layer("domain") },
      to: { path: ["^src/(main\\.ts|app/)", layer("(application|infrastructure|api)")] }
    },
    {
      name: "application-knows-no-adapters",
      comment: "application defines ports; it never sees their implementations or HTTP",
      severity: "error",
      from: { path: layer("application") },
      to: { path: ["^src/(main\\.ts|app/)", layer("(infrastructure|api)")] }
    },
    {
      name: "api-knows-no-infrastructure",
      comment: "inbound adapters talk to application services, never to outbound adapters",
      severity: "error",
      from: { path: layer("api") },
      to: { path: ["^src/(main\\.ts|app/)", layer("infrastructure")] }
    },
    {
      name: "infrastructure-knows-no-api",
      severity: "error",
      from: { path: layer("infrastructure") },
      to: { path: ["^src/(main\\.ts|app/)", layer("api")] }
    },

    // ---- Purity of the core ----
    {
      name: "core-uses-effect-core-only",
      comment: "domain + application may only depend on `effect` core modules: no node:*, no effect/http, effect/sql, no other npm packages",
      severity: "error",
      from: { path: layer("(domain|application)"), pathNot: tests },
      to: {
        dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer", "npm-no-pkg", "npm-unknown", "core"],
        pathNot: effectCore
      }
    },
    {
      name: "platform-only-in-composition-root",
      comment: "@effect/platform-node is wired in src/app (and main.ts) only; code depends on abstract services",
      severity: "error",
      from: { path: "^src/", pathNot: ["^src/(main\\.ts|app/)", tests] },
      to: { path: "@effect/platform-node" }
    },

    // ---- Feature isolation ----
    {
      name: "features-are-isolated",
      comment: "another feature may only be reached through its index.ts",
      severity: "error",
      from: { path: "^src/features/([^/]+)/", pathNot: tests },
      to: { path: "^src/features/", pathNot: ["^src/features/$1/", "^src/features/[^/]+/index\\.ts$"] }
    },
    {
      name: "feature-index-exposes-core-only",
      comment: "a feature's index.ts re-exports domain + application, never adapters",
      severity: "error",
      from: { path: "^src/features/[^/]+/index\\.ts$" },
      to: { path: "^src/features/[^/]+/(infrastructure|api)/" }
    },
    {
      name: "shared-knows-no-features",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(features|app)/|^src/main\\.ts$" }
    },
    {
      name: "only-main-imports-app",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/(main\\.ts|app/)" },
      to: { path: "^src/(app/|main\\.ts$)" }
    },
    {
      name: "no-test-imports-in-production",
      severity: "error",
      from: { path: "^src/", pathNot: tests },
      to: { path: tests }
    }
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "types", "default"],
      extensions: [".ts", ".js", ".d.ts"]
    },
    reporterOptions: {
      text: { highlightFocused: true }
    }
  }
}

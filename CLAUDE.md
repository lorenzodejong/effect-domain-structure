# effect-playground

A learning project: the user is learning Effect v4 by building this app together with Claude.

## Working agreement

- **Architecture is strict.** Read `ARCHITECTURE.md` before adding or moving code. Every change must keep `pnpm check` green (typecheck, `lint:arch`, `lint:run`, tests). Never weaken a rule in `.dependency-cruiser.cjs` to make code fit; move the code instead, or discuss changing the rule with the user first.
- **Teach while building.** When introducing an Effect API for the first time, explain what it does and why it is used here. Prefer small vertical slices the user can follow over large drops of code.
- **Effect v4 only.** This is `effect@4.0.6`, not v3. APIs differ (`Context.Service` not `Context.Tag`; `effect/http-api` not `@effect/platform`; branded values built with `BookId.make(...)`). When unsure of an API, check the types in `node_modules/effect/dist/*.d.ts` rather than relying on memory.

## Commands

- `pnpm dev`: run the server with watch (PORT defaults to 3000). Docs at `/docs`, OpenAPI at `/openapi.json`.
- `pnpm check`: everything that must pass before a change is done.
- `pnpm test`, `pnpm typecheck`, `pnpm lint:arch`, `pnpm lint:run`.

## Tooling notes

- TypeScript is pinned to 6.x on purpose: dependency-cruiser does not support TypeScript 7 yet, and the `@effect/language-service` plugin needs the classic compiler API.
- No build step: Node 24 runs `.ts` files directly.

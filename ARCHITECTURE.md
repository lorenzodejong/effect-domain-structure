# Architecture

Feature-sliced hexagonal architecture on Effect v4 (`effect@4.0.6`).

Code is split two ways:

- **Vertically by feature** (`src/features/<feature>`): everything about one business capability lives together.
- **Horizontally by layer** inside each feature: `domain`, `application`, `api`, `infrastructure`.

Dependencies only point inward. `pnpm lint:arch` enforces every rule below; `pnpm check` runs it with the typecheck and tests.

```
src/
├── main.ts                      Edge of the world: the only place an Effect is run
├── app/                         Composition root: picks implementations, wires layers, config, server
│   ├── Api.ts                   Merges every feature's HTTP slice into one HttpApi
│   ├── AppConfig.ts             Config read from the environment
│   └── HttpLive.ts              Layer graph: handlers + adapters + Node HTTP server
├── shared/                      Shared kernel, same layer split as a feature
│   ├── domain/                  Value objects used by several features (Email, Money, ...)
│   ├── application/             Cross-cutting ports (e.g. IdGenerator)
│   ├── infrastructure/          Shared adapters (e.g. SqlClient layer, migrations)
│   └── api/                     HTTP plumbing shared by every feature slice (ApiId)
└── features/
    └── <feature>/
        ├── domain/              Entities, value objects, domain errors, pure business rules
        ├── application/         Ports (services the feature needs) + use cases
        ├── infrastructure/      Port implementations (SQL, files, external APIs, in-memory)
        ├── api/                 HTTP contract (HttpApiGroup) + handlers
        └── index.ts             Public surface for OTHER features: domain + application only
```

A feature only creates the layers it needs. `health` has just `api/`.

## Dependency direction

```
                 ┌──────────────── app ────────────────┐
                 │                                     │
                 ▼                                     ▼
               api ──────────┐            ┌─── infrastructure
                             ▼            ▼
                           application (ports + use cases)
                                  │
                                  ▼
                                domain
```

`api` and `infrastructure` are both adapters (inbound and outbound). They never see each other. Only `app` knows which infrastructure implements which port.

## Rules (enforced by `.dependency-cruiser.cjs`)

| Rule | Meaning |
|---|---|
| `domain-is-innermost` | `domain` imports only other `domain` code |
| `application-knows-no-adapters` | `application` never imports `api`, `infrastructure` or `app` |
| `api-knows-no-infrastructure` | handlers call application services, never repositories/adapters directly |
| `infrastructure-knows-no-api` | outbound adapters know nothing about HTTP |
| `core-uses-effect-core-only` | `domain` + `application` import only `effect` core modules: no `node:*`, no `effect/http`, `effect/sql`, `effect/http-api`, no other npm packages |
| `platform-only-in-composition-root` | `@effect/platform-node` only in `src/app` and `main.ts`; everything else depends on abstract services (`FileSystem`, `HttpClient`, ...) |
| `features-are-isolated` | feature A reaches feature B only through `features/B/index.ts` |
| `feature-index-exposes-core-only` | a feature's `index.ts` re-exports domain + application, never adapters |
| `shared-knows-no-features` | `shared` never imports a feature or `app` |
| `only-main-imports-app` | nothing imports `src/app` except `main.ts` |
| `no-circular` | no import cycles |
| `no-test-imports-in-production` | production code never imports `*.test.ts` |

Plus `pnpm lint:run`: `Effect.run*`, `NodeRuntime.runMain` and friends appear only in `src/main.ts` (tests run effects through `@effect/vitest`).

## What goes in each layer

### domain

The business language, with no I/O and no services.

- Entities / value objects: `Schema.Class`, `Schema.Struct`, branded ids (`Schema.String.pipe(Schema.brand("BookId"))`, constructed with `BookId.make(...)`).
- Domain errors: `Schema.TaggedError<Self>()("Tag", { ...fields })`. They know nothing about HTTP status codes.
- Business rules are plain functions, or `Effect<A, DomainError>` with **no requirements** (`R = never`).

### application

What the feature *does*, described against interfaces.

- **Ports**: services the feature needs but does not implement.
  ```ts
  export class BookRepository extends Context.Service<BookRepository, {
    readonly findById: (id: BookId) => Effect.Effect<Book, BookNotFound>
  }>()("app/books/BookRepository") {}
  ```
- **Use cases**: one service per feature (or per aggregate) whose methods are use cases.
  ```ts
  export class Books extends Context.Service<Books>()("app/books/Books", {
    make: Effect.gen(function*() {
      const repo = yield* BookRepository
      const get = Effect.fn("Books.get")(function*(id: BookId) { ... })
      return { get } as const
    })
  }) {
    static readonly layer = Layer.effect(this, this.make)
  }
  ```
- Methods use `Effect.fn("Service.method")` so every use case gets a tracing span.
- Expected failures are typed in the error channel; bugs are defects (`Effect.die`).

### infrastructure

Implementations of application ports.

- Exported as layers: `export const BookRepositorySql = Layer.effect(BookRepository, ...)`.
- May use `effect/sql`, `FileSystem`, `HttpClient`, `node:*`.
- Translates technical failures: map to a domain error when the business cares (row missing → `BookNotFound`), otherwise `Effect.orDie`.
- An in-memory implementation (`BookRepositoryMemory`) lives here too and is used by tests.

### api

The HTTP edge of the feature, in two files:

- `<Feature>Api.ts`: the contract. An `HttpApiGroup` plus a slice `HttpApi.make(ApiId).add(Group)`. No implementation, so a typed client can import it too.
- `<Feature>Http.ts`: handlers via `HttpApiBuilder.group(<Feature>Api, "group", ...)`. Handlers call application services and map domain errors to HTTP errors.

Why every feature builds its own `HttpApi.make(ApiId)` slice: in v4 the handler layer for group `"books"` is looked up by group identifier, and its type is keyed by `ApiId`. Sharing `ApiId` lets each feature implement its handlers without importing `src/app/Api.ts`, which would break `only-main-imports-app`.

### app (composition root)

The only code that knows the whole system.

- `Api.ts`: `HttpApi.make(ApiId).addHttpApi(FeatureApi)...`.
- `HttpLive.ts`: builds the layer graph, choosing implementations (`BookRepositorySql` vs `BookRepositoryMemory`) and providing platform layers (`NodeHttpServer`).
- `AppConfig.ts`: `Config` values. Features that need config declare it in their own layer; `app` only supplies the `ConfigProvider` when needed.

### main.ts

`NodeRuntime.runMain(Layer.launch(HttpLive))`. Nothing else.

## Cross-feature dependencies

When feature `loans` needs feature `books`:

1. `books/index.ts` re-exports what is public: domain types and an application service (e.g. `BookCatalog`).
2. `loans/application` imports from `../../books/index.ts` only.
3. `app` provides the `books` layers to the `loans` layers.

If two features need each other, the shared concept probably belongs in `shared/domain`, or the two features are one feature.

## Conventions

- **Files** are named after their main export, in PascalCase (`Book.ts`, `BookRepository.ts`).
- **Service keys**: `"app/<feature>/<Name>"`.
- **Layers**: production implementations are named by technology (`BookRepositorySql`); in-memory ones `...Memory`; a service with a default implementation exposes `static readonly layer`.
- **Imports** use explicit `.ts` extensions (Node 24 runs TypeScript directly; only erasable syntax is allowed: no `enum`, no parameter properties, no `namespace`).
- **Tests** sit next to the code as `*.test.ts` and use `@effect/vitest` (`it.effect`), with `...Memory` layers in place of real infrastructure.

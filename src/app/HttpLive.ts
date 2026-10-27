import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { createServer } from "node:http";
import { BooksHttpLive } from "../features/books/api/BooksHttp.ts";
import { HealthHttpLive } from "../features/health/api/HealthHttp.ts";
import { Api } from "./Api.ts";
import { AppConfig } from "./AppConfig.ts";
import { BooksLive } from "./BooksLive.ts";

// Handlers for every group in `Api`. A missing group shows up as an unmet
// requirement (Service<"app", "<group>">) when main.ts launches the app.
// Handlers need application services (Books), provided with their implementations.
const HandlersLive = Layer.mergeAll(HealthHttpLive, BooksHttpLive).pipe(
  Layer.provide(BooksLive),
);

const ApiLive = HttpApiBuilder.layer(Api, {
  openapiPath: "/openapi.json",
}).pipe(Layer.provide(HandlersLive));

const DocsLive = HttpApiScalar.layer(Api, { path: "/docs" });

const ServerLive = Layer.unwrap(
  Effect.gen(function* () {
    const { port } = yield* AppConfig;
    return NodeHttpServer.layer(createServer, { port });
  }),
);

export const HttpLive = HttpRouter.serve(
  Layer.mergeAll(ApiLive, DocsLive),
).pipe(Layer.provide(ServerLive));

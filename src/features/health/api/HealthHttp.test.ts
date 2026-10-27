import { assert, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { HttpServer } from "effect/http";
import { HttpApiTest } from "effect/http-api";
import { HealthApi } from "./HealthApi.ts";
import { HealthHttpLive } from "./HealthHttp.ts";

const TestLive = Layer.mergeAll(HealthHttpLive, HttpServer.layerServices);

it.effect("GET /health reports ok", () =>
  Effect.gen(function* () {
    const client = yield* HttpApiTest.groups(HealthApi, ["health"]);
    const result = yield* client.health.check();
    assert.strictEqual(result.status, "ok");
  }).pipe(Effect.scoped, Effect.provide(TestLive)),
);

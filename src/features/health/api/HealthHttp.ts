import { Clock, Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { HealthApi } from "./HealthApi.ts";

// The group builder runs once when the layer is built, so `startedAt` is
// captured at server start; each handler call reads the clock again.
export const HealthHttpLive = HttpApiBuilder.group(
  HealthApi,
  "health",
  (handlers) =>
    Effect.gen(function* () {
      const startedAt = yield* Clock.currentTimeMillis;

      return handlers.handle("check", () =>
        Clock.currentTimeMillis.pipe(
          Effect.map((now) => ({
            status: "ok" as const,
            uptimeMs: now - startedAt,
          })),
        ),
      );
    }),
);

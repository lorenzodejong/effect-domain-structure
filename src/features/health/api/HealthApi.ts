import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "effect/http-api";
import { ApiId } from "../../../shared/api/ApiId.ts";

// Contract only: what the endpoint accepts and returns. No implementation here,
// so this file could also be imported by a typed client.
export const HealthGroup = HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/health", {
    success: Schema.Struct({
      status: Schema.Literal("ok"),
      uptimeMs: Schema.Number,
    }),
  }),
);

export const HealthApi = HttpApi.make(ApiId).add(HealthGroup);

import { HttpApi } from "effect/http-api";
import { HealthApi } from "../features/health/api/HealthApi.ts";
import { ApiId } from "../shared/api/ApiId.ts";

// The full public HTTP surface: one slice per feature.
export const Api = HttpApi.make(ApiId).addHttpApi(HealthApi);

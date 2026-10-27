import { HttpApi } from "effect/http-api";
import { BooksApi } from "../features/books/api/BooksApi.ts";
import { HealthApi } from "../features/health/api/HealthApi.ts";
import { ApiId } from "../shared/api/ApiId.ts";

// The full public HTTP surface: one slice per feature.
export const Api = HttpApi.make(ApiId).addHttpApi(HealthApi).addHttpApi(BooksApi);

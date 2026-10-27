/**
 * Every feature declares its own HTTP slice with `HttpApi.make(ApiId)`.
 * Sharing the id lets the composition root merge the slices with
 * `HttpApi.addHttpApi` while each feature implements its own handlers,
 * without features ever importing `src/app`.
 */
export const ApiId = "app";

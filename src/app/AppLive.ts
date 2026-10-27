import { HttpLive } from "./HttpLive.ts"

// The whole application. Today that is the HTTP server; background workers
// or schedulers would be merged in here.
export const AppLive = HttpLive

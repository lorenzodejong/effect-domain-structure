import { Layer } from "effect"
import { BooksLive } from "./BooksLive.ts"
import { HttpLive } from "./HttpLive.ts"

// Books has no HTTP handlers yet, so it is launched next to the server.
// Once the books api exists, BooksLive moves into HttpLive's handler graph.
export const AppLive = Layer.mergeAll(HttpLive, BooksLive)

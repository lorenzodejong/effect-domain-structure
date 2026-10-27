import { Effect } from "effect"
import { HttpApiBuilder } from "effect/http-api"
import { Books } from "../application/Books.ts"
import { BooksApi } from "./BooksApi.ts"

// Handlers only translate HTTP <-> use cases. Params and payload arrive already
// decoded and validated by the contract; domain errors leave with the status
// codes declared in BooksApi. `yield* Books` puts Books in this layer's
// requirements, which src/app satisfies.
export const BooksHttpLive = HttpApiBuilder.group(BooksApi, "books", (handlers) =>
  Effect.gen(function*() {
    const books = yield* Books
    return handlers
      .handle("register", ({ payload }) => books.register(payload))
      .handle("list", () => books.list)
      .handle("get", ({ params }) => books.get(params.id))
      .handle("changeCopies", ({ params, payload }) => books.changeCopies(params.id, payload.delta))
  }))

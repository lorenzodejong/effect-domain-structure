import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { HttpServer } from "effect/http"
import { HttpApiTest } from "effect/http-api"
import { CryptoDeterministic } from "../../../shared/infrastructure/CryptoDeterministic.ts"
import { Books } from "../application/Books.ts"
import { BookId } from "../domain/BookId.ts"
import { Isbn } from "../domain/Isbn.ts"
import { BookRepositoryMemory } from "../infrastructure/BookRepositoryMemory.ts"
import { BooksApi } from "./BooksApi.ts"
import { BooksHttpLive } from "./BooksHttp.ts"

const TestLive = BooksHttpLive.pipe(
  Layer.provide(Books.layer),
  Layer.provide([BookRepositoryMemory, CryptoDeterministic]),
  Layer.merge(HttpServer.layerServices)
)

// The client is derived from the same contract as the server: payloads,
// responses and errors are typed and go through real JSON encoding/decoding.
const client = HttpApiTest.groups(BooksApi, ["books"])

// The typed client takes decoded values (a branded Isbn) and encodes them.
// Raw JSON with a hyphenated ISBN is exercised against the running server.
const payload = {
  isbn: Isbn.make("9780134685991"),
  title: "Effective Java",
  author: "Joshua Bloch",
  publishedYear: 2018,
  copies: 2
}

describe("Books HTTP", () => {
  it.effect("registers, lists and fetches a book", () =>
    Effect.gen(function*() {
      const { books } = yield* client
      const created = yield* books.register({ payload })
      assert.strictEqual(created.isbn, "9780134685991")

      const fetched = yield* books.get({ params: { id: created.id } })
      assert.deepStrictEqual(fetched, created)
      assert.lengthOf(yield* books.list(), 1)
    }).pipe(Effect.scoped, Effect.provide(TestLive)))

  it.effect("domain errors arrive as typed errors on the client", () =>
    Effect.gen(function*() {
      const { books } = yield* client
      const id = BookId.make("8d0c6a2e-4d0f-4f5e-9a51-6f1f3f2b9c11")
      const error = yield* books.get({ params: { id } }).pipe(Effect.flip)
      assert.strictEqual(error._tag, "BookNotFound")
    }).pipe(Effect.scoped, Effect.provide(TestLive)))
})

import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { CryptoDeterministic } from "../../../shared/infrastructure/CryptoDeterministic.ts"
import { BookId } from "../domain/BookId.ts"
import { Isbn } from "../domain/Isbn.ts"
import { BookRepositoryMemory } from "../infrastructure/BookRepositoryMemory.ts"
import { Books } from "./Books.ts"
import type { RegisterBook } from "./RegisterBook.ts"

// Same Books.layer as production, different implementations behind the ports.
// Effect.provide builds the layer per test, so every test gets an empty store.
const BooksTest = Books.layer.pipe(Layer.provide([BookRepositoryMemory, CryptoDeterministic]))

const effectiveJava: RegisterBook = {
  isbn: Isbn.make("9780134685991"),
  title: "Effective Java",
  author: "Joshua Bloch",
  publishedYear: 2018,
  copies: 2
}

describe("Books", () => {
  it.effect("register assigns an id and stores the book", () =>
    Effect.gen(function*() {
      const books = yield* Books
      const registered = yield* books.register(effectiveJava)
      const found = yield* books.get(registered.id)
      assert.deepStrictEqual(found, registered)
      assert.lengthOf(yield* books.list, 1)
    }).pipe(Effect.provide(BooksTest)))

  it.effect("register rejects a duplicate ISBN", () =>
    Effect.gen(function*() {
      const books = yield* Books
      yield* books.register(effectiveJava)
      const error = yield* books.register(effectiveJava).pipe(Effect.flip)
      assert.strictEqual(error._tag, "IsbnAlreadyRegistered")
    }).pipe(Effect.provide(BooksTest)))

  it.effect("get fails with BookNotFound for an unknown id", () =>
    Effect.gen(function*() {
      const books = yield* Books
      const id = BookId.make("8d0c6a2e-4d0f-4f5e-9a51-6f1f3f2b9c11")
      const error = yield* books.get(id).pipe(Effect.flip)
      assert.deepStrictEqual(error._tag, "BookNotFound")
    }).pipe(Effect.provide(BooksTest)))

  it.effect("changeCopies applies domain rules and persists the result", () =>
    Effect.gen(function*() {
      const books = yield* Books
      const { id } = yield* books.register(effectiveJava)

      assert.strictEqual((yield* books.changeCopies(id, 3)).copies, 5)
      assert.strictEqual((yield* books.changeCopies(id, -5)).copies, 0)

      const error = yield* books.changeCopies(id, -1).pipe(Effect.flip)
      assert.strictEqual(error._tag, "NotEnoughCopies")
      assert.strictEqual((yield* books.get(id)).copies, 0)
    }).pipe(Effect.provide(BooksTest)))

  it.effect("each test starts with an empty store", () =>
    Effect.gen(function*() {
      const books = yield* Books
      assert.lengthOf(yield* books.list, 0)
    }).pipe(Effect.provide(BooksTest)))
})

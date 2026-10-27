// Type-level tests: these assertions are checked by `pnpm typecheck`, not at runtime.
// They document how requirements flow through services and layers.
import { describe, expectTypeOf, it } from "@effect/vitest"
import { type Crypto, Effect, type Layer } from "effect"
import type { Book } from "../domain/Book.ts"
import type { BookNotFound, IsbnAlreadyRegistered } from "../domain/BookErrors.ts"
import { BookId } from "../domain/BookId.ts"
import type { BookRepository } from "./BookRepository.ts"
import { Books } from "./Books.ts"
import type { RegisterBook } from "./RegisterBook.ts"

const id = BookId.make("8d0c6a2e-4d0f-4f5e-9a51-6f1f3f2b9c11")

const program = Effect.gen(function*() {
  const books = yield* Books
  return yield* books.get(id)
})

describe("Books requirements", () => {
  it("the layer needs BookRepository and Crypto to build Books", () => {
    expectTypeOf(Books.layer).toEqualTypeOf<Layer.Layer<Books, never, BookRepository | Crypto.Crypto>>()
  })

  it("using Books puts Books in R, with typed success and error", () => {
    expectTypeOf(program).toEqualTypeOf<Effect.Effect<Book, BookNotFound, Books>>()
  })

  it("providing Books.layer swaps Books for its own unmet dependencies", () => {
    const provided = program.pipe(Effect.provide(Books.layer))
    expectTypeOf(provided).toEqualTypeOf<Effect.Effect<Book, BookNotFound, BookRepository | Crypto.Crypto>>()

    // Running requires R = never, so an unprovided program does not compile.
    // @ts-expect-error Type 'Crypto | BookRepository' is not assignable to type 'never'
    expectTypeOf(Effect.runPromise).toBeCallableWith(provided)
  })

  it("a plain string is not a BookId", () => {
    Effect.gen(function*() {
      const books = yield* Books
      // @ts-expect-error Argument of type 'string' is not assignable to parameter of type 'string & Brand<"BookId">'
      yield* books.get("8d0c6a2e-4d0f-4f5e-9a51-6f1f3f2b9c11")
    })
  })
})

describe("Books errors", () => {
  it("register fails only with domain errors (technical failures are defects)", () => {
    const register = Effect.gen(function*() {
      const books = yield* Books
      return yield* books.register({} as RegisterBook)
    })
    expectTypeOf<Effect.Error<typeof register>>().toEqualTypeOf<IsbnAlreadyRegistered>()
  })
})

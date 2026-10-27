import { Context, Crypto, Effect, Layer, Option } from "effect"
import { addCopies, Book, removeCopies } from "../domain/Book.ts"
import { BookNotFound } from "../domain/BookErrors.ts"
import { BookId } from "../domain/BookId.ts"
import { BookRepository } from "./BookRepository.ts"
import type { RegisterBook } from "./RegisterBook.ts"

/**
 * Use cases of the books feature.
 *
 * `make` is an Effect that builds the service. It `yield*`s its dependencies
 * once, so the returned methods close over them and their own types stay
 * free of requirements. The requirements move to the layer instead:
 *
 *   Books.layer : Layer<Books, never, BookRepository | Crypto>
 */
export class Books extends Context.Service<Books>()("app/books/Books", {
  make: Effect.gen(function*() {
    const repository = yield* BookRepository
    const crypto = yield* Crypto.Crypto

    const get = Effect.fn("Books.get")(function*(id: BookId) {
      const found = yield* repository.findById(id)
      return yield* Option.match(found, {
        onNone: () => Effect.fail(new BookNotFound({ id })),
        onSome: Effect.succeed
      })
    })

    const register = Effect.fn("Books.register")(function*(command: RegisterBook) {
      const id = BookId.make(yield* crypto.randomUUIDv4())
      const book = new Book({ ...command, id })
      yield* repository.insert(book)
      return book
    })

    const changeCopies = Effect.fn("Books.changeCopies")(function*(id: BookId, delta: number) {
      const book = yield* get(id)
      const updated = delta >= 0 ? addCopies(book, delta) : yield* removeCopies(book, -delta)
      yield* repository.update(updated)
      return updated
    })

    return {
      get,
      list: repository.list,
      register,
      changeCopies
    } as const
  })
}) {
  static readonly layer = Layer.effect(this, this.make)
}

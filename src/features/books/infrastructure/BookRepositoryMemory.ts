import { Effect, HashMap, Layer, Option, Ref } from "effect"
import { BookRepository } from "../application/BookRepository.ts"
import type { Book } from "../domain/Book.ts"
import { BookNotFound, IsbnAlreadyRegistered } from "../domain/BookErrors.ts"
import type { BookId } from "../domain/BookId.ts"

/**
 * In-memory BookRepository. State lives in a `Ref` (a mutable cell that is only
 * read and written through effects) holding an immutable `HashMap`.
 *
 * The Ref is created when the layer is built, so every build of this layer starts
 * empty: each test that provides it gets its own isolated store.
 */
export const BookRepositoryMemory = Layer.effect(
  BookRepository,
  Effect.gen(function*() {
    const store = yield* Ref.make(HashMap.empty<BookId, Book>())

    return BookRepository.of({
      findById: (id) => Ref.get(store).pipe(Effect.map(HashMap.get(id))),

      list: Ref.get(store).pipe(Effect.map((books) => Array.from(HashMap.values(books)))),

      // Ref.modify reads and writes in one atomic step, so two concurrent inserts
      // with the same ISBN cannot both pass the uniqueness check.
      insert: (book) =>
        Ref.modify(store, (books) => {
          const taken = HashMap.some(books, (existing) => existing.isbn === book.isbn)
          return taken ? [false, books] : [true, HashMap.set(books, book.id, book)]
        }).pipe(
          Effect.flatMap((inserted) =>
            inserted ? Effect.void : Effect.fail(new IsbnAlreadyRegistered({ isbn: book.isbn }))
          )
        ),

      update: (book) =>
        Ref.modify(store, (books) =>
          Option.isSome(HashMap.get(books, book.id))
            ? [true, HashMap.set(books, book.id, book)]
            : [false, books]).pipe(
            Effect.flatMap((updated) => updated ? Effect.void : Effect.fail(new BookNotFound({ id: book.id })))
          )
    })
  })
)

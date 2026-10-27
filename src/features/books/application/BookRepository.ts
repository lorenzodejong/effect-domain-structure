import { Context, type Effect, type Option } from "effect"
import type { Book } from "../domain/Book.ts"
import type { BookNotFound, IsbnAlreadyRegistered } from "../domain/BookErrors.ts"
import type { BookId } from "../domain/BookId.ts"

/**
 * Port: the storage the books feature needs, described in domain terms.
 *
 * Only the shape lives here. Implementations (in-memory, SQL) live in
 * `infrastructure/` and are chosen by `src/app`. Anything that uses this
 * service gets `BookRepository` in its requirements (`R`) until a layer
 * provides it.
 *
 * Modeling choices:
 * - `findById` returns `Option`: a missing row is a normal answer for storage.
 *   Whether that is an error (BookNotFound) is the use case's decision.
 * - `insert` can fail with `IsbnAlreadyRegistered`: only storage can enforce
 *   uniqueness without a race between "check" and "insert".
 * - Technical failures (connection lost, ...) are not in the signatures.
 *   Implementations turn them into defects; callers cannot handle them anyway.
 */
export class BookRepository extends Context.Service<BookRepository, {
  readonly findById: (id: BookId) => Effect.Effect<Option.Option<Book>>
  readonly list: Effect.Effect<ReadonlyArray<Book>>
  readonly insert: (book: Book) => Effect.Effect<void, IsbnAlreadyRegistered>
  readonly update: (book: Book) => Effect.Effect<void, BookNotFound>
}>()("app/books/BookRepository") {}

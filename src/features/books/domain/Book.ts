import { Effect, Schema } from "effect"
import { BookId } from "./BookId.ts"
import { NotEnoughCopies } from "./BookErrors.ts"
import { Isbn } from "./Isbn.ts"

const Text = Schema.Trimmed.check(Schema.isNonEmpty())
const CopyCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))

// Schema.Class gives a real class (instanceof, methods, structural equality)
// whose constructor validates its fields. `new Book({ ...book, copies: -1 })` throws.
export class Book extends Schema.Class<Book>("Book")({
  id: BookId,
  isbn: Isbn,
  title: Text,
  author: Text,
  publishedYear: Schema.Int.check(Schema.isBetween({ minimum: 1450, maximum: 2100 })),
  copies: CopyCount
}) {}

// Business rules are plain functions over domain values. They can fail, so they
// return an Effect with a typed error, but they need no services (R = never).

export const addCopies = (book: Book, count: number): Book =>
  new Book({ ...book, copies: book.copies + count })

export const removeCopies = (book: Book, count: number): Effect.Effect<Book, NotEnoughCopies> =>
  count > book.copies
    ? Effect.fail(new NotEnoughCopies({ id: book.id, requested: count, available: book.copies }))
    : Effect.succeed(new Book({ ...book, copies: book.copies - count }))

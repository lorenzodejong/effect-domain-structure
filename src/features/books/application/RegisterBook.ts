import { Schema, Struct } from "effect"
import { Book } from "../domain/Book.ts"
import { IsbnFromString } from "../domain/Isbn.ts"

// Command: the input needed to register a book. Reuses the entity's field
// schemas (minus `id`, which the system assigns) so validation stays in one place.
// `isbn` accepts the human-written form and decodes it to a canonical Isbn.
export const RegisterBook = Schema.Struct({
  ...Struct.omit(Book.fields, ["id"]),
  isbn: IsbnFromString
})
export type RegisterBook = typeof RegisterBook.Type

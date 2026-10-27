import { Schema } from "effect"
import { BookId } from "./BookId.ts"
import { Isbn } from "./Isbn.ts"

// Schema.TaggedError gives each error a `_tag` (for Effect.catchTag) and a schema
// (so it can be serialized). Domain errors describe what went wrong in business
// terms; mapping them to HTTP status codes is the api layer's job.

export class BookNotFound extends Schema.TaggedError<BookNotFound>()("BookNotFound", {
  id: BookId
}) {}

export class IsbnAlreadyRegistered extends Schema.TaggedError<IsbnAlreadyRegistered>()("IsbnAlreadyRegistered", {
  isbn: Isbn
}) {}

export class NotEnoughCopies extends Schema.TaggedError<NotEnoughCopies>()("NotEnoughCopies", {
  id: BookId,
  requested: Schema.Number,
  available: Schema.Number
}) {}

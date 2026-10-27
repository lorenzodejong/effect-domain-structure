import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api"
import { ApiId } from "../../../shared/api/ApiId.ts"
import { RegisterBook } from "../application/RegisterBook.ts"
import { Book } from "../domain/Book.ts"
import { BookNotFound, IsbnAlreadyRegistered, NotEnoughCopies } from "../domain/BookErrors.ts"
import { BookId } from "../domain/BookId.ts"

// HTTP status codes are an api concern, so they are attached here, not in the
// domain. `HttpApiSchema.status` annotates the schema; its type is unchanged, so
// handlers can fail with the domain errors as-is and the right status is sent.
const NotFound = BookNotFound.pipe(HttpApiSchema.status(404))
const Conflict = IsbnAlreadyRegistered.pipe(HttpApiSchema.status(409))
const NotEnough = NotEnoughCopies.pipe(HttpApiSchema.status(409))

const BookParams = { id: BookId }

export const BooksGroup = HttpApiGroup.make("books")
  .add(
    HttpApiEndpoint.post("register", "/books", {
      payload: RegisterBook,
      success: Book.pipe(HttpApiSchema.status(201)),
      error: Conflict
    })
  )
  .add(
    HttpApiEndpoint.get("list", "/books", {
      success: Schema.Array(Book)
    })
  )
  .add(
    HttpApiEndpoint.get("get", "/books/:id", {
      params: BookParams,
      success: Book,
      error: NotFound
    })
  )
  .add(
    HttpApiEndpoint.patch("changeCopies", "/books/:id/copies", {
      params: BookParams,
      payload: Schema.Struct({ delta: Schema.Int }),
      success: Book,
      error: [NotFound, NotEnough]
    })
  )

export const BooksApi = HttpApi.make(ApiId).add(BooksGroup)

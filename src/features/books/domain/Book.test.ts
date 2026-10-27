import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { addCopies, Book, removeCopies } from "./Book.ts"
import { BookId } from "./BookId.ts"
import { Isbn } from "./Isbn.ts"

const book = new Book({
  id: BookId.make("8d0c6a2e-4d0f-4f5e-9a51-6f1f3f2b9c11"),
  isbn: Isbn.make("9780134685991"),
  title: "Effective Java",
  author: "Joshua Bloch",
  publishedYear: 2018,
  copies: 2
})

describe("Book", () => {
  it("constructor validates fields", () => {
    assert.throws(() => new Book({ ...book, title: "  " }))
  })

  it("addCopies increases the count", () => {
    assert.strictEqual(addCopies(book, 3).copies, 5)
  })

  it.effect("removeCopies decreases the count", () =>
    Effect.gen(function*() {
      const updated = yield* removeCopies(book, 2)
      assert.strictEqual(updated.copies, 0)
    }))

  it.effect("removeCopies fails with NotEnoughCopies when removing too many", () =>
    Effect.gen(function*() {
      const error = yield* removeCopies(book, 3).pipe(Effect.flip)
      assert.strictEqual(error._tag, "NotEnoughCopies")
      assert.deepStrictEqual([error.requested, error.available], [3, 2])
    }))
})

import { assert, describe, it } from "@effect/vitest"
import { Effect, Schema } from "effect"
import { Isbn, IsbnFromString } from "./Isbn.ts"

describe("Isbn", () => {
  it.effect("decodes a hyphenated ISBN into canonical digits", () =>
    Effect.gen(function*() {
      const isbn = yield* Schema.decodeUnknownEffect(IsbnFromString)("978-0-13-468599-1")
      assert.strictEqual(isbn, "9780134685991")
    }))

  it.effect("rejects a wrong check digit", () =>
    Effect.gen(function*() {
      const error = yield* Schema.decodeUnknownEffect(Isbn)("9780134685990").pipe(Effect.flip)
      assert.include(error.message, "ISBN check digit is invalid")
    }))

  it.effect("rejects anything that is not 13 digits", () =>
    Effect.gen(function*() {
      const error = yield* Schema.decodeUnknownEffect(IsbnFromString)("978-0-13").pipe(Effect.flip)
      assert.include(error.message, "ISBN must be 13 digits")
    }))
})

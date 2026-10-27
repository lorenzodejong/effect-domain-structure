import { Schema } from "effect"

// A brand makes `BookId` a distinct type from `string` at compile time:
// you cannot pass a member id, or any random string, where a BookId is expected.
// At runtime it is still a plain string, validated as a UUID when decoded or made.
export const BookId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("BookId"))
export type BookId = typeof BookId.Type

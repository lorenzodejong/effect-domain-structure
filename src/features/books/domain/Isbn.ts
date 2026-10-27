import { Schema, SchemaTransformation } from "effect"

const hasValidChecksum = (digits: string): boolean => {
  const sum = Array.from(digits.slice(0, 12)).reduce(
    (acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0
  )
  return (10 - (sum % 10)) % 10 === Number(digits[12])
}

/**
 * Canonical ISBN-13: exactly 13 digits with a valid check digit.
 * This is the only form the domain ever holds.
 */
export const Isbn = Schema.String.check(
  Schema.isPattern(/^\d{13}$/, { message: "ISBN must be 13 digits" }),
  Schema.makeFilter(hasValidChecksum, { message: "ISBN check digit is invalid" })
).pipe(Schema.brand("Isbn"))
export type Isbn = typeof Isbn.Type

/**
 * ISBN as people write it ("978-0-13-468599-1"). Decoding strips the
 * separators and then validates as `Isbn`; encoding gives the canonical digits.
 */
export const IsbnFromString = Schema.String.pipe(
  Schema.decodeTo(
    Isbn,
    SchemaTransformation.transform({
      decode: (input) => input.replace(/[\s-]/g, ""),
      encode: (isbn) => isbn
    })
  )
)

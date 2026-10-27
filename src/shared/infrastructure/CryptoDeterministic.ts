import { Crypto, Effect, Layer } from "effect"

/**
 * Crypto whose "random" bytes come from a counter: ids are unique within one
 * layer build and identical across test runs. For tests only; not secure.
 */
export const CryptoDeterministic = Layer.sync(Crypto.Crypto, () => {
  let counter = 0
  return Crypto.make({
    randomBytes: (size) => {
      counter++
      return Uint8Array.from({ length: size }, (_, index) => (counter + index) % 256)
    },
    digest: (_algorithm, data) => Effect.succeed(data)
  })
})

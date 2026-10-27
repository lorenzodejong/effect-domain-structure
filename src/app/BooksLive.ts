import { NodeCrypto } from "@effect/platform-node"
import { Layer } from "effect"
import { Books } from "../features/books/application/Books.ts"
import { BookRepositoryMemory } from "../features/books/infrastructure/BookRepositoryMemory.ts"

// The composition root chooses the implementations behind the ports:
//   Books.layer          : Layer<Books, never, BookRepository | Crypto>
//   BookRepositoryMemory : Layer<BookRepository>
//   NodeCrypto.layer     : Layer<Crypto>
// Providing both leaves nothing unmet: Layer<Books, never, never>.
export const BooksLive = Books.layer.pipe(
  Layer.provide([BookRepositoryMemory, NodeCrypto.layer])
)

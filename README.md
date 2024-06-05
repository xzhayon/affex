# affex

[![GitHub](https://img.shields.io/github/license/xzhayon/affex)](LICENSE.md)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/xzhayon/affex/test.yaml?branch=main)](https://github.com/xzhayon/affex/actions)
[![Codecov](https://img.shields.io/codecov/c/gh/xzhayon/affex)](https://app.codecov.io/gh/xzhayon/affex)
[![npm](https://img.shields.io/npm/v/affex)](https://www.npmjs.com/package/affex)

## Installation

The package is available via [npm](https://www.npmjs.com/package/affex):

```sh
npm install affex
```

## Usage

```typescript
import { fx } from 'affex'

// Define service interface.
interface Log {
  readonly [fx.uri]?: unique symbol
  (message: string): void
}

// Create service tag.
const tag = fx.tag<Log>()

// Derive effect constructor.
const log = fx.operation(tag)

// Perform effect in generator function.
function* main() {
  yield* log('hello, world')
}

// Create layer with effect handler.
function ConsoleLog() {
  return fx.layer(tag, (message) => console.log(message))
}

// Run program with provided context.
fx.runPromise(main, fx.context().with(ConsoleLog()))
```

## License

[MIT](LICENSE.md)

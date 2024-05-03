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

// Define effect interface.
interface Log {
  readonly [fx.uri]?: unique symbol
  (message: string): void
}

// Create effect tag.
const tag = fx.tag<Log>()

// Derive effector constructor.
const log = fx.function(tag)

// Perform effect in generator function.
function* main() {
  yield* log('hello, world')
}

// Create layer with effect handler.
function ConsoleLog() {
  return fx.layer().with(tag, (message) => console.log(message))
}

// Run program with provided layer.
fx.runPromise(main, ConsoleLog())
```

## License

[MIT](LICENSE.md)

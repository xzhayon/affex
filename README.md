# fx

[![GitHub](https://img.shields.io/github/license/xzhavilla/fx)](LICENSE.md)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/xzhavilla/fx/test.yaml?branch=main)](https://github.com/xzhavilla/fx/actions)
[![Codecov](https://img.shields.io/codecov/c/gh/xzhavilla/fx)](https://app.codecov.io/gh/xzhavilla/fx)
[![npm](https://img.shields.io/npm/v/@xzhayon/fx)](https://www.npmjs.com/package/@xzhayon/fx)

## Installation

The package is available via [npm](https://www.npmjs.com/package/@xzhayon/fx):

```sh
npm install @xzhayon/fx
```

## Usage

```typescript
import { fx } from '@xzhayon/fx'

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

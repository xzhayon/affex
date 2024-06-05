import * as $Cause from '../Cause'
import { Result } from '../Effector'
import * as $Exit from '../Exit'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Exception from './Exception'
import * as $Proxy from './Proxy'

describe('Exception', () => {
  class FooError extends Error {
    readonly [uri]!: 'Foo'
  }

  interface Divide {
    readonly [uri]?: unique symbol
    (a: number, b: number): Result<number, FooError>
  }

  const tag = $Tag.tag<Divide>()
  const divide = $Proxy.operation(tag)

  describe('raise', () => {
    test('raising unexpected error', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Proxy.operation(tagRandom)

      await expect(
        $Runtime.runExit(
          random,
          $Context.context().with(
            // @ts-expect-error
            $Layer.layer(tagRandom, function* () {
              return yield* $Exception.raise(
                new Error('Cannot return random number'),
              )
            }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('Cannot return random number'))),
      )
    })

    test('raising error supertype', async () => {
      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Context.context().with(
            // @ts-expect-error
            $Layer.layer(tag, function* (a, b) {
              if (b === 0) {
                return yield* $Exception.raise(
                  new Error('Cannot divide by zero'),
                )
              }

              return a / b
            }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('Cannot divide by zero'))),
      )
    })

    test('raising error', async () => {
      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Context.context().with(
            $Layer.layer(tag, function* (a, b) {
              if (b === 0) {
                return yield* $Exception.raise(
                  new FooError('Cannot divide by zero'),
                )
              }

              return a / b
            }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new FooError('Cannot divide by zero'))),
      )
    })

    test('raising different error', async () => {
      class BarError extends Error {
        readonly [uri]!: 'Bar'
      }

      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Context.context().with(
            // @ts-expect-error
            $Layer.layer(tag, function* (a, b) {
              if (b === 0) {
                return yield* $Exception.raise(
                  new BarError('Cannot divide by zero'),
                )
              }

              return a / b
            }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new BarError('Cannot divide by zero'))),
      )
    })

    test('rethrowing error', async () => {
      await expect(
        $Runtime.runExit(
          function* () {
            try {
              return yield* divide(42, 0)
            } catch (error) {
              throw error
            }
          },
          $Context.context().with(
            $Layer.layer(tag, function* (a, b) {
              if (b === 0) {
                return yield* $Exception.raise(
                  new FooError('Cannot divide by zero'),
                )
              }

              return a / b
            }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new FooError('Cannot divide by zero'))),
      )
    })

    test('raising error and performing effect', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Proxy.operation(tagRandom)

      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Context
            .context()
            .with(
              $Layer.layer(tag, function* (_a, b) {
                if (b === 0) {
                  return yield* $Exception.raise(
                    new FooError('Cannot divide by zero'),
                  )
                }

                return yield* random()
              }),
            )
            .with($Layer.layer(tagRandom, () => Math.random())),
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new FooError('Cannot divide by zero'))),
      )
    })

    test('expecting multiple errors', async () => {
      class BarError extends Error {
        readonly [uri]!: 'Bar'
      }

      interface FooBar {
        (): Result<never, FooError | BarError>
      }

      const tagFooBar = $Tag.tag<FooBar>()
      const fooBar = $Proxy.operation(tagFooBar)

      await expect(
        $Runtime.runExit(
          fooBar,
          $Context.context().with(
            $Layer.layer(tagFooBar, function* () {
              if (false) {
                return yield* $Exception.raise(new FooError())
              }

              return yield* $Exception.raise(new BarError())
            }),
          ),
        ),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(new BarError())))
    })
  })

  describe('wrap', () => {
    test('returning value', async () => {
      await expect(
        $Runtime.runPromise(
          $Exception.wrap(
            () => 42,
            (cause) => new Error('bar', { cause }),
          ),
        ),
      ).resolves.toStrictEqual(42)
    })

    test('mapping error', async () => {
      await expect(
        $Runtime.runExit(
          $Exception.wrap(
            () => {
              throw new Error('foo')
            },
            (cause) => new Error('bar', { cause }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.fail(new Error('bar', { cause: new Error('foo') })),
        ),
      )
    })
  })

  describe('wrapAsync', () => {
    test('returning asynchronous value', async () => {
      await expect(
        $Runtime.runPromise(
          $Exception.wrapAsync(
            async () => 42,
            (cause) => new Error('bar', { cause }),
          ),
        ),
      ).resolves.toStrictEqual(42)
    })

    test('mapping asynchronous error', async () => {
      await expect(
        $Runtime.runExit(
          $Exception.wrapAsync(
            () => Promise.reject(new Error('foo')),
            (cause) => new Error('bar', { cause }),
          ),
        ),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.fail(new Error('bar', { cause: new Error('foo') })),
        ),
      )
    })
  })
})

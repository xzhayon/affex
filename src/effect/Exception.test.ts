import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Layer from '../Layer'
import { Result } from '../Result'
import * as $Runtime from '../Runtime'
import * as $Tag from '../Tag'
import { uri } from '../Type'
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
  const divide = $Proxy.function(tag)

  describe('raise', () => {
    test('raising unexpected error', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Proxy.function(tagRandom)

      await expect(
        $Runtime.runExit(
          random,
          // @ts-expect-error
          $Layer.layer().with(tagRandom, function* () {
            return yield* $Exception.raise(
              new Error('Cannot return random number'),
            )
          }),
        ),
      ).resolves.toStrictEqual(
        $Exit.failure($Cause.fail(new Error('Cannot return random number'))),
      )
    })

    test('raising error supertype', async () => {
      await expect(
        $Runtime.runExit(
          divide(42, 0),
          // @ts-expect-error
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new Error('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).resolves.toStrictEqual(
        $Exit.failure($Cause.fail(new Error('Cannot divide by zero'))),
      )
    })

    test('raising error', async () => {
      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new FooError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).resolves.toStrictEqual(
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
          // @ts-expect-error
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new BarError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).resolves.toStrictEqual(
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
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new FooError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).resolves.toStrictEqual(
        $Exit.failure($Cause.fail(new FooError('Cannot divide by zero'))),
      )
    })

    test('raising error and performing effect', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Proxy.function(tagRandom)

      await expect(
        $Runtime.runExit(
          divide(42, 0),
          $Layer
            .layer()
            .with(tag, function* (_a, b) {
              if (b === 0) {
                yield* $Exception.raise(new FooError('Cannot divide by zero'))
              }

              return yield* random()
            })
            .with(tagRandom, () => Math.random()),
        ),
      ).resolves.toStrictEqual(
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
      const fooBar = $Proxy.function(tagFooBar)

      await expect(
        $Runtime.runExit(
          fooBar,
          $Layer.layer().with(tagFooBar, function* () {
            if (false) {
              return yield* $Exception.raise(new FooError())
            }

            return yield* $Exception.raise(new BarError())
          }),
        ),
      ).resolves.toStrictEqual($Exit.failure($Cause.fail(new BarError())))
    })
  })
})

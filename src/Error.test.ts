import * as $Cause from './Cause'
import * as $Error from './Error'
import * as $Exit from './Exit'
import * as $Layer from './Layer'
import { Result } from './Result'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Exception from './effect/Exception'
import * as $Proxy from './effect/Proxy'

describe('Error', () => {
  interface Divide {
    readonly [uri]?: unique symbol
    (a: number, b: number): Result<number, Error>
  }

  const tag = $Tag.tag<Divide>()
  const divide = $Proxy.function(tag)
  const layer = $Layer.layer().with(tag, function* (a, b) {
    if (b === 0) {
      yield* $Exception.raise(new Error('Cannot divide by zero'))
    }

    return a / b
  })

  describe('tryCatch', () => {
    test.failing('forwarding error', async () => {
      await expect(
        $Runtime.runExit(
          $Error.tryCatch(divide(42, 0), function* (error) {
            throw error
          }),
          layer,
        ),
      ).resolves.toStrictEqual(
        $Exit.failure($Cause.die(new Error('Cannot divide by zero'))),
      )
    })

    test('throwing new error', async () => {
      await expect(
        $Runtime.runExit(
          $Error.tryCatch(divide(42, 0), function* () {
            throw new Error('Cannot recover from exception')
          }),
          layer,
        ),
      ).resolves.toStrictEqual(
        $Exit.failure($Cause.die(new Error('Cannot recover from exception'))),
      )
    })

    test('raising new error', async () => {
      await expect(
        $Runtime.runExit(
          $Error.tryCatch(divide(42, 0), function* () {
            return yield* $Exception.raise(
              new Error('Cannot recover from exception'),
            )
          }),
          layer,
        ),
      ).resolves.toStrictEqual(
        $Exit.failure($Cause.fail(new Error('Cannot recover from exception'))),
      )
    })

    test('returning value', async () => {
      await expect(
        $Runtime.runPromise(
          $Error.tryCatch(divide(42, 0), function* () {
            return NaN
          }),
          layer,
        ),
      ).resolves.toStrictEqual(NaN)
    })

    test('performing effect', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Proxy.function(tagRandom)

      await expect(
        $Runtime.runPromise(
          $Error.tryCatch(divide(42, 0), function* () {
            return yield* random()
          }),
          layer.with(tagRandom, () => 42),
        ),
      ).resolves.toStrictEqual(42)
    })

    test('handling unexpected errors', async () => {
      class FooError extends Error {
        readonly [uri]!: 'Foo'
      }

      class BarError extends Error {
        readonly [uri]!: 'Bar'
      }

      await expect(
        $Runtime.runExit(function* () {
          // @ts-expect-error
          return (yield* $Error.tryCatch(
            function* () {
              if (false) {
                return yield* $Exception.raise(new FooError())
              }

              throw new BarError()
            },
            function* (error) {
              switch (error[uri]) {
                case 'Foo':
                  return 'foo'
              }
            },
          )).length
        }, $Layer.layer()),
      ).resolves.toStrictEqual(
        $Exit.failure(
          $Cause.die(
            new TypeError(
              "Cannot read properties of undefined (reading 'length')",
            ),
          ),
        ),
      )
    })
  })

  describe('tryCatchAsync', () => {
    test('catching error', async () => {
      await expect(
        $Runtime.runPromise(
          $Error.tryCatchAsync(
            async function* () {
              throw new Error('foo')
            },
            function* (error) {
              return error
            },
          ),
          $Layer.layer(),
        ),
      ).resolves.toStrictEqual(new Error('foo'))
    })

    test('catching "asynchronous" error', async () => {
      await expect(
        $Runtime.runPromise(
          $Error.tryCatchAsync(
            (async function* () {
              return await Promise.reject(new Error('foo'))
            })(),
            function* (error) {
              return error
            },
          ),
          $Layer.layer(),
        ),
      ).resolves.toStrictEqual(new Error('foo'))
    })
  })
})

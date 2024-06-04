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
import * as $Sandbox from './Sandbox'

describe('Sandbox', () => {
  interface Divide {
    readonly [uri]?: unique symbol
    (a: number, b: number): Result<number, Error>
  }

  const tag = $Tag.tag<Divide>()
  const divide = $Proxy.function(tag)
  const context = $Context.context().with(
    $Layer.layer(tag, function* (a, b) {
      if (b === 0) {
        return yield* $Exception.raise(new Error('Cannot divide by zero'))
      }

      return a / b
    }),
  )

  describe('tryCatch', () => {
    test('forwarding error', async () => {
      await expect(
        $Runtime.runExit(
          $Sandbox.tryCatch(divide(42, 0), (error) => {
            throw error
          }),
          context,
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('Cannot divide by zero'))),
      )
    })

    test('throwing new error', async () => {
      await expect(
        $Runtime.runExit(
          $Sandbox.tryCatch(divide(42, 0), () => {
            throw new Error('Cannot recover from exception')
          }),
          context,
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.die(new Error('Cannot recover from exception'))),
      )
    })

    test('raising new error', async () => {
      await expect(
        $Runtime.runExit(
          $Sandbox.tryCatch(divide(42, 0), () =>
            $Exception.raise(new Error('Cannot recover from exception')),
          ),
          context,
        ),
      ).resolves.toMatchObject(
        $Exit.failure($Cause.fail(new Error('Cannot recover from exception'))),
      )
    })

    test('returning value', async () => {
      await expect(
        $Runtime.runPromise(
          $Sandbox.tryCatch(divide(42, 0), () => NaN),
          context,
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
          $Sandbox.tryCatch(divide(42, 0), random),
          context.with($Layer.layer(tagRandom, () => 42)),
        ),
      ).resolves.toStrictEqual(42)
    })

    test('ignoring unexpected error', async () => {
      class FooError extends Error {
        readonly [uri]!: 'Foo'
      }

      class BarError extends Error {
        readonly [uri]!: 'Bar'
      }

      await expect(
        $Runtime.runExit(function* () {
          return (yield* $Sandbox.tryCatch(
            function* () {
              if (false) {
                return yield* $Exception.raise(new FooError())
              }

              throw new BarError()
            },
            (error) => {
              switch (error[uri]) {
                case 'Foo':
                  return 'foo'
              }
            },
          )).length
        }, $Context.context()),
      ).resolves.toMatchObject($Exit.failure($Cause.die(new BarError())))
    })

    test('handling multiple errors', async () => {
      class FooError extends Error {
        readonly [uri]: 'Foo' = 'Foo'
      }

      class BarError extends Error {
        readonly [uri]: 'Bar' = 'Bar'
      }

      await expect(
        $Runtime.runPromise(
          $Sandbox.tryCatch(
            function* () {
              if (false) {
                return yield* $Exception.raise(new FooError())
              }

              return yield* $Exception.raise(new BarError())
            },
            (error) => {
              switch (error[uri]) {
                case 'Foo':
                  return 'foo'
                case 'Bar':
                  return 'bar'
              }
            },
          ),
          $Context.context(),
        ),
      ).resolves.toStrictEqual('bar')
    })

    test('ignoring "asynchronous" unexpected error', async () => {
      await expect(
        $Runtime.runExit(
          $Sandbox.tryCatch(
            async function* () {
              return await Promise.reject(new Error('foo'))
            },
            () => 'bar',
          ),
          $Context.context(),
        ),
      ).resolves.toMatchObject($Exit.failure($Cause.die(new Error('foo'))))
    })
  })
})

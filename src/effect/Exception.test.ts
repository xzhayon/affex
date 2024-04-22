import * as $Layer from '../Layer'
import { Result } from '../Result'
import * as $Runtime from '../Runtime'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Exception from './Exception'
import * as $Proxy from './Proxy'

describe('Exception', () => {
  interface Divide {
    readonly [uri]?: unique symbol
    (a: number, b: number): Result<number, Error>
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
        $Runtime.runPromise(
          random,
          // @ts-expect-error
          $Layer.layer().with(tagRandom, function* () {
            return yield* $Exception.raise(
              new Error('Cannot return random number'),
            )
          }),
        ),
      ).rejects.toThrow('Cannot return random number')
    })

    test('raising error', async () => {
      await expect(
        $Runtime.runPromise(
          divide(42, 0),
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new Error('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising error subclass', async () => {
      class FooError extends Error {}

      await expect(
        $Runtime.runPromise(
          divide(42, 0),
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new FooError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising different error', async () => {
      class BarError extends Error {
        readonly [uri]!: 'BarError'
      }

      await expect(
        $Runtime.runPromise(
          divide(42, 0),
          // @ts-expect-error
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Exception.raise(new BarError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising error and performing effect', async () => {
      interface Random {
        readonly [uri]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Proxy.function(tagRandom)

      await expect(
        $Runtime.runPromise(
          divide(42, 0),
          $Layer
            .layer()
            .with(tag, function* (_a, b) {
              if (b === 0) {
                yield* $Exception.raise(new Error('Cannot divide by zero'))
              }

              return yield* random()
            })
            .with(tagRandom, () => Math.random()),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })
  })
})

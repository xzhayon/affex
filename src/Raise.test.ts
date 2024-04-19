import * as $Effector from './Effector'
import * as $Layer from './Layer'
import * as $Raise from './Raise'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'
import { URI } from './Type'

describe('Raise', () => {
  interface Divide {
    readonly [URI]?: unique symbol
    (a: number, b: number): number | Error
  }

  const tag = $Tag.tag<Divide>()
  const divide = $Effector.function(tag)

  test('throwing error from normal function', async () => {
    await expect(
      $Runtime.run(
        divide(42, 0),
        $Layer.layer().with(tag, (a, b) => {
          if (b === 0) {
            throw new Error('Cannot divide by zero')
          }

          return a / b
        }),
      ),
    ).rejects.toThrow('Cannot divide by zero')
  })

  test('throwing error from generator function', async () => {
    await expect(
      $Runtime.run(
        divide(42, 0),
        $Layer.layer().with(tag, function* (a, b) {
          if (b === 0) {
            throw new Error('Cannot divide by zero')
          }

          return a / b
        }),
      ),
    ).rejects.toThrow('Cannot divide by zero')
  })

  describe('raise', () => {
    test('raising unexpected error', async () => {
      interface Random {
        readonly [URI]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Effector.function(tagRandom)

      await expect(
        $Runtime.run(
          random,
          // @ts-expect-error
          $Layer.layer().with(tagRandom, function* () {
            return yield* $Raise.raise(new Error('Cannot return random number'))
          }),
        ),
      ).rejects.toThrow('Cannot return random number')
    })

    test('raising error', async () => {
      await expect(
        $Runtime.run(
          divide(42, 0),
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Raise.raise(new Error('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising error subclass', async () => {
      class FooError extends Error {}

      await expect(
        $Runtime.run(
          divide(42, 0),
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Raise.raise(new FooError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising different error', async () => {
      class BarError extends Error {
        readonly [URI]!: 'BarError'
      }

      await expect(
        $Runtime.run(
          divide(42, 0),
          // @ts-expect-error
          $Layer.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* $Raise.raise(new BarError('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising error and performing effect', async () => {
      interface Random {
        readonly [URI]?: unique symbol
        (): number
      }

      const tagRandom = $Tag.tag<Random>()
      const random = $Effector.function(tagRandom)

      await expect(
        $Runtime.run(
          divide(42, 0),
          $Layer
            .layer()
            .with(tag, function* (_a, b) {
              if (b === 0) {
                yield* $Raise.raise(new Error('Cannot divide by zero'))
              }

              return yield* random()
            })
            .with(tagRandom, () => Math.random()),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })
  })
})

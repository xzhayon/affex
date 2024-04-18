import * as E from './Effector'
import * as F from './Fiber'
import * as L from './Layer'
import * as R from './Raise'
import * as T from './Tag'
import { URI } from './Type'

describe('Raise', () => {
  interface Divide {
    readonly [URI]?: unique symbol
    (a: number, b: number): number | Error
  }

  const tag = T.tag<Divide>()
  const divide = E.function(tag)

  test('throwing error from normal function', async () => {
    await expect(
      F.run(
        divide(42, 0),
        L.layer().with(tag, (a, b) => {
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
      F.run(
        divide(42, 0),
        L.layer().with(tag, function* (a, b) {
          if (b === 0) {
            throw new Error('Cannot divide by zero')
          }

          return a / b
        }),
      ),
    ).rejects.toThrow('Cannot divide by zero')
  })

  describe('raise', () => {
    test('raising error not defined in interface', async () => {
      interface Random {
        readonly [URI]?: unique symbol
        (): number
      }

      const tagRandom = T.tag<Random>()
      const random = E.function(tagRandom)

      await expect(
        F.run(
          random,
          // @ts-expect-error
          L.layer().with(tagRandom, function* () {
            return yield* R.raise(new Error('Cannot return random number'))
          }),
        ),
      ).rejects.toThrow('Cannot return random number')
    })

    test('raising error', async () => {
      await expect(
        F.run(
          divide(42, 0),
          L.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* R.raise(new Error('Cannot divide by zero'))
            }

            return a / b
          }),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('raising error subclass', async () => {
      class FooError extends Error {}

      await expect(
        F.run(
          divide(42, 0),
          L.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* R.raise(new FooError('Cannot divide by zero'))
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
        F.run(
          divide(42, 0),
          // @ts-expect-error
          L.layer().with(tag, function* (a, b) {
            if (b === 0) {
              yield* R.raise(new BarError('Cannot divide by zero'))
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

      const tagRandom = T.tag<Random>()
      const random = E.function(tagRandom)

      await expect(
        F.run(
          divide(42, 0),
          L.layer()
            .with(tag, function* (_a, b) {
              if (b === 0) {
                yield* R.raise(new Error('Cannot divide by zero'))
              }

              return yield* random()
            })
            .with(tagRandom, () => Math.random()),
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })
  })
})

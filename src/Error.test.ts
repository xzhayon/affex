import * as Ef from './Effector'
import * as Er from './Error'
import * as F from './Fiber'
import * as L from './Layer'
import * as R from './Raise'
import * as T from './Tag'
import { URI } from './Type'

describe('Error', () => {
  interface Divide {
    readonly [URI]?: unique symbol
    (a: number, b: number): number | Error
  }

  const tag = T.tag<Divide>()
  const divide = Ef.function(tag)

  describe('tryCatch', () => {
    const layer = L.layer().with(tag, function* (a, b) {
      if (b === 0) {
        yield* R.raise(new Error('Cannot divide by zero'))
      }

      return a / b
    })

    test('forwarding error', async () => {
      await expect(
        F.run(
          Er.tryCatch(divide(42, 0), function* (error) {
            throw error
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('throwing new error', async () => {
      await expect(
        F.run(
          Er.tryCatch(divide(42, 0), function* () {
            throw new Error('Cannot recover from exception')
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot recover from exception')
    })

    test('raising new error', async () => {
      await expect(
        F.run(
          Er.tryCatch(divide(42, 0), function* () {
            return yield* R.raise(new Error('Cannot recover from exception'))
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot recover from exception')
    })

    test('returning value', async () => {
      await expect(
        F.run(
          Er.tryCatch(divide(42, 0), function* () {
            return NaN
          }),
          layer,
        ),
      ).resolves.toStrictEqual(NaN)
    })

    test('performing effect', async () => {
      interface Random {
        readonly [URI]?: unique symbol
        (): number
      }

      const tagRandom = T.tag<Random>()
      const random = Ef.function(tagRandom)

      const newLocal = Er.tryCatch(divide(42, 0), function* () {
        return yield* random()
      })
      await expect(
        F.run(
          newLocal,
          layer.with(tagRandom, () => 42),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})

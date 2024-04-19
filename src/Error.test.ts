import * as $Effector from './Effector'
import * as $Error from './Error'
import * as $Layer from './Layer'
import * as $Raise from './Raise'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'
import { URI } from './Type'

describe('Error', () => {
  interface Divide {
    readonly [URI]?: unique symbol
    (a: number, b: number): number | Error
  }

  const tag = $Tag.tag<Divide>()
  const divide = $Effector.function(tag)

  describe('tryCatch', () => {
    const layer = $Layer.layer().with(tag, function* (a, b) {
      if (b === 0) {
        yield* $Raise.raise(new Error('Cannot divide by zero'))
      }

      return a / b
    })

    test('forwarding error', async () => {
      await expect(
        $Runtime.run(
          $Error.tryCatch(divide(42, 0), function* (error) {
            throw error
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('throwing new error', async () => {
      await expect(
        $Runtime.run(
          $Error.tryCatch(divide(42, 0), function* () {
            throw new Error('Cannot recover from exception')
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot recover from exception')
    })

    test('raising new error', async () => {
      await expect(
        $Runtime.run(
          $Error.tryCatch(divide(42, 0), function* () {
            return yield* $Raise.raise(
              new Error('Cannot recover from exception'),
            )
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot recover from exception')
    })

    test('returning value', async () => {
      await expect(
        $Runtime.run(
          $Error.tryCatch(divide(42, 0), function* () {
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

      const tagRandom = $Tag.tag<Random>()
      const random = $Effector.function(tagRandom)

      const newLocal = $Error.tryCatch(divide(42, 0), function* () {
        return yield* random()
      })
      await expect(
        $Runtime.run(
          newLocal,
          layer.with(tagRandom, () => 42),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})

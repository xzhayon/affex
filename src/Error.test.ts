import * as $Error from './Error'
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

  describe('tryCatch', () => {
    const layer = $Layer.layer().with(tag, function* (a, b) {
      if (b === 0) {
        yield* $Exception.raise(new Error('Cannot divide by zero'))
      }

      return a / b
    })

    test('forwarding error', async () => {
      await expect(
        $Runtime.runPromise(
          $Error.tryCatch(divide(42, 0), function* (error) {
            throw error
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot divide by zero')
    })

    test('throwing new error', async () => {
      await expect(
        $Runtime.runPromise(
          $Error.tryCatch(divide(42, 0), function* () {
            throw new Error('Cannot recover from exception')
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot recover from exception')
    })

    test('raising new error', async () => {
      await expect(
        $Runtime.runPromise(
          $Error.tryCatch(divide(42, 0), function* () {
            return yield* $Exception.raise(
              new Error('Cannot recover from exception'),
            )
          }),
          layer,
        ),
      ).rejects.toThrow('Cannot recover from exception')
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
  })
})

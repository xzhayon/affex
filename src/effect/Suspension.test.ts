import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Proxy from './Proxy'
import * as $Suspension from './Suspension'

describe('Suspension', () => {
  test('suspending root fiber', async () => {
    await expect(
      $Runtime.runPromise(function* () {
        yield* $Suspension.suspend()

        return 42
      }, $Context.context()),
    ).resolves.toStrictEqual(42)
  })

  test('suspending child fiber', async () => {
    interface Random {
      readonly [uri]?: unique symbol
      (): number
    }

    const tag = $Tag.tag<Random>()
    const random = $Proxy.function(tag)

    await expect(
      $Runtime.runPromise(
        random,
        $Context.context().with(
          $Layer.layer(tag, function* () {
            yield* $Suspension.suspend()

            return 42
          }),
        ),
      ),
    ).resolves.toStrictEqual(42)
  })
})

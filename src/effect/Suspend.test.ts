import * as $Layer from '../Layer'
import * as $Runtime from '../Runtime'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Proxy from './Proxy'
import * as $Suspend from './Suspend'

describe('Suspend', () => {
  test('suspending main fiber', async () => {
    await expect(
      $Runtime.runPromise(function* () {
        yield* $Suspend.suspend()

        return 42
      }, $Layer.layer()),
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
        $Layer.layer().with(tag, function* () {
          yield* $Suspend.suspend()

          return 42
        }),
      ),
    ).resolves.toStrictEqual(42)
  })
})

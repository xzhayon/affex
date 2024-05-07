import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Layer from '../Layer'
import * as $Runtime from '../Runtime'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Interrupt from './Interrupt'
import * as $Proxy from './Proxy'

describe('Interrupt', () => {
  test('interrupting main fiber', async () => {
    await expect(
      $Runtime.runExit($Interrupt.interrupt(), $Layer.layer()),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
  })

  test('interrupting child fiber', async () => {
    interface Random {
      readonly [uri]?: unique symbol
      (): number
    }

    const tag = $Tag.tag<Random>()
    const random = $Proxy.function(tag)

    await expect(
      $Runtime.runExit(
        random,
        $Layer.layer().with(tag, function* () {
          return yield* $Interrupt.interrupt()
        }),
      ),
    ).resolves.toMatchObject($Exit.failure($Cause.die({})))
  })
})

import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Interruption from './Interruption'
import * as $Proxy from './Proxy'

describe('Interruption', () => {
  interface Random {
    readonly [uri]?: unique symbol
    (): number
  }

  const tag = $Tag.tag<Random>()
  const random = $Proxy.operation(tag)

  test('interrupting root fiber', async () => {
    await expect(
      $Runtime.runExit($Interruption.interrupt()),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt()))
  })

  test('interrupting child fiber', async () => {
    await expect(
      $Runtime.runExit(
        random,
        $Context.context().with(
          $Layer.layer(tag, function* () {
            return yield* $Interruption.interrupt()
          }),
        ),
      ),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt()))
  })

  test('catching an interrupt', async () => {
    await expect(
      $Runtime.runExit(
        function* () {
          try {
            return yield* random()
          } catch {
            return 42
          }
        },
        $Context.context().with(
          $Layer.layer(tag, function* () {
            return yield* $Interruption.interrupt()
          }),
        ),
      ),
    ).resolves.toMatchObject($Exit.success(42))
  })

  test('running `finally` on interrupt', async () => {
    let a = 0

    await expect(
      $Runtime.runExit(
        function* () {
          try {
            return yield* random()
          } finally {
            a++
          }
        },
        $Context.context().with(
          $Layer.layer(tag, function* () {
            return yield* $Interruption.interrupt()
          }),
        ),
      ),
    ).resolves.toMatchObject($Exit.failure($Cause.interrupt()))
    expect(a).toStrictEqual(1)
  })
})

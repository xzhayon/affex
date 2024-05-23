import * as $Tag from '../Tag'
import { uri } from '../Type'
import { Fiber } from '../fiber/Fiber'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Fork from './Fork'
import * as $Proxy from './Proxy'
import * as $Scope from './Scope'

describe('Fork', () => {
  interface Sleep {
    readonly [uri]?: unique symbol
    (ms: number): void
  }

  const tag = $Tag.tag<Sleep>()
  const sleep = $Proxy.function(tag)
  const context = $Context
    .context()
    .with(
      $Layer.layer(
        tag,
        (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      ),
    )

  describe('fork', () => {
    test('forking in local scope', async () => {
      let a = 0
      await $Runtime.runExit(function* () {
        yield* $Scope.scope(function* () {
          yield* $Fork.fork(function* () {
            yield* sleep(100)
            a++
          })
        })

        yield* sleep(1000)
      }, context)

      expect(a).toStrictEqual(0)
    })
  })

  describe('daemonize', () => {
    test('forking in global scope', async () => {
      let a = 0
      await $Runtime.runExit(function* () {
        yield* $Scope.scope(function* () {
          yield* $Fork.daemonize(function* () {
            yield* sleep(100)
            a++
          })
        })

        yield* sleep(1000)
      }, context)

      expect(a).toStrictEqual(1)
    })

    test('daemonizing non-lazy effector', async () => {
      await expect(
        $Runtime.runPromise(
          $Fork.daemonize((function* () {})()),
          $Context.context(),
        ),
      ).resolves.toBeInstanceOf(Fiber)
    })
  })
})

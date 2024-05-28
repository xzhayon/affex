import * as $Cause from '../Cause'
import * as $Exit from '../Exit'
import { Result } from '../Result'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Exception from '../effect/Exception'
import * as $Interruption from '../effect/Interruption'
import * as $Proxy from '../effect/Proxy'
import { ConcurrencyError } from '../error/ConcurrencyError'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Fiber from './Fiber'

describe('Fiber', () => {
  interface Sleep {
    readonly [uri]?: unique symbol
    (ds: number): Result<number, number>
  }

  const tag = $Tag.tag<Sleep>()
  const sleep = $Proxy.function(tag)
  const context = $Context
    .context()
    .with(
      $Layer.layer(
        tag,
        (ds) => new Promise((resolve) => setTimeout(resolve, ds * 100)),
      ),
    )
  const dieContext = $Context
    .context()
    .with(
      $Layer.layer(
        tag,
        (ds) =>
          new Promise((resolve, reject) =>
            setTimeout(
              () => (ds % 2 === 0 ? resolve(ds) : reject(ds)),
              ds * 100,
            ),
          ),
      ),
    )
  const failContext = $Context.context().with(
    $Layer.layer(tag, async function* (ds) {
      try {
        return await new Promise((resolve, reject) =>
          setTimeout(() => (ds % 2 === 0 ? resolve(ds) : reject(ds)), ds * 100),
        )
      } catch {
        return yield* $Exception.raise(ds)
      }
    }),
  )
  const interruptContext = $Context.context().with(
    $Layer.layer(tag, async function* (ds) {
      try {
        return await new Promise((resolve, reject) =>
          setTimeout(() => (ds % 2 === 0 ? resolve(ds) : reject(ds)), ds * 100),
        )
      } catch {
        return yield* $Interruption.interrupt()
      }
    }),
  )

  test.each([
    [[0, 2], true, [0, 2]],
    [[1, 2], false, 1],
  ])('all', async (input, success, output) => {
    await expect($Runtime.runPromise($Fiber.all(input.map(sleep)), dieContext))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
    if (!success) {
      await expect(
        $Runtime.runExit($Fiber.all(input.map(sleep)), failContext),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output)))
      await expect(
        $Runtime.runExit($Fiber.all(input.map(sleep)), interruptContext),
      ).resolves.toMatchObject($Exit.failure($Cause.interrupt()))
    }
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], true, 2],
    [[1, 3], false, [1, 3]],
  ])('any', async (input, success, output) => {
    const f = () => $Fiber.any(input.map(sleep))

    if (success) {
      await expect($Runtime.runPromise(f, dieContext)).resolves.toStrictEqual(
        output,
      )
    } else {
      await expect($Runtime.runExit(f, failContext)).resolves.toMatchObject(
        $Exit.failure(
          $Cause.fail(new ConcurrencyError([1, 3], 'All fibers failed')),
        ),
      )
      await expect(
        $Runtime.runExit(f, interruptContext),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.fail(
            new ConcurrencyError(
              [new Error(), new Error()],
              'All fibers failed',
            ),
          ),
        ),
      )
    }
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], false, 1],
    [[0, 1], true, 0],
  ])('race', async (input, success, output) => {
    await expect(
      $Runtime.runPromise($Fiber.race(input.map(sleep)), dieContext),
    )[success ? 'resolves' : 'rejects'].toStrictEqual(output)
    if (!success) {
      await expect(
        $Runtime.runExit($Fiber.race(input.map(sleep)), failContext),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output)))
      await expect(
        $Runtime.runExit($Fiber.race(input.map(sleep)), interruptContext),
      ).resolves.toMatchObject($Exit.failure($Cause.interrupt()))
    }
  })

  describe.each(['all', 'any', 'race'] as const)('%s', (method) => {
    if (method !== 'any') {
      test('closing scope on failure', async () => {
        const as: number[] = []
        await $Runtime.runExit(function* () {
          try {
            yield* $Fiber[method]([
              function* () {
                yield* sleep(0)

                throw new Error('foo')
              },
              function* () {
                yield* sleep(1)
                as.push(1)

                return 1
              },
            ])
          } catch {}
          yield* sleep(2)
        }, context)
        expect(as).toHaveLength(0)
      })
    }

    if (method === 'any' || method === 'race') {
      test('closing scope on success', async () => {
        const as: number[] = []
        await $Runtime.runExit(function* () {
          yield* $Fiber[method]([
            function* () {
              yield* sleep(0)

              return 0
            },
            function* () {
              yield* sleep(1)
              as.push(1)

              return 1
            },
          ])
          yield* sleep(2)
        }, context)
        expect(as).toHaveLength(0)
      })
    }
  })
})

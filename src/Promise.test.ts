import * as $Cause from './Cause'
import * as $Exit from './Exit'
import * as $Promise from './Promise'
import { Result } from './Result'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Exception from './effect/Exception'
import * as $Fork from './effect/Fork'
import * as $Interruption from './effect/Interruption'
import * as $Proxy from './effect/Proxy'
import * as $Context from './runtime/Context'
import * as $Layer from './runtime/Layer'
import * as $Runtime from './runtime/Runtime'

describe('Promise', () => {
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
    await expect(
      $Runtime.runPromise($Promise.all(input.map(sleep)), dieContext),
    )[success ? 'resolves' : 'rejects'].toStrictEqual(output)
    if (!success) {
      await expect(
        $Runtime.runExit($Promise.all(input.map(sleep)), failContext),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output, {} as any)))
      await expect(
        $Runtime.runExit($Promise.all(input.map(sleep)), interruptContext),
      ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
    }
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], true, 2],
    [[1, 3], false, [1, 3]],
  ])('any', async (input, success, output) => {
    const f = () => $Promise.any(input.map(sleep))

    if (success) {
      await expect($Runtime.runPromise(f, dieContext)).resolves.toStrictEqual(
        output,
      )
    } else {
      await expect($Runtime.runExit(f, failContext)).resolves.toMatchObject(
        $Exit.failure(
          $Cause.die(
            new AggregateError([1, 3], 'All promises were rejected'),
            {} as any,
          ),
        ),
      )
      await expect(
        $Runtime.runExit(f, interruptContext),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.die(
            new AggregateError(
              [new Error(), new Error()],
              'All promises were rejected',
            ),
            {} as any,
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
      $Runtime.runPromise($Promise.race(input.map(sleep)), dieContext),
    )[success ? 'resolves' : 'rejects'].toStrictEqual(output)
    if (!success) {
      await expect(
        $Runtime.runExit($Promise.race(input.map(sleep)), failContext),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output, {} as any)))
      await expect(
        $Runtime.runExit($Promise.race(input.map(sleep)), interruptContext),
      ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
    }
  })

  describe.each(['all', 'race'] as const)('%s', (method) => {
    test.failing('closing scope', async () => {
      const as: number[] = []

      await $Runtime.runPromise(function* () {
        yield* $Fork.fork(
          $Promise[method]([
            function* () {
              yield* sleep(0)

              throw new Error('foo')
            },
            function* () {
              yield* sleep(1)
              as.push(1)

              return 1
            },
          ]),
        )
        yield* sleep(2)
      }, context)
      expect(as).toHaveLength(0)
    })
  })
})

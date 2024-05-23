import * as $Cause from './Cause'
import * as $Exit from './Exit'
import * as $Fiber from './Fiber'
import { Result } from './Result'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Exception from './effect/Exception'
import * as $Interruption from './effect/Interruption'
import * as $Proxy from './effect/Proxy'
import * as $Context from './runtime/Context'
import * as $Layer from './runtime/Layer'
import * as $Runtime from './runtime/Runtime'

describe('Fiber', () => {
  interface Sleep {
    readonly [uri]?: unique symbol
    (ds: number): Result<number, number>
  }

  const tag = $Tag.tag<Sleep>()
  const sleep = $Proxy.function(tag)
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
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output, {} as any)))
      await expect(
        $Runtime.runExit($Fiber.all(input.map(sleep)), interruptContext),
      ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
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
          $Cause.die(
            new AggregateError([1, 3], 'All fibers failed'),
            {} as any,
          ),
        ),
      )
      await expect(
        $Runtime.runExit(f, interruptContext),
      ).resolves.toMatchObject(
        $Exit.failure(
          $Cause.die(
            new AggregateError([new Error(), new Error()], 'All fibers failed'),
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
      $Runtime.runPromise($Fiber.race(input.map(sleep)), dieContext),
    )[success ? 'resolves' : 'rejects'].toStrictEqual(output)
    if (!success) {
      await expect(
        $Runtime.runExit($Fiber.race(input.map(sleep)), failContext),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output, {} as any)))
      await expect(
        $Runtime.runExit($Fiber.race(input.map(sleep)), interruptContext),
      ).resolves.toMatchObject($Exit.failure($Cause.interrupt({} as any)))
    }
  })
})

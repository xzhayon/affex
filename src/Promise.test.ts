import * as $Cause from './Cause'
import * as $Context from './Context'
import * as $Layer from './Layer'
import * as $Exit from './Exit'
import * as $Promise from './Promise'
import { Result } from './Result'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'
import { uri } from './Type'
import * as $Exception from './effect/Exception'
import * as $Proxy from './effect/Proxy'

describe('Promise', () => {
  interface Sleep {
    readonly [uri]?: unique symbol
    (ds: number): Result<number, number>
  }

  const tag = $Tag.tag<Sleep>()
  const sleep = $Proxy.function(tag)
  const dieContext = $Context
    .context()
    .with(
     $Layer.layer( tag,
      (ds) =>
        new Promise((resolve, reject) =>
          setTimeout(() => (ds % 2 === 0 ? resolve(ds) : reject(ds)), ds * 100),
        ),
    ))
  const failContext = $Context.context().with($Layer.layer(tag, async function* (ds) {
    try {
      return await new Promise((resolve, reject) =>
        setTimeout(() => (ds % 2 === 0 ? resolve(ds) : reject(ds)), ds * 100),
      )
    } catch {
      return yield* $Exception.raise(ds)
    }
  }))

  test.each([
    [[0, 2], true, [0, 2]],
    [[1, 2], false, 1],
  ])('all', async (input, success, output) => {
    await expect($Runtime.runPromise($Promise.all(input.map(sleep)), dieContext))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
    if (!success) {
      await expect(
        $Runtime.runExit($Promise.all(input.map(sleep)), failContext),
      ).resolves.toMatchObject($Exit.failure($Cause.fail(output, {} as any)))
    }
  })

  test.each([
    [[0, 2], true, [$Exit.success(0), $Exit.success(2)]],
    [[1, 2], true, [$Exit.failure($Cause.die(1, {} as any)), $Exit.success(2)]],
  ])('settled', async (input, success, output) => {
    await expect(
      $Runtime.runPromise($Promise.settled(input.map(sleep)), dieContext),
    )[success ? 'resolves' : 'rejects'].toMatchObject(output)
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], true, 2],
    [[1, 3], false, [1, 3]],
  ])('any', async (input, success, output) => {
    const f = $Promise.any(input.map(sleep))

    await (success
      ? expect($Runtime.runPromise(f, dieContext)).resolves.toStrictEqual(output)
      : expect($Runtime.runExit(f, failContext)).resolves.toMatchObject(
          $Exit.failure(
            $Cause.die(
              new AggregateError([1, 3], 'All promises were rejected'),
              {} as any,
            ),
          ),
        ))
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
    }
  })
})

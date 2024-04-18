import * as E from './Effector'
import * as Fi from './Fiber'
import * as L from './Layer'
import * as P from './Promise'
import * as T from './Tag'

describe('Promise', () => {
  interface Sleep {
    (ds: number): number
  }

  const tag = T.tag<Sleep>()
  const sleep = E.function(tag)
  const layer = L.layer().with(
    tag,
    (ds) =>
      new Promise((resolve, reject) =>
        setTimeout(() => (ds % 2 === 0 ? resolve(ds) : reject(ds)), ds * 100),
      ),
  )

  test.each([
    [[0, 2], true, [0, 2]],
    [[1, 2], false, 1],
  ])('all', async (input, success, output) => {
    await expect(Fi.run(P.all(input.map(sleep)), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })

  test.each([
    [
      [0, 2],
      true,
      [
        { status: 'fulfilled', value: 0 },
        { status: 'fulfilled', value: 2 },
      ],
    ],
    [
      [1, 2],
      true,
      [
        { status: 'rejected', reason: 1 },
        { status: 'fulfilled', value: 2 },
      ],
    ],
  ])('allSettled', async (input, success, output) => {
    await expect(Fi.run(P.allSettled(input.map(sleep)), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], true, 2],
    [[1, 3], false, undefined],
  ])('any', async (input, success, output) => {
    const f = P.any(input.map(sleep))

    await (success
      ? expect(Fi.run(f, layer)).resolves.toStrictEqual(output)
      : expect(Fi.run(f, layer)).rejects.toThrow())
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], false, 1],
    [[0, 1], true, 0],
  ])('race', async (input, success, output) => {
    await expect(Fi.run(P.race(input.map(sleep)), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })
})

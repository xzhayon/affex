import * as $Effector from './Effector'
import * as $Layer from './Layer'
import * as $Promise from './Promise'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'

describe('Promise', () => {
  interface Sleep {
    (ds: number): number
  }

  const tag = $Tag.tag<Sleep>()
  const sleep = $Effector.function(tag)
  const layer = $Layer
    .layer()
    .with(
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
    await expect($Runtime.run($Promise.all(input.map(sleep)), layer))[
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
    await expect($Runtime.run($Promise.allSettled(input.map(sleep)), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], true, 2],
    [[1, 3], false, undefined],
  ])('any', async (input, success, output) => {
    const f = $Promise.any(input.map(sleep))

    await (success
      ? expect($Runtime.run(f, layer)).resolves.toStrictEqual(output)
      : expect($Runtime.run(f, layer)).rejects.toThrow())
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], false, 1],
    [[0, 1], true, 0],
  ])('race', async (input, success, output) => {
    await expect($Runtime.run($Promise.race(input.map(sleep)), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })
})

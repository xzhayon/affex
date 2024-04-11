import * as _E from './Effect'
import * as E from './Effector'
import { Layer } from './Layer'
import * as P from './Promise'
import * as T from './Tag'

describe('Promise', () => {
  interface Sleep {
    (s: number): number
  }

  const tag = T.tag<Sleep>()
  const sleep = _E.function(tag)
  const layer = Layer.empty().with(
    tag,
    (s) =>
      new Promise((resolve, reject) =>
        setTimeout(() => (s % 2 === 0 ? resolve(s) : reject(s)), s * 1000),
      ),
  )

  test.each([
    [[0, 2], true, [0, 2]],
    [[1, 2], false, 1],
  ])('all', async (input, success, output) => {
    function* f() {
      return yield* P.all(input, function* (a) {
        return yield* _E.perform(sleep(a))
      })
    }

    await expect(E.run(f(), layer))[
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
    function* f() {
      return yield* P.allSettled(input, function* (a) {
        return yield* _E.perform(sleep(a))
      })
    }

    await expect(E.run(f(), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], true, 2],
    [[1, 3], false, undefined],
  ])('any', async (input, success, output) => {
    function* f() {
      return yield* P.any(input, function* (a) {
        return yield* _E.perform(sleep(a))
      })
    }

    await (success
      ? expect(E.run(f(), layer)).resolves.toStrictEqual(output)
      : expect(E.run(f(), layer)).rejects.toThrow())
  })

  test.each([
    [[0, 2], true, 0],
    [[1, 2], false, 1],
    [[0, 1], true, 0],
  ])('race', async (input, success, output) => {
    function* f() {
      return yield* P.race(input, function* (a) {
        return yield* _E.perform(sleep(a))
      })
    }

    await expect(E.run(f(), layer))[
      success ? 'resolves' : 'rejects'
    ].toStrictEqual(output)
  })
})

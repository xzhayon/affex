import * as _E from './Effect'
import * as E from './Effector'
import * as F from './Fork'
import { Layer } from './Layer'
import * as T from './Tag'

describe('Fork', () => {
  describe('fork', () => {
    test('forking normal function', async () => {
      function* f() {
        return yield* _E.perform(
          F.fork()(
            async (run) =>
              [
                await run(function* () {
                  return 42
                }),
                await run(async function* () {
                  return 1337
                }),
              ] as const,
          ),
        )
      }

      await expect(E.run(f(), Layer.empty())).resolves.toStrictEqual([42, 1337])
    })

    test('forking generator function', async () => {
      function* f() {
        return yield* _E.perform(
          F.fork()(async function* (run) {
            return [
              await run(function* () {
                return 42
              }),
              await run(async function* () {
                return 1337
              }),
            ] as const
          }),
        )
      }

      await expect(E.run(f(), Layer.empty())).resolves.toStrictEqual([42, 1337])
    })

    test('forking function with effects', async () => {
      interface Get42 {
        (): 42
      }

      const tag42 = T.tag<Get42>()
      const get42 = _E.function(tag42)

      interface Get1337 {
        (): 1337
      }

      const tag1337 = T.tag<Get1337>()
      const get1337 = _E.function(tag1337)

      function* f() {
        return yield* _E.perform(
          F.fork()(function* (run) {
            const a = yield* _E.perform(get42())
            const b = yield* _E.perform(get1337())

            return run(function* () {
              return [a, b] as const
            })
          }),
        )
      }

      await expect(
        E.run(
          f(),
          Layer.empty()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })

    test('running functions with effects', async () => {
      interface Get42 {
        (): 42
      }

      const tag42 = T.tag<Get42>()
      const get42 = _E.function(tag42)

      interface Get1337 {
        (): 1337
      }

      const tag1337 = T.tag<Get1337>()
      const get1337 = _E.function(tag1337)

      function* f() {
        return yield* _E.perform(
          F.fork<Get42 | Get1337>()(
            async (run) =>
              [
                await run(function* () {
                  return yield* _E.perform(get42())
                }),
                await run(function* () {
                  return yield* _E.perform(get1337())
                }),
              ] as const,
          ),
        )
      }

      await expect(
        E.run(
          f(),
          Layer.empty()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })
  })
})

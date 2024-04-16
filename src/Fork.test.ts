import * as E from './Effector'
import * as F from './Fork'
import * as L from './Layer'
import * as T from './Tag'

describe('Fork', () => {
  describe('fork', () => {
    test('forking normal function', async () => {
      await expect(
        E.run(
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
          L.layer(),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })

    test('forking generator function', async () => {
      await expect(
        E.run(
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
          L.layer(),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })

    test('forking function with effects', async () => {
      interface Get42 {
        (): 42
      }

      const tag42 = T.tag<Get42>()
      const get42 = E.function(tag42)

      interface Get1337 {
        (): 1337
      }

      const tag1337 = T.tag<Get1337>()
      const get1337 = E.function(tag1337)

      await expect(
        E.run(
          F.fork()(function* (run) {
            const a = yield* get42()
            const b = yield* get1337()

            return run(function* () {
              return [a, b] as const
            })
          }),
          L.layer()
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
      const get42 = E.function(tag42)

      interface Get1337 {
        (): 1337
      }

      const tag1337 = T.tag<Get1337>()
      const get1337 = E.function(tag1337)

      await expect(
        E.run(
          F.fork<Get42 | Get1337>()(
            async (run) =>
              [
                await run(function* () {
                  return yield* get42()
                }),
                await run(function* () {
                  return yield* get1337()
                }),
              ] as const,
          ),
          L.layer()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })
  })
})

import * as $Effector from './Effector'
import * as $Fork from './Fork'
import * as $Layer from './Layer'
import * as $Raise from './Raise'
import * as $Runtime from './Runtime'
import * as $Tag from './Tag'

describe('Fork', () => {
  describe('fork', () => {
    test('forking normal function', async () => {
      await expect(
        $Runtime.run(
          $Fork.fork()(
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
          $Layer.layer(),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })

    test('raising unexpected error', async () => {
      await expect(
        $Runtime.run(
          $Fork.fork()((run) =>
            // @ts-expect-error
            run(function* () {
              return yield* $Raise.raise(new Error('foo'))
            }),
          ),
          $Layer.layer(),
        ),
      ).rejects.toThrow('foo')
    })

    test('raising error', async () => {
      await expect(
        $Runtime.run(
          $Fork.fork<never, Error>()((run) =>
            run(function* () {
              return yield* $Raise.raise(new Error('foo'))
            }),
          ),
          $Layer.layer(),
        ),
      ).rejects.toThrow('foo')
    })

    test('forking generator function', async () => {
      await expect(
        $Runtime.run(
          $Fork.fork()(async function* (run) {
            return [
              await run(function* () {
                return 42
              }),
              await run(async function* () {
                return 1337
              }),
            ] as const
          }),
          $Layer.layer(),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })

    test('raising error from generator function', async () => {
      await expect(
        $Runtime.run(
          $Fork.fork()(() => $Raise.raise(new Error('foo'))),
          $Layer.layer(),
        ),
      ).rejects.toThrow('foo')
    })

    test('forking function with effects', async () => {
      interface Get42 {
        (): 42
      }

      const tag42 = $Tag.tag<Get42>()
      const get42 = $Effector.function(tag42)

      interface Get1337 {
        (): 1337
      }

      const tag1337 = $Tag.tag<Get1337>()
      const get1337 = $Effector.function(tag1337)

      await expect(
        $Runtime.run(
          $Fork.fork()(function* (run) {
            const a = yield* get42()
            const b = yield* get1337()

            return run(function* () {
              return [a, b] as const
            })
          }),
          $Layer
            .layer()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })

    test('running functions with effects', async () => {
      interface Get42 {
        (): 42
      }

      const tag42 = $Tag.tag<Get42>()
      const get42 = $Effector.function(tag42)

      interface Get1337 {
        (): 1337
      }

      const tag1337 = $Tag.tag<Get1337>()
      const get1337 = $Effector.function(tag1337)

      await expect(
        $Runtime.run(
          $Fork.fork<Get42 | Get1337>()(
            async (run) => [await run(get42), await run(get1337)] as const,
          ),
          $Layer
            .layer()
            .with(tag42, () => 42)
            .with(tag1337, () => 1337),
        ),
      ).resolves.toStrictEqual([42, 1337])
    })
  })
})

import * as _E from './Effect'
import * as E from './Effector'
import * as G from './Generator'
import { Layer } from './Layer'
import * as T from './Tag'

describe('Effector', () => {
  describe('run', () => {
    test('running effector with no effects', async () => {
      await expect(
        E.run(function* () {
          yield 42
          yield 1337

          return 42 + 1337
        }, Layer.empty()),
      ).resolves.toStrictEqual(42 + 1337)
    })

    test.each([undefined, 'Add'])(
      'running effector without providing handler',
      async (description) => {
        interface Add {
          (a: number, b: number): number
        }

        const tag = T.tag<Add>(description)
        const effect = _E.function(tag)

        await expect(
          E.run(function* () {
            return yield* _E.perform(effect(42, 1337))
          }, Layer.empty() as any),
        ).rejects.toThrow(
          `Cannot find handler for effect${
            description ? ` "${description}"` : ''
          }`,
        )
      },
    )

    test.each([
      (a: number, b: number) => a + b,
      async (a: number, b: number) => a + b,
      function* (a: number, b: number) {
        return a + b
      },
      async function* (a: number, b: number) {
        return a + b
      },
    ])('handling effect from function "%s"', async (handler) => {
      interface Add {
        (a: number, b: number): number
      }

      const tag = T.tag<Add>()
      const effect = _E.function(tag)

      await expect(
        E.run(function* () {
          return yield* _E.perform(effect(42, 1337))
        }, Layer.empty().with(tag, handler)),
      ).resolves.toStrictEqual(42 + 1337)
    })

    test.each([
      <A>(a: A) => a,
      async <A>(a: A) => a,
      function* <A>(a: A) {
        return a
      },
      async function* <A>(a: A) {
        return a
      },
    ])('handling effect from generic function "%s"', async (handler) => {
      interface Identity {
        <A>(a: A): A
      }

      const tag = T.tag<Identity>()
      const effect = <A>(a: A) => _E.functionA(tag)((f) => f(a))

      await expect(
        E.run(function* () {
          return yield* _E.perform(effect(42))
        }, Layer.empty().with(tag, handler)),
      ).resolves.toStrictEqual(42)
    })

    test.each([
      { add: (a: number, b: number) => a + b },
      { add: async (a: number, b: number) => a + b },
      {
        *add(a: number, b: number) {
          return a + b
        },
      },
      {
        async *add(a: number, b: number) {
          return a + b
        },
      },
    ])('handling effect from struct "%s"', async (handler) => {
      interface Calculator {
        add(a: number, b: number): number
      }

      const tag = T.tag<Calculator>()
      const effect = _E.struct(tag)('add')

      await expect(
        E.run(function* () {
          return yield* _E.perform(effect.add(42, 1337))
        }, Layer.empty().with(tag, handler)),
      ).resolves.toStrictEqual(42 + 1337)
    })

    test.each([
      { trace: <A>(a: A) => a },
      { trace: async <A>(a: A) => a },
      {
        *trace<A>(a: A) {
          return a
        },
      },
      {
        async *trace<A>(a: A) {
          return a
        },
      },
    ])('handling effect from struct "%s"', async (handler) => {
      interface Log {
        trace<A>(a: A): A
      }

      const tag = T.tag<Log>()
      const { trace } = _E.structA(tag)('trace')
      const effect = { trace: <A>(a: A) => trace((f) => f(a)) }

      await expect(
        E.run(function* () {
          return yield* _E.perform(effect.trace(42))
        }, Layer.empty().with(tag, handler)),
      ).resolves.toStrictEqual(42)
    })

    test('concatenating effects', async () => {
      interface Log {
        trace(message: string): string
      }

      interface Clock {
        now(): Date
      }

      const tagLog = T.tag<Log>()
      const log = _E.struct(tagLog)('trace')

      const tagClock = T.tag<Clock>()
      const clock = _E.struct(tagClock)('now')

      const date = new Date()

      await expect(
        E.run(
          function* () {
            return yield* _E.perform(log.trace('foo'))
          },
          Layer.empty()
            .with(tagLog, {
              *trace(message) {
                return `${yield* _E.perform(clock.now())}\t${message}`
              },
            })
            .with(tagClock, { now: () => date }),
        ),
      ).resolves.toStrictEqual(`${date}\tfoo`)
    })

    test('handling effect with callback', async () => {
      interface Decoder<A> {
        (u: unknown): A
      }

      interface Crypto {
        number(): number
      }

      interface Cache {
        get<A, G extends Generator<unknown, A>>(
          key: string,
          decoder: Decoder<A>,
          onMiss: () => G,
        ): Generator<G.YOf<G>, A>
      }

      const tagCrypto = T.tag<Crypto>()
      const crypto = _E.struct(tagCrypto)('number')

      const tagCache = T.tag<Cache>()
      const { get } = _E.structA(tagCache)('get')
      const cache = {
        get: <A, G extends Generator<unknown, A>>(
          key: string,
          decoder: Decoder<A>,
          onMiss: () => G,
        ) => get((f) => f(key, decoder, onMiss)),
      }

      const numberDecoder = (u: unknown) => {
        if (typeof u !== 'number') {
          throw new Error()
        }

        return u
      }

      await expect(
        E.run(
          function* () {
            return yield* _E.perform(
              cache.get('foo', numberDecoder, function* () {
                return yield* _E.perform(crypto.number())
              }),
            )
          },
          Layer.empty()
            .with(tagCrypto, { number: () => 42 })
            .with(tagCache, {
              *get(_key, _decoder, onMiss) {
                return yield* onMiss()
              },
            }),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})

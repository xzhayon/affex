import * as E from './Effector'
import * as F from './Fiber'
import * as G from './Generator'
import * as L from './Layer'
import * as T from './Tag'

describe('Fiber', () => {
  describe('run', () => {
    test('running effector with no effects', async () => {
      await expect(
        F.run(function* () {
          yield 42
          yield 1337

          return 42 + 1337
        }, L.layer()),
      ).resolves.toStrictEqual(42 + 1337)
    })

    test.each([undefined, 'Add'])(
      'running effector without providing handler',
      async (description) => {
        interface Add {
          (a: number, b: number): number
        }

        const tag = T.tag<Add>(description)
        const add = E.function(tag)

        await expect(F.run(add(42, 1337), L.layer() as any)).rejects.toThrow(
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
      const add = E.function(tag)

      await expect(
        F.run(add(42, 1337), L.layer().with(tag, handler)),
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
      const identity = <A>(a: A) => E.functionA(tag)((r) => r(a))

      await expect(
        F.run(identity(42), L.layer().with(tag, handler)),
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
      const calculator = E.struct(tag)('add')

      await expect(
        F.run(calculator.add(42, 1337), L.layer().with(tag, handler)),
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
      const { trace } = E.structA(tag)('trace')
      const log = { trace: <A>(a: A) => trace((r) => r(a)) }

      await expect(
        F.run(log.trace(42), L.layer().with(tag, handler)),
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
      const log = E.struct(tagLog)('trace')

      const tagClock = T.tag<Clock>()
      const clock = E.struct(tagClock)('now')

      const date = new Date()

      await expect(
        F.run(
          log.trace('foo'),
          L.layer()
            .with(tagLog, {
              *trace(message) {
                return `${yield* clock.now()}\t${message}`
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
      const crypto = E.struct(tagCrypto)('number')

      const tagCache = T.tag<Cache>()
      const { get } = E.structA(tagCache)('get')
      const cache = {
        get: <A, G extends Generator<unknown, A>>(
          key: string,
          decoder: Decoder<A>,
          onMiss: () => G,
        ) => get((r) => r(key, decoder, onMiss)),
      }

      const numberDecoder = (u: unknown) => {
        if (typeof u !== 'number') {
          throw new Error()
        }

        return u
      }

      await expect(
        F.run(
          cache.get('foo', numberDecoder, crypto.number),
          L.layer()
            .with(tagCrypto, { number: () => 42 })
            .with(tagCache, { get: (_key, _decoder, onMiss) => onMiss() }),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})

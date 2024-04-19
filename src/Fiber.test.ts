import * as $Effector from './Effector'
import * as $Fiber from './Fiber'
import * as $Generator from './Generator'
import * as $Layer from './Layer'
import * as $Tag from './Tag'

describe('Fiber', () => {
  describe('run', () => {
    test('running effector with no effects', async () => {
      await expect(
        $Fiber.run(function* () {
          yield 42
          yield 1337

          return 42 + 1337
        }, $Layer.layer()),
      ).resolves.toStrictEqual(42 + 1337)
    })

    test.each([undefined, 'Add'])(
      'running effector without providing handler',
      async (description) => {
        interface Add {
          (a: number, b: number): number
        }

        const tag = $Tag.tag<Add>(description)
        const add = $Effector.function(tag)

        // @ts-expect-error
        await expect($Fiber.run(add(42, 1337), $Layer.layer())).rejects.toThrow(
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

      const tag = $Tag.tag<Add>()
      const add = $Effector.function(tag)

      await expect(
        $Fiber.run(add(42, 1337), $Layer.layer().with(tag, handler)),
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

      const tag = $Tag.tag<Identity>()
      const identity = <A>(a: A) => $Effector.functionA(tag)((r) => r(a))

      await expect(
        $Fiber.run(identity(42), $Layer.layer().with(tag, handler)),
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

      const tag = $Tag.tag<Calculator>()
      const calculator = $Effector.struct(tag)('add')

      await expect(
        $Fiber.run(calculator.add(42, 1337), $Layer.layer().with(tag, handler)),
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

      const tag = $Tag.tag<Log>()
      const { trace } = $Effector.structA(tag)('trace')
      const log = { trace: <A>(a: A) => trace((r) => r(a)) }

      await expect(
        $Fiber.run(log.trace(42), $Layer.layer().with(tag, handler)),
      ).resolves.toStrictEqual(42)
    })

    test('concatenating effects', async () => {
      interface Log {
        trace(message: string): string
      }

      interface Clock {
        now(): Date
      }

      const tagLog = $Tag.tag<Log>()
      const log = $Effector.struct(tagLog)('trace')

      const tagClock = $Tag.tag<Clock>()
      const clock = $Effector.struct(tagClock)('now')

      const date = new Date()

      await expect(
        $Fiber.run(
          log.trace('foo'),
          $Layer
            .layer()
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
        ): Generator<$Generator.YOf<G>, A>
      }

      const tagCrypto = $Tag.tag<Crypto>()
      const crypto = $Effector.struct(tagCrypto)('number')

      const tagCache = $Tag.tag<Cache>()
      const { get } = $Effector.structA(tagCache)('get')
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
        $Fiber.run(
          cache.get('foo', numberDecoder, crypto.number),
          $Layer
            .layer()
            .with(tagCrypto, { number: () => 42 })
            .with(tagCache, { get: (_key, _decoder, onMiss) => onMiss() }),
        ),
      ).resolves.toStrictEqual(42)
    })
  })
})

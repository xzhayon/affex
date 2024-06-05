import { AnyEffector, ContextOf, ErrorOf } from '../Effector'
import * as $Tag from '../Tag'
import { uri } from '../Type'
import * as $Context from '../runtime/Context'
import * as $Layer from '../runtime/Layer'
import * as $Runtime from '../runtime/Runtime'
import * as $Proxy from './Proxy'

describe('Proxy', () => {
  test('concatenating effects', async () => {
    interface Log {
      readonly [uri]?: unique symbol
      trace(message: string): string
    }

    interface Clock {
      readonly [uri]?: unique symbol
      now(): Date
    }

    const tagLog = $Tag.tag<Log>()
    const log = $Proxy.service(tagLog)('trace')

    const tagClock = $Tag.tag<Clock>()
    const clock = $Proxy.service(tagClock)('now')

    const date = new Date()

    await expect(
      $Runtime.runPromise(
        log.trace('foo'),
        $Context
          .context()
          .with(
            $Layer.layer(tagLog, {
              *trace(message) {
                return `${yield* clock.now()}\t${message}`
              },
            }),
          )
          .with($Layer.layer(tagClock, { now: () => date })),
      ),
    ).resolves.toStrictEqual(`${date}\tfoo`)
  })

  test('proxying effect with callback', async () => {
    interface Decoder<A> {
      readonly [uri]?: unique symbol
      (u: unknown): A
    }

    interface Crypto {
      readonly [uri]?: unique symbol
      number(): number
    }

    interface Cache {
      readonly [uri]?: unique symbol
      get<A, G extends AnyEffector<A, any, any>>(
        key: string,
        decoder: Decoder<A>,
        onMiss: () => G,
      ): AnyEffector<A, ErrorOf<G>, ContextOf<G>>
    }

    const tagCrypto = $Tag.tag<Crypto>()
    const crypto = $Proxy.service(tagCrypto)('number')

    const tagCache = $Tag.tag<Cache>()
    const { get } = $Proxy.access(tagCache)('get')
    const cache = {
      get: <A, G extends AnyEffector<A, any, any>>(
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
      $Runtime.runPromise(
        cache.get('foo', numberDecoder, crypto.number),
        $Context
          .context()
          .with($Layer.layer(tagCrypto, { number: () => 42 }))
          .with(
            $Layer.layer(tagCache, {
              get: async function* (_key, _decoder, onMiss) {
                return yield* onMiss()
              },
            }),
          ),
      ),
    ).resolves.toStrictEqual(42)
  })

  describe('access', () => {
    test.each([
      <A>(a: A) => a,
      async <A>(a: A) => a,
      function* <A>(a: A) {
        return a
      },
      async function* <A>(a: A) {
        return a
      },
    ])('proxying generic operation "%s"', async (handler) => {
      interface Identity {
        readonly [uri]?: unique symbol
        <A>(a: A): A
      }

      const tag = $Tag.tag<Identity>()
      const identity = <A>(a: A) => $Proxy.access(tag)((r) => r(a))

      await expect(
        $Runtime.runPromise(
          identity(42),
          $Context.context().with($Layer.layer(tag, handler)),
        ),
      ).resolves.toStrictEqual(42)
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
    ])('proxying service "%s"', async (handler) => {
      interface Log {
        readonly [uri]?: unique symbol
        trace<A>(a: A): A
      }

      const tag = $Tag.tag<Log>()
      const { trace } = $Proxy.access(tag)('trace')
      const log = { trace: <A>(a: A) => trace((r) => r(a)) }

      await expect(
        $Runtime.runPromise(
          log.trace(42),
          $Context.context().with($Layer.layer(tag, handler)),
        ),
      ).resolves.toStrictEqual(42)
    })
  })

  describe('operation', () => {
    test.each([
      (a: number, b: number) => a + b,
      async (a: number, b: number) => a + b,
      function* (a: number, b: number) {
        return a + b
      },
      async function* (a: number, b: number) {
        return a + b
      },
    ])('proxying operation "%s"', async (handler) => {
      interface Add {
        readonly [uri]?: unique symbol
        (a: number, b: number): number
      }

      const tag = $Tag.tag<Add>()
      const add = $Proxy.operation(tag)

      await expect(
        $Runtime.runPromise(
          add(42, 1337),
          $Context.context().with($Layer.layer(tag, handler)),
        ),
      ).resolves.toStrictEqual(42 + 1337)
    })
  })

  describe('service', () => {
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
    ])('proxying service "%s"', async (handler) => {
      interface Calculator {
        readonly [uri]?: unique symbol
        add(a: number, b: number): number
      }

      const tag = $Tag.tag<Calculator>()
      const calculator = $Proxy.service(tag)('add')

      await expect(
        $Runtime.runPromise(
          calculator.add(42, 1337),
          $Context.context().with($Layer.layer(tag, handler)),
        ),
      ).resolves.toStrictEqual(42 + 1337)
    })
  })
})

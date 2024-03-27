import { Builder } from './Builder'
import * as E from './Effect'
import * as T from './Tag'

describe('Builder', () => {
  describe('build', () => {
    test('running generator with no effects', async () => {
      function* f() {
        yield 42
        yield 1337

        return 42 + 1337
      }

      await expect(Builder.create(f()).build()).resolves.toStrictEqual(
        42 + 1337,
      )
    })
    test('running effect without providing handler', async () => {
      interface Add {
        (a: number, b: number): number
      }

      const tag = T.tag<Add>('Add')
      const effect = E.function(tag)

      function* f() {
        return yield* E.perform(effect(42, 1337))
      }

      await expect((Builder.create(f()) as any).build()).rejects.toThrow(
        'Cannot find handler for effect "Add"',
      )
    })
    test.each([
      (a: number, b: number) => a + b,
      async (a: number, b: number) => a + b,
      function* (a: number, b: number) {
        return a + b
      },
    ])('running effect from function "%s"', async (handler) => {
      interface Add {
        (a: number, b: number): number
      }

      const tag = T.tag<Add>()
      const effect = E.function(tag)

      function* f() {
        return yield* E.perform(effect(42, 1337))
      }

      await expect(
        Builder.create(f()).with(tag, handler).build(),
      ).resolves.toStrictEqual(42 + 1337)
    })
    test.each([
      <A>(a: A) => a,
      async <A>(a: A) => a,
      function* <A>(a: A) {
        return a
      },
    ])('running effect from generic function "%s"', async (handler) => {
      interface Identity {
        <A>(a: A): A
      }

      const tag = T.tag<Identity>()
      const effect = <A>(a: A) => E.functionA(tag)((f) => f(a))

      function* f() {
        return yield* E.perform(effect(42))
      }

      await expect(
        Builder.create(f()).with(tag, handler).build(),
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
    ])('running effect from struct "%s"', async (handler) => {
      interface Calculator {
        add(a: number, b: number): number
      }

      const tag = T.tag<Calculator>()
      const effect = E.struct(tag)('add')

      function* f() {
        return yield* E.perform(effect.add(42, 1337))
      }

      await expect(
        Builder.create(f()).with(tag, handler).build(),
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
    ])('running effect from struct "%s"', async (handler) => {
      interface Log {
        trace<A>(a: A): A
      }

      const tag = T.tag<Log>()
      const { trace } = E.structA(tag)('trace')
      const effect = { trace: <A>(a: A) => trace((f) => f(a)) }

      function* f() {
        return yield* E.perform(effect.trace(42))
      }

      await expect(
        Builder.create(f()).with(tag, handler).build(),
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
      function* f() {
        return yield* E.perform(log.trace('foo'))
      }

      await expect(
        Builder.create(f())
          .with(tagLog, {
            *trace(message) {
              return `${yield* E.perform(clock.now())}\t${message}`
            },
          })
          .with(tagClock, { now: () => date })
          .build(),
      ).resolves.toStrictEqual(`${date}\tfoo`)
    })
  })
})

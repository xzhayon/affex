import * as E from './Effect'
import { Handler } from './Handler'
import * as T from './Tag'

describe('Effect', () => {
  describe('function', () => {
    test('creating effect from function', () => {
      interface Add {
        (a: number, b: number): number
      }

      const tag = T.tag<Add>()
      const effect = E.function(tag)

      expect(effect(42, 1337).f((a, b) => a + b)).toStrictEqual(42 + 1337)
    })
  })

  describe('functionA', () => {
    test('creating effect from generic function', () => {
      interface Identity {
        <A>(a: A): A
      }

      const tag = T.tag<Identity>()
      const effect = <A>(a: A) => E.functionA(tag)((f) => f(a))

      expect(effect(42).f((a) => a)).toStrictEqual(42)
    })
  })

  describe('struct', () => {
    test('creating effect from struct', () => {
      interface Calculator {
        add(a: number, b: number): number
        multiply(a: number, b: number): number
      }

      const tag = T.tag<Calculator>()
      const effect = E.struct(tag)('add')
      const calculator = {
        add(a, b) {
          return a + b
        },
        multiply(a, b) {
          return a * b
        },
      } satisfies Handler<Calculator>

      expect(effect.add(42, 1337).f(calculator)).toStrictEqual(42 + 1337)
    })
    test('creating effect from generic struct', () => {
      interface Repository<A> {
        find(id: string): A
      }

      interface User {
        id: string
      }

      const tag = T.tag<Repository<User>>()
      const effect = E.struct(tag)('find')
      const repository = {
        find(id) {
          return { id }
        },
      } satisfies Handler<Repository<User>>

      expect(effect.find('foo').f(repository)).toStrictEqual({ id: 'foo' })
    })
  })

  describe('structA', () => {
    test('creating effect from struct with generic function', () => {
      interface Log {
        debug<A>(a: A): A
        emergency<A>(a: A): A
      }

      const tag = T.tag<Log>()
      const { debug } = E.structA(tag)('debug')
      const effect = { debug: <A>(a: A) => debug((f) => f(a)) }
      const log = {
        debug<A>(a: A) {
          return a
        },
        emergency<A>(a: A) {
          return a
        },
      } satisfies Handler<Log>

      expect(effect.debug(42).f(log)).toStrictEqual(42)
    })
  })
})

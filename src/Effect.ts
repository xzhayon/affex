import { Effector } from './Effector'
import { Function } from './Function'
import { NonEmptyArray } from './NonEmptyArray'
import * as S from './Struct'
import { Struct } from './Struct'
import { Tag } from './Tag'
import { URI } from './Type'

export interface Effect<R, A> {
  readonly [URI]: 'Effect'
  readonly key: symbol
  readonly f: (r: R) => A
}

export type ROf<E extends Effect<any, any>> = E extends Effect<infer R, any>
  ? R
  : never

function effect<R, A>(
  { key }: Tag<R>,
  f: (r: R) => A,
): Effect<R, A extends Promise<any> ? Awaited<A> : A> {
  return { [URI]: 'Effect', key, f: f as any }
}

export function functionA<R extends Function>(tag: Tag<R>) {
  return <A>(f: (r: R) => A) => effect(tag, f)
}

function _function<R extends Function>(tag: Tag<R>) {
  return (...args: Parameters<R>) =>
    functionA(tag)((f): ReturnType<R> => f(...args))
}
export { _function as function }

export function structA<R extends Struct>(tag: Tag<R>) {
  return <
    K extends { [K in keyof R]: R[K] extends Function ? K : never }[keyof R],
  >(
    ...keys: NonEmptyArray<K>
  ) =>
    keys.reduce(
      (effects, key) => ({
        ...effects,
        [key]: <A>(f: (r: R[K]) => A) => effect(tag, (r) => f(r[key])),
      }),
      {},
    ) as {
      [_K in K]: <A>(
        f: (r: R[_K]) => A,
      ) => Effect<R, A extends Promise<any> ? Awaited<A> : A>
    }
}

export function struct<R extends Struct>(tag: Tag<R>) {
  return <
    K extends { [K in keyof R]: R[K] extends Function ? K : never }[keyof R],
  >(
    ...keys: NonEmptyArray<K>
  ) =>
    keys.reduce(
      (effects, key) => ({
        ...effects,
        [key]: (...args: any) => effect(tag, (r: any) => r[key](...args)),
      }),
      {},
    ) as {
      [_K in K]: R[_K] extends Function
        ? (
            ...args: Parameters<R[_K]>
          ) => Effect<
            R,
            ReturnType<R[_K]> extends Promise<any>
              ? Awaited<ReturnType<R[_K]>>
              : ReturnType<R[_K]>
          >
        : never
    }
}

export function is(u: unknown): u is Effect<unknown, unknown> {
  return S.is(u) && S.has(u, URI) && u[URI] === 'Effect'
}

export function* perform<R, A>(effect: Effect<R, A>): Effector<R, A> {
  return yield effect as R extends any ? Effect<R, A> : never
}

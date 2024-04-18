import { Equal } from '@type-challenges/utils'
import * as Ef from './Effect'
import { Use } from './Effect'
import * as Er from './Error'
import { Throw } from './Error'
import { Function } from './Function'
import * as G from './Generator'
import { Generated } from './Generator'
import { NonEmptyArray } from './NonEmptyArray'
import { Struct } from './Struct'
import { Tag } from './Tag'

export type Effector<R, A, E = never> = Generator<
  R extends any ? Use<R> : never,
  A,
  Equal<E, never> extends true ? unknown : Throw<E>
>

export type AsyncEffector<R, A, E = never> = AsyncGenerator<
  R extends any ? Use<R> : never,
  A,
  Equal<E, never> extends true ? unknown : Throw<E>
>

export function functionA<R extends Function>(tag: Tag<R>) {
  return <A>(f: (r: R) => A) => Ef.perform(Ef.effect(tag, f))
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
        [key]: <A>(f: (r: R[K]) => A) =>
          Ef.perform(Ef.effect(tag, (r) => f(r[key]))),
      }),
      {},
    ) as {
      [_K in K]: <A>(
        f: (r: R[_K]) => A,
      ) => Effector<
        | R
        | (A extends Generator | AsyncGenerator
            ? G.YOf<A> extends infer U extends Use<any>
              ? Ef.ROf<U>
              : never
            : never),
        Exclude<Generated<Awaited<A>>, Error>,
        A extends Generator | AsyncGenerator
          ? G.NOf<A> extends infer T extends Throw<any>
            ? Er.EOf<T>
            : never
          : A extends Error
          ? A
          : never
      >
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
        [key]: (...args: any) =>
          Ef.perform(Ef.effect(tag, (r: any) => r[key](...args))),
      }),
      {},
    ) as {
      [_K in K]: R[_K] extends Function
        ? (
            ...args: Parameters<R[_K]>
          ) => Effector<
            | R
            | (ReturnType<R[_K]> extends Generator | AsyncGenerator
                ? G.YOf<ReturnType<R[_K]>> extends infer U extends Use<any>
                  ? Ef.ROf<U>
                  : never
                : never),
            Generated<Awaited<ReturnType<R[_K]>>>,
            ReturnType<R[_K]> extends Generator | AsyncGenerator
              ? G.NOf<ReturnType<R[_K]>> extends infer T extends Throw<any>
                ? Er.EOf<T>
                : never
              : ReturnType<R[_K]> extends Error
              ? ReturnType<R[_K]>
              : never
          >
        : never
    }
}

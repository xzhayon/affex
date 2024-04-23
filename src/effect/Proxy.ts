import { Effector } from '../Effector'
import { Function } from '../Function'
import * as $Generator from '../Generator'
import { AnyGenerator, Generated } from '../Generator'
import { Handler } from '../Handler'
import { NonEmptyArray } from '../NonEmptyArray'
import * as $Result from '../Result'
import { Result, Resulted } from '../Result'
import { Struct } from '../Struct'
import { Tag } from '../Tag'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

declare const E: unique symbol
export interface Proxy<R, A, E> extends _Effect<'Proxy'> {
  readonly [E]?: E
  readonly tag: Tag<R>
  readonly handle: Handler<(handler: Handler<R>) => A>
}

function proxy<R, F extends Handler<(handler: Handler<R>) => any>>(
  tag: Tag<R>,
  handle: F,
): Effect<
  | R
  | (ReturnType<F> extends infer G extends AnyGenerator
      ? $Generator.UOf<G>
      : never),
  Awaited<Generated<Resulted<ReturnType<F>>>>,
  | (ReturnType<F> extends infer G extends AnyGenerator
      ? $Generator.TOf<G>
      : never)
  | (Awaited<Generated<ReturnType<F>>> extends infer _R extends Result<any, any>
      ? $Result.EOf<_R>
      : never)
> {
  return { ..._effect('Proxy'), tag, handle }
}

export function functionA<R extends Function>(tag: Tag<R>) {
  return <A>(
    handle: (r: R | (() => never)) => A,
  ): Effector<
    R | (A extends infer G extends AnyGenerator ? $Generator.UOf<G> : never),
    Awaited<Generated<Resulted<A>>>,
    | (A extends infer G extends AnyGenerator ? $Generator.TOf<G> : never)
    | (Awaited<Generated<A>> extends infer _R extends Result<any, any>
        ? $Result.EOf<_R>
        : never)
  > => $Effect.perform(proxy(tag, handle as any))
}

function _function<R extends Function>(tag: Tag<R>) {
  return (...args: Parameters<R>) =>
    functionA(tag)((r): ReturnType<R> => r(...args))
}
export { _function as function }

export function structA<R extends Struct>(tag: Tag<R>) {
  return <
    K extends { [_K in keyof R]: R[_K] extends Function ? _K : never }[keyof R],
  >(
    ...keys: NonEmptyArray<K>
  ) =>
    keys.reduce(
      (effects, key) => ({
        ...effects,
        [key]: <A>(handle: (r: R[K] | (() => never)) => A) =>
          $Effect.perform(proxy(tag, (handler: any) => handle(handler[key]))),
      }),
      {},
    ) as {
      [_K in K]: <A>(
        handle: (r: R[_K] | (() => never)) => A,
      ) => Effector<
        | R
        | (A extends infer G extends AnyGenerator ? $Generator.UOf<G> : never),
        Awaited<Generated<Resulted<A>>>,
        | (A extends infer G extends AnyGenerator ? $Generator.TOf<G> : never)
        | (Awaited<Generated<A>> extends infer _R extends Result<any, any>
            ? $Result.EOf<_R>
            : never)
      >
    }
}

export function struct<R extends Struct>(tag: Tag<R>) {
  return <
    K extends { [_K in keyof R]: R[_K] extends Function ? _K : never }[keyof R],
  >(
    ...keys: NonEmptyArray<K>
  ) =>
    keys.reduce(
      (effects, key) => ({
        ...effects,
        [key]: (...args: any) =>
          $Effect.perform(proxy(tag, (handler: any) => handler[key](...args))),
      }),
      {},
    ) as {
      [_K in K]: R[_K] extends Function
        ? (
            ...args: Parameters<R[_K]>
          ) => Effector<
            | R
            | (ReturnType<R[_K]> extends infer G extends AnyGenerator
                ? $Generator.UOf<G>
                : never),
            Awaited<Generated<ReturnType<R[_K]>>>,
            | (ReturnType<R[_K]> extends infer G extends AnyGenerator
                ? $Generator.TOf<G>
                : never)
            | (Awaited<
                Generated<ReturnType<R[_K]>>
              > extends infer _R extends Result<any, any>
                ? $Result.EOf<_R>
                : never)
          >
        : never
    }
}

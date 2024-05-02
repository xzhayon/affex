import { AnyEffector, Effector, ErrorOf, RequirementOf } from '../Effector'
import { Function } from '../Function'
import { AnyGenerator, Generated } from '../Generator'
import { NonEmptyArray } from '../NonEmptyArray'
import * as $Result from '../Result'
import { Result, Resulted } from '../Result'
import { Struct } from '../Struct'
import { Tag } from '../Tag'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Proxy<A, E, R> extends _Effect<'Proxy'> {
  readonly tag: Tag<R>
  readonly handle: (handler: unknown) => A | Promise<A> | AnyEffector<A, E, R>
}

type Unwrapped<A> = Resulted<Awaited<Generated<Resulted<A>>>>

function proxy<R, F extends (handler: any) => any>(
  tag: Tag<R>,
  handle: F,
): Effect<
  Unwrapped<ReturnType<F>>,
  | (ReturnType<F> extends infer G extends AnyGenerator ? ErrorOf<G> : never)
  | (Awaited<Generated<ReturnType<F>>> extends infer _R extends Result<any, any>
      ? $Result.EOf<_R>
      : never),
  | R
  | (ReturnType<F> extends infer G extends AnyGenerator
      ? RequirementOf<G>
      : never)
> {
  return { ..._effect('Proxy'), tag, handle }
}

export function functionA<R extends Function>(tag: Tag<R>) {
  return <A>(
    handle: (handler: R) => A,
  ): Effector<
    Unwrapped<A>,
    | (A extends AnyGenerator ? ErrorOf<A> : never)
    | (Awaited<Generated<A>> extends infer _R extends Result<any, any>
        ? $Result.EOf<_R>
        : never),
    R | (A extends AnyGenerator ? RequirementOf<A> : never)
  > => $Effect.perform(proxy(tag, handle))
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
        [key]: <A>(handle: (r: R[K]) => A) =>
          $Effect.perform(proxy(tag, (handler) => handle(handler[key]))),
      }),
      {},
    ) as {
      [_K in K]: <A>(
        handle: (r: R[_K]) => A,
      ) => Effector<
        Unwrapped<A>,
        | (A extends AnyGenerator ? ErrorOf<A> : never)
        | (Awaited<Generated<A>> extends infer _R extends Result<any, any>
            ? $Result.EOf<_R>
            : never),
        R | (A extends AnyGenerator ? RequirementOf<A> : never)
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
          $Effect.perform(proxy(tag, (handler) => handler[key](...args))),
      }),
      {},
    ) as {
      [_K in K]: R[_K] extends Function
        ? (
            ...args: Parameters<R[_K]>
          ) => Effector<
            Unwrapped<ReturnType<R[_K]>>,
            | (ReturnType<R[_K]> extends infer G extends AnyGenerator
                ? ErrorOf<G>
                : never)
            | (Awaited<
                Generated<ReturnType<R[_K]>>
              > extends infer _R extends Result<any, any>
                ? $Result.EOf<_R>
                : never),
            | R
            | (ReturnType<R[_K]> extends infer G extends AnyGenerator
                ? RequirementOf<G>
                : never)
          >
        : never
    }
}

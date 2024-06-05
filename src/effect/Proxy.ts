import { AnyEffector, ContextOf, Effector, ErrorOf } from '../Effector'
import * as $Function from '../Function'
import { Function } from '../Function'
import { AnyGenerator, Generated } from '../Generator'
import { NonEmptyArray } from '../NonEmptyArray'
import { Struct } from '../Struct'
import { Tag } from '../Tag'
import { Handler } from '../runtime/Handler'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Proxy<out A, out E, out R> extends _Effect<'Proxy'> {
  readonly tag: Tag<any>
  readonly handle: <_R extends R>(
    handler: Handler<_R>,
  ) => A | Promise<A> | AnyEffector<A, E, R>
}

type Unwrapped<A> = Awaited<Generated<A>>

function proxy<R, F extends (handler: any) => any>(
  tag: Tag<R>,
  handle: F,
): Effect<
  Unwrapped<ReturnType<F>>,
  ReturnType<F> extends infer G extends AnyGenerator ? ErrorOf<G> : never,
  | R
  | (ReturnType<F> extends infer G extends AnyGenerator ? ContextOf<G> : never)
> {
  return { ..._effect('Proxy'), tag, handle }
}

export function access<R extends Function>(
  tag: Tag<R>,
): <A>(
  handle: (handler: R) => A,
) => Effector<
  Unwrapped<A>,
  A extends AnyGenerator ? ErrorOf<A> : never,
  R | (A extends AnyGenerator ? ContextOf<A> : never)
>
export function access<R extends Struct>(
  tag: Tag<R>,
): <
  K extends { [_K in keyof R]: R[_K] extends Function ? _K : never }[keyof R],
>(
  ...keys: NonEmptyArray<K>
) => {
  [_K in K]: <A>(
    handle: (r: R[_K]) => A,
  ) => Effector<
    Unwrapped<A>,
    A extends AnyGenerator ? ErrorOf<A> : never,
    R | (A extends AnyGenerator ? ContextOf<A> : never)
  >
}
export function access<R extends Function | Struct>(tag: Tag<R>): any {
  return (...args: Function[] | string[]) => {
    return $Function.is(args[0])
      ? $Effect.perform(proxy(tag, args[0]))
      : (args as string[]).reduce(
          (effects, key) => ({
            ...effects,
            [key]: <A>(handle: (r: R[keyof R]) => A) =>
              $Effect.perform(proxy(tag, (handler) => handle(handler[key]))),
          }),
          {},
        )
  }
}

export function operation<R extends Function>(tag: Tag<R>) {
  return (...args: Parameters<R>) =>
    access(tag)((r): ReturnType<R> => r(...args))
}

export function service<R extends Struct>(tag: Tag<R>) {
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
            ReturnType<R[_K]> extends infer G extends AnyGenerator
              ? ErrorOf<G>
              : never,
            | R
            | (ReturnType<R[_K]> extends infer G extends AnyGenerator
                ? ContextOf<G>
                : never)
          >
        : never
    }
}

import { Equal } from '@type-challenges/utils'
import { Throw, Use } from '../Effector'
import { Exit } from '../Exit'
import * as $Generator from '../Generator'
import { AnyGenerator, Generated } from '../Generator'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect } from './Effect'

export interface Fork<R, A, E> extends _Effect<'Fork'> {
  handle(
    run: <
      G extends AnyGenerator<
        Equal<R, never> extends false ? (R extends any ? Use<R> : never) : never
      >,
    >(
      effector: OrLazy<G>,
    ) => Promise<Exit<$Generator.ROf<G>, $Generator.TOf<G>>>,
  ):
    | (Equal<E, never> extends true ? A | Promise<A> : never)
    | AnyGenerator<
        Equal<R, never> extends false
          ? R extends any
            ? Use<R>
            : never
          : never,
        A,
        Equal<E, never> extends false
          ? E extends any
            ? Throw<E>
            : never
          : never
      >
}

function _fork<
  R,
  F extends (
    run: <
      G extends AnyGenerator<
        Equal<R, never> extends false ? (R extends any ? Use<R> : never) : never
      >,
    >(
      effector: OrLazy<G>,
    ) => Promise<Exit<$Generator.ROf<G>, $Generator.TOf<G>>>,
  ) => any,
>(
  handle: F,
): Effect<
  | R
  | (ReturnType<F> extends infer G extends AnyGenerator
      ? $Generator.UOf<G>
      : never),
  Awaited<Generated<ReturnType<F>>>,
  ReturnType<F> extends infer G extends AnyGenerator ? $Generator.TOf<G> : never
> {
  return { [$Type.uri]: $Effect.uri, [$Type.tag]: 'Fork', handle }
}

export function fork<R = never>() {
  return <
    F extends (
      run: <
        G extends AnyGenerator<
          Equal<R, never> extends false
            ? R extends any
              ? Use<R>
              : never
            : never
        >,
      >(
        effector: OrLazy<G>,
      ) => Promise<Exit<$Generator.ROf<G>, $Generator.TOf<G>>>,
    ) => any,
  >(
    handle: F,
  ) => $Effect.perform(_fork<R, F>(handle))
}

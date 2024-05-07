import { AnyEffector, ContextOf, ErrorOf, OutputOf } from '../Effector'
import { Exit } from '../Exit'
import { AnyGenerator, Generated } from '../Generator'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Fork<A, E, R> extends _Effect<'Fork'> {
  readonly handle: (
    run: <G extends AnyEffector<any, any, R>>(
      effector: OrLazy<G>,
    ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
  ) => A | Promise<A> | AnyEffector<A, E, R>
}

function _fork<
  R,
  F extends (
    run: <G extends AnyEffector<any, any, R>>(
      effector: OrLazy<G>,
    ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
  ) => any,
>(
  handle: F,
): Effect<
  Awaited<Generated<ReturnType<F>>>,
  ReturnType<F> extends infer G extends AnyGenerator ? ErrorOf<G> : never,
  | R
  | (ReturnType<F> extends infer G extends AnyGenerator ? ContextOf<G> : never)
> {
  return { ..._effect('Fork'), handle }
}

export function fork<R = never>() {
  return <
    F extends (
      run: <G extends AnyEffector<any, any, R>>(
        effector: OrLazy<G>,
      ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
    ) => any,
  >(
    handle: F,
  ) => $Effect.perform(_fork<R, F>(handle))
}

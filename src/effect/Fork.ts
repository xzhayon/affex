import { AnyEffector, ErrorOf, OutputOf, RequirementOf } from '../Effector'
import { Exit } from '../Exit'
import { AnyGenerator, Generated } from '../Generator'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Fork<R, A, E> extends _Effect<'Fork'> {
  readonly handle: (
    run: <G extends AnyEffector<R, any, any>>(
      effector: OrLazy<G>,
    ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
  ) => A | Promise<A> | AnyEffector<R, A, E>
}

function _fork<
  R,
  F extends (
    run: <G extends AnyEffector<R, any, any>>(
      effector: OrLazy<G>,
    ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
  ) => any,
>(
  handle: F,
): Effect<
  | R
  | (ReturnType<F> extends AnyGenerator ? RequirementOf<ReturnType<F>> : never),
  Awaited<Generated<ReturnType<F>>>,
  ReturnType<F> extends AnyGenerator ? ErrorOf<ReturnType<F>> : never
> {
  return { ..._effect('Fork'), handle }
}

export function fork<R = never>() {
  return <
    F extends (
      run: <G extends AnyEffector<R, any, any>>(
        effector: OrLazy<G>,
      ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
    ) => any,
  >(
    handle: F,
  ) => $Effect.perform(_fork<R, F>(handle))
}

import { AnyEffector, ContextOf, ErrorOf, OutputOf } from '../Effector'
import { Exit } from '../Exit'
import { AnyGenerator, Generated } from '../Generator'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Backdoor<out A, out E, out R> extends _Effect<'Backdoor'> {
  readonly handle: <_R extends R>(
    run: <G extends AnyEffector<any, any, R>>(
      effector: OrLazy<G>,
    ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
  ) => A | Promise<A> | AnyEffector<A, E, _R>
}

function backdoor<
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
  return { ..._effect('Backdoor'), handle }
}

export function exploit<R = never>() {
  return <
    F extends (
      run: <G extends AnyEffector<any, any, R>>(
        effector: OrLazy<G>,
      ) => Promise<Exit<OutputOf<G>, ErrorOf<G>>>,
    ) => any,
  >(
    handle: F,
  ) => $Effect.perform(backdoor<R, F>(handle))
}

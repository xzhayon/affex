import { AnyEffector, ContextOf, ErrorOf } from '../Effector'
import * as $Function from '../Function'
import { ReturnOf } from '../Generator'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Scope<out A, out E, out R> extends _Effect<'Scope'> {
  readonly effector: () => AnyEffector<A, E, R>
}

function _scope<G extends AnyEffector<any, any, any>>(
  effector: () => G,
): Effect<ReturnOf<G>, ErrorOf<G>, ContextOf<G>> {
  return { ..._effect('Scope'), effector }
}

export function scope<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
) {
  return $Effect.perform(
    _scope($Function.is(effector) ? effector : () => effector),
  )
}

import { AnyEffector, ErrorOf, OutputOf, RequirementOf } from '../Effector'
import * as $Function from '../Function'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Sandbox<A, E, R> extends _Effect<'Sandbox'> {
  readonly try: AnyEffector<A, any, R>
  readonly catch: (error: ErrorOf<this['try']>) => AnyEffector<A, E, R>
}

export function sandbox<
  A extends AnyEffector<any, any, any>,
  B extends AnyEffector<any, any, any>,
>(
  _try: A,
  _catch: (error: ErrorOf<A>) => B,
): Effect<
  OutputOf<A> | OutputOf<B>,
  ErrorOf<B>,
  RequirementOf<A> | RequirementOf<B>
> {
  return { ..._effect('Sandbox'), try: _try, catch: _catch }
}

export function tryCatch<
  A extends AnyEffector<any, any, any>,
  B extends AnyEffector<any, any, any>,
>(_try: OrLazy<A>, _catch: (error: ErrorOf<A>) => B) {
  return $Effect.perform(sandbox($Function.is(_try) ? _try() : _try, _catch))
}

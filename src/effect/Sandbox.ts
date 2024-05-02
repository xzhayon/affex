import { AnyEffector, ErrorOf, OutputOf, RequirementOf } from '../Effector'
import * as $Function from '../Function'
import { AnyGenerator, Generated } from '../Generator'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Sandbox<A, E, R> extends _Effect<'Sandbox'> {
  readonly try: AnyEffector<A, any, R>
  readonly catch: (
    error: ErrorOf<this['try']>,
  ) => A | Promise<A> | AnyEffector<A, E, R>
}

export function sandbox<
  G extends AnyEffector<any, any, any>,
  F extends (error: ErrorOf<G>) => any,
>(
  _try: G,
  _catch: F,
): Effect<
  OutputOf<G> | Awaited<Generated<ReturnType<F>>>,
  ReturnType<F> extends AnyGenerator ? ErrorOf<ReturnType<F>> : never,
  | RequirementOf<G>
  | (ReturnType<F> extends AnyGenerator ? RequirementOf<ReturnType<F>> : never)
> {
  return { ..._effect('Sandbox'), try: _try, catch: _catch }
}

export function tryCatch<
  G extends AnyEffector<any, any, any>,
  F extends (error: ErrorOf<G>) => any,
>(_try: OrLazy<G>, _catch: F) {
  return $Effect.perform(sandbox($Function.is(_try) ? _try() : _try, _catch))
}

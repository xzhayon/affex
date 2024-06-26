import { AnyEffector, ContextOf, ErrorOf, OutputOf } from '../Effector'
import * as $Function from '../Function'
import { AnyGenerator, Generated } from '../Generator'
import { OrLazy } from '../Type'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Sandbox<out A, out E, out R> extends _Effect<'Sandbox'> {
  readonly try: <_R extends R>() => AnyEffector<A, any, _R>
  readonly catch: <_R extends R>(
    error: ErrorOf<ReturnType<this['try']>>,
  ) => A | Promise<A> | AnyEffector<A, E, _R>
}

function sandbox<
  G extends AnyEffector<any, any, any>,
  F extends (error: ErrorOf<G>) => any,
>(
  _try: () => G,
  _catch: F,
): Effect<
  OutputOf<G> | Awaited<Generated<ReturnType<F>>>,
  ReturnType<F> extends infer _G extends AnyGenerator ? ErrorOf<_G> : never,
  | ContextOf<G>
  | (ReturnType<F> extends infer _G extends AnyGenerator
      ? ContextOf<_G>
      : never)
> {
  return { ..._effect('Sandbox'), try: _try, catch: _catch }
}

export function tryCatch<
  G extends AnyEffector<any, any, any>,
  F extends (error: ErrorOf<G>) => any,
>(_try: OrLazy<G>, _catch: F) {
  return $Effect.perform(
    sandbox($Function.is(_try) ? _try : () => _try, _catch),
  )
}

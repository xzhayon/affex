import { AnyEffector, ContextOf, Throw, Use } from '../Effector'
import * as $Function from '../Function'
import { ReturnOf, YieldOf } from '../Generator'
import { OrLazy } from '../Type'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Fork<A, R> extends _Effect<'Fork'> {
  readonly effector: () => AnyEffector<
    A extends Fiber<any, Throw<any> | (R extends any ? Use<R> : never)>
      ? $Fiber.TOf<A>
      : never,
    A extends Fiber<any, Throw<any> | (R extends any ? Use<R> : never)>
      ? $Fiber.SOf<A> extends infer S
        ? S extends Throw<infer E>
          ? E
          : never
        : never
      : never,
    A extends Fiber<any, Throw<any> | (R extends any ? Use<R> : never)>
      ? $Fiber.SOf<A> extends infer S
        ? S extends Use<infer R>
          ? R
          : never
        : never
      : never
  >
}

function _fork<G extends AnyEffector<any, any, any>>(
  effector: () => G,
): Effect<Fiber<ReturnOf<G>, YieldOf<G>>, never, ContextOf<G>> {
  return { ..._effect('Fork'), effector }
}

export function fork<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
) {
  return $Effect.perform(
    _fork($Function.is(effector) ? effector : () => effector),
  )
}

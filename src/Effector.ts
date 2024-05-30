import { AnyGenerator, ReturnOf, YieldOf } from './Generator'
import { IsAny } from './Type'
import * as $Effect from './effect/Effect'
import { Effect } from './effect/Effect'

export type Effector<A, E = never, R = never> = Generator<
  Effect<unknown, E, R> | void,
  A
>
export type AsyncEffector<A, E = never, R = never> = AsyncGenerator<
  Effect<unknown, E, R> | void,
  A
>
export type AnyEffector<A, E = never, R = never> =
  | Effector<A, E, R>
  | AsyncEffector<A, E, R>

export type OutputOf<G extends AnyGenerator> = ReturnOf<G>
export type ErrorOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? IsAny<Y> extends false
    ? Y extends Effect<any, any, any>
      ? $Effect.EOf<Y>
      : never
    : never
  : never
export type ContextOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? IsAny<Y> extends false
    ? Y extends Effect<any, any, any>
      ? $Effect.ROf<Y>
      : never
    : never
  : never

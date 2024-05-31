import { AnyGenerator, ReturnOf, YieldOf } from './Generator'
import * as $Type from './Type'
import { Effect } from './effect/Effect'

export type Effector<A, E = never, R = never> = Generator<
  Throw<E> | Use<R> | void,
  A
>
export type AsyncEffector<A, E = never, R = never> = AsyncGenerator<
  Throw<E> | Use<R> | void,
  A
>
export type AnyEffector<A, E = never, R = never> =
  | Effector<A, E, R>
  | AsyncEffector<A, E, R>

interface Throw<E> {
  readonly [$Type.uri]?: unique symbol
  readonly _: Effect<any, E, any>
}

interface Use<R> {
  readonly [$Type.uri]?: unique symbol
  readonly _: Effect<any, any, R>
}

export type OutputOf<G extends AnyGenerator> = ReturnOf<G>
export type ErrorOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? Y extends Throw<infer E>
    ? E
    : never
  : never
export type ContextOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? Y extends Use<infer R>
    ? R
    : never
  : never

import { AnyGenerator, ReturnOf, YieldOf } from './Generator'
import * as $Type from './Type'
import { And, Covariant, Invariant, IsAny } from './Type'

export type Effector<A, E = never, R = never> = Generator<
  And<IsAny<R>, IsAny<E>> extends true
    ? any
    : (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never),
  A
>
export type AsyncEffector<A, E = never, R = never> = AsyncGenerator<
  And<IsAny<R>, IsAny<E>> extends true
    ? any
    : (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never),
  A
>
export type AnyEffector<A, E = never, R = never> =
  | Effector<A, E, R>
  | AsyncEffector<A, E, R>

declare const E: unique symbol
export interface Throw<E> {
  readonly [$Type.uri]?: unique symbol
  readonly [E]?: Covariant<E>
}

declare const R: unique symbol
export interface Use<R> {
  readonly [$Type.uri]?: unique symbol
  readonly [R]?: Invariant<R>
}

export type OutputOf<G extends AnyGenerator> = ReturnOf<G>
export type ErrorOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? IsAny<Y> extends false
    ? Y extends Throw<infer E>
      ? E
      : never
    : never
  : never
export type ContextOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? IsAny<Y> extends false
    ? Y extends Use<infer R>
      ? R
      : never
    : never
  : never

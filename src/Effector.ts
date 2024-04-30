import { AnyGenerator, ReturnOf, YieldOf } from './Generator'
import * as $Type from './Type'
import { And, Covariant, Invariant, IsAny } from './Type'

export type Effector<R, A, E = never> = Generator<
  And<IsAny<R>, IsAny<E>> extends true
    ? any
    : (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never),
  A
>
export type AsyncEffector<R, A, E = never> = AsyncGenerator<
  And<IsAny<R>, IsAny<E>> extends true
    ? any
    : (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never),
  A
>
export type AnyEffector<R, A, E = never> =
  | Effector<R, A, E>
  | AsyncEffector<R, A, E>

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
export type RequirementOf<G extends AnyGenerator> = YieldOf<G> extends infer Y
  ? IsAny<Y> extends false
    ? Y extends Use<infer R>
      ? R
      : never
    : never
  : never

import * as $Generator from './Generator'
import * as $Iterator from './Iterator'
import { URI } from './Type'

export interface NullError {
  readonly [URI]?: unique symbol
}

export class UnexpectedError extends Error {
  readonly [URI]!: 'UnexpectedError'
}

export type Throw<E> = (e: E) => E

export type EOf<T extends Throw<any>> = T extends Throw<infer E> ? E : never

export function* tryCatch<A extends Generator, B extends Generator>(
  effector: A | (() => A),
  onError: (
    error: $Generator.NOf<A> extends infer T extends Throw<any>
      ? EOf<T>
      : never,
  ) => B,
): Generator<
  $Generator.YOf<A> | $Generator.YOf<B>,
  $Generator.ROf<A> | $Generator.ROf<B>,
  $Generator.NOf<B>
> {
  try {
    return yield* ($Iterator.is(effector) ? effector : effector()) as any
  } catch (error: any) {
    return yield* onError(error) as any
  }
}

import * as G from './Generator'
import * as I from './Iterator'
import { URI } from './Type'

export interface NullError {
  readonly [URI]?: unique symbol
}

export type Throw<E> = (e: E) => E

export type EOf<T extends Throw<any>> = T extends Throw<infer E> ? E : never

export function* tryCatch<A extends Generator, B extends Generator>(
  effector: A | (() => A),
  onError: (
    error: G.NOf<A> extends infer T extends Throw<any> ? EOf<T> : never,
  ) => B,
): Generator<G.YOf<A> | G.YOf<B>, G.ROf<A> | G.ROf<B>, G.NOf<B>> {
  try {
    return yield* (I.is(effector) ? effector : effector()) as any
  } catch (error: any) {
    return yield* onError(error) as any
  }
}

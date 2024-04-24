import * as $Generator from './Generator'
import { OrLazy, uri } from './Type'

export interface NullError {
  readonly [uri]?: unique symbol
}

export interface UnknownError {
  readonly [uri]?: unique symbol
}

export function is(u: unknown): u is Error {
  return u instanceof Error
}

export function isAggregate(error: Error): error is AggregateError {
  return error instanceof AggregateError
}

export function* tryCatch<A extends Generator, B extends Generator>(
  effector: OrLazy<A>,
  onError: (error: $Generator.TOf<A> | UnknownError) => B,
): Generator<
  $Generator.YOf<A> | $Generator.YOf<B>,
  $Generator.ROf<A> | $Generator.ROf<B>,
  $Generator.NOf<B>
> {
  try {
    return yield* ($Generator.is(effector) ? effector : effector()) as any
  } catch (error: any) {
    return yield* onError(error) as any
  }
}

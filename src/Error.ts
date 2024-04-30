import { ErrorOf, Throw } from './Effector'
import * as $Function from './Function'
import { AnyGenerator, NextOf, ReturnOf, YieldOf } from './Generator'
import * as $Type from './Type'
import { OrLazy } from './Type'

export interface UnknownError {
  readonly [$Type.uri]?: unique symbol
}

export function is(u: unknown): u is Error {
  return u instanceof Error
}

export function isAggregate(error: Error): error is AggregateError {
  return error instanceof AggregateError
}

export function* tryCatch<A extends Generator, B extends Generator>(
  effector: OrLazy<A>,
  onError: (error: ErrorOf<A> | UnknownError) => B,
): Generator<
  Exclude<YieldOf<A>, Throw<any>> | YieldOf<B>,
  ReturnOf<A> | ReturnOf<B>,
  NextOf<A> & NextOf<B>
> {
  try {
    return yield* ($Function.is(effector) ? effector() : effector) as any
  } catch (error: any) {
    return yield* onError(error) as any
  }
}

export async function* tryCatchAsync<
  A extends AnyGenerator,
  B extends AnyGenerator,
>(
  effector: OrLazy<A>,
  onError: (error: ErrorOf<A> | UnknownError) => B,
): AsyncGenerator<
  Exclude<YieldOf<A>, Throw<any>> | YieldOf<B>,
  ReturnOf<A> | ReturnOf<B>,
  NextOf<A> & NextOf<B>
> {
  try {
    return yield* ($Function.is(effector) ? effector() : effector) as any
  } catch (error: any) {
    return yield* onError(error) as any
  }
}

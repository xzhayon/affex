import * as E from './Effector'
import { Effector } from './Effector'
import * as G from './Generator'
import * as I from './Iterator'
import * as L from './Layer'
import { Layer } from './Layer'
import * as T from './Tag'
import { URI } from './Type'

export interface NullError {
  readonly [URI]?: unique symbol
}

export type Throw<E> = (e: E) => E

export interface Raise<E> {
  (error: E): never
}

const symbol = Symbol('Raise')
export const tag = <E>() => T.tag<Raise<E>>(symbol)

export const raise = <E>(error: E): Effector<never, never, E> =>
  E.functionA(tag<E>())((r) => r(error)) as Effector<never, never, E>

export function ExceptionRaise(): Layer<never, Raise<any>> {
  return L.layer().with(tag<any>(), (error) => {
    throw error
  }) as any
}

export function* tryCatch<A extends Generator, B extends Generator>(
  effector: A | (() => A),
  onError: (error: G.NOf<A> extends Throw<infer E> ? E : never) => B,
): Generator<G.YOf<A> | G.YOf<B>, G.ROf<A> | G.ROf<B>, G.NOf<B>> {
  try {
    return yield* (I.is(effector) ? effector : effector()) as any
  } catch (error: any) {
    return yield* onError(error) as any
  }
}

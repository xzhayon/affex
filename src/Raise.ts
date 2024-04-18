import * as E from './Effector'
import { Effector } from './Effector'
import * as L from './Layer'
import { Layer } from './Layer'
import * as T from './Tag'

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

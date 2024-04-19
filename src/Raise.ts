import * as $Effector from './Effector'
import { Effector } from './Effector'
import * as $Layer from './Layer'
import { Layer } from './Layer'
import * as $Tag from './Tag'

export interface Raise<E> {
  (error: E): never
}

const symbol = Symbol('Raise')
export const tag = <E>() => $Tag.tag<Raise<E>>(symbol)

export const raise = <E>(error: E): Effector<never, never, E> =>
  $Effector.functionA(tag<E>())((r) => r(error)) as Effector<never, never, E>

export function ExceptionRaise(): Layer<never, Raise<any>> {
  return $Layer.layer().with(tag<any>(), (error) => {
    throw error
  }) as any
}

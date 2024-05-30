import { Throw, Use } from '../Effector'
import { Exit } from '../Exit'
import * as $Type from '../Type'
import { Variant } from '../Type'

export type Status<A, E, R> =
  | Ready
  | Started
  | Running
  | Suspended<E, R>
  | Terminated<A, E>

type _Status<T extends string> = Variant<typeof uri, T>

export type Ready = _Status<'Ready'>

export type Started = _Status<'Started'>

export type Running = _Status<'Running'>

export interface Suspended<E, R> extends _Status<'Suspended'> {
  readonly effect: Throw<E> | Use<R> | void
}

export interface Terminated<A, E> extends _Status<'Terminated'> {
  readonly exit: Exit<A, E>
}

const uri = Symbol('Status')
const _status = $Type.variant(uri)

export function ready(): Status<never, never, never> {
  return _status('Ready')
}

export function started(): Status<never, never, never> {
  return _status('Started')
}

export function running(): Status<never, never, never> {
  return _status('Running')
}

export function suspended<E, R>(
  effect?: Throw<E> | Use<R> | void,
): Status<never, E, R> {
  return { ..._status('Suspended'), effect }
}

export function terminated<A, E>(exit: Exit<A, E>): Status<A, E, never> {
  return { ..._status('Terminated'), exit }
}

export function isTerminated<A, E>(
  status: Status<A, E, any>,
): status is Terminated<A, E> {
  return status[$Type.tag] === 'Terminated'
}

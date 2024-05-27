import * as $Type from '../Type'
import { Variant } from '../Type'

export type Status<T, S> =
  | Ready
  | Started
  | Running
  | Suspended<S>
  | Interrupted
  | Failed
  | Terminated<T>

type _Status<T extends string> = Variant<typeof uri, T>

export type Ready = _Status<'Ready'>

export type Started = _Status<'Started'>

export type Running = _Status<'Running'>

export interface Suspended<S> extends _Status<'Suspended'> {
  readonly value: S
}

export type Interrupted = _Status<'Interrupted'>

export interface Failed extends _Status<'Failed'> {
  readonly error: unknown
}

export interface Terminated<T> extends _Status<'Terminated'> {
  readonly value: T
}

const uri = Symbol('Status')
const _status = $Type.variant(uri)

export function ready(): Status<never, never> {
  return _status('Ready')
}

export function started(): Status<never, never> {
  return _status('Started')
}

export function running(): Status<never, never> {
  return _status('Running')
}

export function suspended<S>(value: S): Status<never, S> {
  return { ..._status('Suspended'), value }
}

export function interrupted(): Status<never, never> {
  return _status('Interrupted')
}

export function failed(error: unknown): Status<never, never> {
  return { ..._status('Failed'), error }
}

export function terminated<T>(value: T): Status<T, never> {
  return { ..._status('Terminated'), value }
}

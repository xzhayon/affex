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

export function isReady(status: Status<any, any>): status is Ready {
  return status[$Type.tag] === 'Ready'
}

export function isStarted(status: Status<any, any>): status is Started {
  return status[$Type.tag] === 'Started'
}

export function isRunning(status: Status<any, any>): status is Running {
  return status[$Type.tag] === 'Running'
}

export function isSuspended<S>(status: Status<any, S>): status is Suspended<S> {
  return status[$Type.tag] === 'Suspended'
}

export function isInterrupted(status: Status<any, any>): status is Interrupted {
  return status[$Type.tag] === 'Interrupted'
}

export function isFailed(status: Status<any, any>): status is Failed {
  return status[$Type.tag] === 'Failed'
}

export function isTerminated<T>(
  status: Status<T, any>,
): status is Terminated<T> {
  return status[$Type.tag] === 'Terminated'
}

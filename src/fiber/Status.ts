import * as $Type from '../Type'
import { Variant } from '../Type'

export type Status<T, S> =
  | Idle
  | Started
  | Running
  | Suspended<S>
  | Failed
  | Terminated<T>

type _Status<T extends string> = Variant<typeof uri, T>

export interface Idle extends _Status<'Idle'> {}

export interface Started extends _Status<'Started'> {}

export interface Running extends _Status<'Running'> {}

export interface Suspended<S> extends _Status<'Suspended'> {
  readonly value: S
}

export interface Failed extends _Status<'Failed'> {
  readonly error: unknown
}

export interface Terminated<T> extends _Status<'Terminated'> {
  readonly value: T
}

const uri = Symbol('Status')
const _status = $Type.variant(uri)

export function idle(): Status<never, never> {
  return _status('Idle')
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

export function failed(error: unknown): Status<never, never> {
  return { ..._status('Failed'), error }
}

export function terminated<T>(value: T): Status<T, never> {
  return { ..._status('Terminated'), value }
}

export function isIdle(status: Status<any, any>): status is Idle {
  return status[$Type.tag] === 'Idle'
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

export function isFailed(status: Status<any, any>): status is Failed {
  return status[$Type.tag] === 'Failed'
}

export function isTerminated<T>(
  status: Status<T, any>,
): status is Terminated<T> {
  return status[$Type.tag] === 'Terminated'
}

import * as $Type from '../Type'
import { Variant } from '../Type'

export type Result<A, E> = Success<A> | Failure<E>

type _Result<T extends string> = Variant<typeof uri, T>

export interface Success<A> extends _Result<'Success'> {
  readonly value: A
}

export interface Failure<E> extends _Result<'Failure'> {
  readonly error: E
}

const uri = Symbol('Result')
const _result = $Type.variant(uri)

export function success<A>(value: A): Result<A, never> {
  return { ..._result('Success'), value }
}

export function failure<E>(error: E): Result<never, E> {
  return { ..._result('Failure'), error }
}

export function isSuccess(
  result: Result<any, any>,
): result is Success<unknown> {
  return result[$Type.tag] === 'Success'
}

export function isFailure(
  result: Result<any, any>,
): result is Failure<unknown> {
  return result[$Type.tag] === 'Failure'
}

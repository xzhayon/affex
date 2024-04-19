import { Cause } from './Cause'
import { URI } from './Type'

interface Success<A> {
  readonly [URI]?: unique symbol
  readonly _tag: 'Success'
  readonly value: A
}

interface Failure<E> {
  readonly [URI]?: unique symbol
  readonly _tag: 'Failure'
  readonly cause: Cause<E>
}

export type Exit<A, E> = Success<A> | Failure<E>

export function success<A>(value: A): Exit<A, never> {
  return { _tag: 'Success', value }
}

export function failure<E>(cause: Cause<E>): Exit<never, E> {
  return { _tag: 'Failure', cause }
}

export function isSuccess<A, E>(exit: Exit<A, E>): exit is Success<A> {
  return exit._tag === 'Success'
}

export function isFailure<A, E>(exit: Exit<A, E>): exit is Failure<E> {
  return exit._tag === 'Failure'
}

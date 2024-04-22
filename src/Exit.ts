import { Cause } from './Cause'
import * as $Struct from './Struct'
import * as $Type from './Type'

export type Exit<A, E> = Success<A> | Failure<E>

const uri = Symbol('Exit')

interface _Exit<T extends string> {
  readonly [$Type.uri]: typeof uri
  readonly [$Type.tag]: T
}

interface Success<A> extends _Exit<'Success'> {
  readonly value: A
}

interface Failure<E> extends _Exit<'Failure'> {
  readonly cause: Cause<E>
}

export function success<A>(value: A): Exit<A, never> {
  return { [$Type.uri]: uri, [$Type.tag]: 'Success', value }
}

export function failure<E>(cause: Cause<E>): Exit<never, E> {
  return { [$Type.uri]: uri, [$Type.tag]: 'Failure', cause }
}

export function is(u: unknown): u is Exit<unknown, unknown> {
  return $Struct.is(u) && $Struct.has(u, $Type.uri) && u[$Type.uri] === uri
}

export function isSuccess<A>(exit: Exit<A, any>): exit is Success<A> {
  return exit[$Type.tag] === 'Success'
}

export function isFailure<E>(exit: Exit<any, E>): exit is Failure<E> {
  return exit[$Type.tag] === 'Failure'
}

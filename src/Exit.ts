import { Cause } from './Cause'
import * as $Struct from './Struct'
import * as $Type from './Type'
import { Variant } from './Type'

export type Exit<A, E> = Success<A> | Failure<E>

type _Exit<T extends string> = Variant<typeof uri, T>

export interface Success<A> extends _Exit<'Success'> {
  readonly value: A
}

export interface Failure<E> extends _Exit<'Failure'> {
  readonly cause: Cause<E>
}

const uri = Symbol('Exit')
const _exit = $Type.variant(uri)

export function success<A>(value: A): Exit<A, never> {
  return { ..._exit('Success'), value }
}

export function failure<E>(cause: Cause<E>): Exit<never, E> {
  return { ..._exit('Failure'), cause }
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

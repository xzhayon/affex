import * as $Struct from './Struct'
import * as $Type from './Type'
import { Variant } from './Type'
import { Id } from './fiber/Id'

export type Cause<E> = Fail<E> | Die | Interrupt

type _Cause<T extends string> = Variant<typeof uri, T>

export interface Fail<E> extends _Cause<'Fail'> {
  readonly error: E
  readonly fiberId: Id
}

export interface Die extends _Cause<'Die'> {
  readonly error: unknown
  readonly fiberId: Id
}

export interface Interrupt extends _Cause<'Interrupt'> {
  readonly fiberId: Id
}

const uri = Symbol('Cause')
const _cause = $Type.variant(uri)

export function fail<E>(error: E, fiberId: Id): Cause<E> {
  return { ..._cause('Fail'), error, fiberId }
}

export function die(error: unknown, fiberId: Id): Cause<never> {
  return { ..._cause('Die'), error, fiberId }
}

export function interrupt(fiberId: Id): Cause<never> {
  return { ..._cause('Interrupt'), fiberId }
}

export function is(u: unknown): u is Cause<unknown> {
  return $Struct.is(u) && $Struct.has(u, $Type.uri) && u[$Type.uri] === uri
}

export function isFail<E>(cause: Cause<E>): cause is Fail<E> {
  return cause[$Type.tag] === 'Fail'
}

export function isDie(cause: Cause<any>): cause is Die {
  return cause[$Type.tag] === 'Die'
}

export function isInterrupt(cause: Cause<any>): cause is Interrupt {
  return cause[$Type.tag] === 'Interrupt'
}

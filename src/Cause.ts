import * as $Struct from './Struct'
import * as $Type from './Type'
import { Variant } from './Type'

export type Cause<E> = Fail<E> | Die | Interrupt

type _Cause<T extends string> = Variant<typeof uri, T>

export interface Fail<E> extends _Cause<'Fail'> {
  readonly error: E
}

export interface Die extends _Cause<'Die'> {
  readonly error: unknown
}

export type Interrupt = _Cause<'Interrupt'>

const uri = Symbol('Cause')
const _cause = $Type.variant(uri)

export function fail<E>(error: E): Cause<E> {
  return { ..._cause('Fail'), error }
}

export function die(error: unknown): Cause<never> {
  return { ..._cause('Die'), error }
}

export function interrupt(): Cause<never> {
  return _cause('Interrupt')
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

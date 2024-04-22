import { tag, uri } from './Type'

export type Cause<E> = Fail<E> | Die

interface _Cause<T extends string> {
  readonly [uri]?: unique symbol
  readonly [tag]: T
}

interface Fail<E> extends _Cause<'Fail'> {
  readonly error: E
}

interface Die extends _Cause<'Die'> {
  readonly error: unknown
}

export function fail<E>(error: E): Cause<E> {
  return { [tag]: 'Fail', error }
}

export function die(error: unknown): Cause<never> {
  return { [tag]: 'Die', error }
}

export function isFail<E>(cause: Cause<E>): cause is Fail<E> {
  return cause[tag] === 'Fail'
}

export function isDie(cause: Cause<any>): cause is Die {
  return cause[tag] === 'Die'
}

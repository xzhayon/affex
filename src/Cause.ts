import { UnexpectedError } from './Error'
import { URI } from './Type'

interface Expected<E> {
  readonly [URI]?: unique symbol
  readonly _tag: 'Expected'
  readonly error: E
}

interface Unexpected {
  readonly [URI]?: unique symbol
  readonly _tag: 'Unexpected'
  readonly error: UnexpectedError
}

export type Cause<E> = Expected<E> | Unexpected

export function expected<E>(error: E): Cause<E> {
  return { _tag: 'Expected', error }
}

export function unexpected(error: UnexpectedError): Cause<never> {
  return { _tag: 'Unexpected', error }
}

export function isExpected<E>(cause: Cause<E>): cause is Expected<E> {
  return cause._tag === 'Expected'
}

export function isUnexpected(cause: Cause<any>): cause is Unexpected {
  return cause._tag === 'Unexpected'
}

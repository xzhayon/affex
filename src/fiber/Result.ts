import { Exit } from '../Exit'
import { tag, uri } from '../Type'

export type Result<Y, R extends Exit<any, any>> = Yield<Y> | Return<R>

interface _Result<T extends string> {
  readonly [uri]?: unique symbol
  readonly [tag]: T
}

export interface Yield<Y> extends _Result<'Yield'> {
  readonly value: Y
}

export interface Return<R extends Exit<any, any>> extends _Result<'Return'> {
  readonly value: R
}

function _yield<Y>(value: Y): Result<Y, never> {
  return { [tag]: 'Yield', value }
}
export { _yield as yield }

function _return<R extends Exit<any, any>>(value: R): Result<never, R> {
  return { [tag]: 'Return', value }
}
export { _return as return }

export function isYield<Y>(result: Result<Y, any>): result is Yield<Y> {
  return result[tag] === 'Yield'
}

export function isReturn<R extends Exit<any, any>>(
  result: Result<any, R>,
): result is Return<R> {
  return result[tag] === 'Return'
}

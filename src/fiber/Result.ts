import { Exit } from '../Exit'
import * as $Type from '../Type'
import { Variant } from '../Type'

export type Result<Y, R extends Exit<any, any>> = Yield<Y> | Return<R>

type _Result<T extends string> = Variant<typeof uri, T>

export interface Yield<Y> extends _Result<'Yield'> {
  readonly value: Y
}

export interface Return<R extends Exit<any, any>> extends _Result<'Return'> {
  readonly value: R
}

const uri = Symbol('Result')
const _result = $Type.variant(uri)

function _yield<Y>(value: Y): Result<Y, never> {
  return { ..._result('Yield'), value }
}
export { _yield as yield }

function _return<R extends Exit<any, any>>(value: R): Result<never, R> {
  return { ..._result('Return'), value }
}
export { _return as return }

export function isYield<Y>(result: Result<Y, any>): result is Yield<Y> {
  return result[$Type.tag] === 'Yield'
}

export function isReturn<R extends Exit<any, any>>(
  result: Result<any, R>,
): result is Return<R> {
  return result[$Type.tag] === 'Return'
}

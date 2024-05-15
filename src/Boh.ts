import { Exit } from './Exit'
import * as $Type from './Type'
import { Variant } from './Type'
import { Id } from './fiber/Id'

export type Boh<A, E> = Waiting | Done<A, E>

type _Boh<T extends string> = Variant<typeof uri, T>

export interface Waiting extends _Boh<'Waiting'> {
  readonly id: Id
}

export interface Done<A, E> extends _Boh<'Done'> {
  readonly exit: Exit<A, E>
}

const uri = Symbol('Boh')
const _boh = $Type.variant(uri)

export function waiting(id: Id): Boh<never, never> {
  return { ..._boh('Waiting'), id }
}

export function done<A, E>(exit: Exit<A, E>): Boh<A, E> {
  return { ..._boh('Done'), exit }
}

export function isWaiting(boh: Boh<any, any>): boh is Waiting {
  return boh[$Type.tag] === 'Waiting'
}

export function isDone(boh: Boh<any, any>): boh is Done<unknown, unknown> {
  return boh[$Type.tag] === 'Done'
}

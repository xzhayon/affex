import { Effector, Throw, Use } from '../Effector'
import * as $Struct from '../Struct'
import * as $Type from '../Type'
import { Variant } from '../Type'
import { Exception } from './Exception'
import { Fork } from './Fork'
import { Proxy } from './Proxy'

export type Effect<R, A, E> = Exception<E> | Fork<R, A, E> | Proxy<R, A, E>

export type _Effect<T extends string> = Variant<typeof uri, T>

const uri = Symbol('Effect')
export const _effect = $Type.variant(uri)

export function is(u: unknown): u is Effect<unknown, unknown, unknown> {
  return $Struct.is(u) && $Struct.has(u, $Type.uri) && u[$Type.uri] === uri
}

export function* perform<R, A, E>(effect: Effect<R, A, E>): Effector<R, A, E> {
  return (yield effect as unknown as
    | (R extends any ? Use<R> : never)
    | (E extends any ? Throw<E> : never)) as A
}

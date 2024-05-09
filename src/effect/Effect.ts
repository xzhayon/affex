import { Effector, Throw, Use } from '../Effector'
import * as $Struct from '../Struct'
import * as $Type from '../Type'
import { Variant } from '../Type'
import { Exception } from './Exception'
import { Fork } from './Fork'
import { Interruption } from './Interruption'
import { Proxy } from './Proxy'
import { Sandbox } from './Sandbox'
import { Suspension } from './Suspension'

export type Effect<A, E, R> =
  | Exception<E>
  | Fork<A, E, R>
  | Interruption
  | Proxy<A, E, R>
  | Sandbox<A, E, R>
  | Suspension

export type _Effect<T extends string> = Variant<typeof uri, T>

const uri = Symbol('Effect')
export const _effect = $Type.variant(uri)

export function is(u: unknown): u is Effect<unknown, unknown, unknown> {
  return $Struct.is(u) && $Struct.has(u, $Type.uri) && u[$Type.uri] === uri
}

export function* perform<A, E, R>(effect: Effect<A, E, R>): Effector<A, E, R> {
  return (yield effect as unknown as
    | (E extends any ? Throw<E> : never)
    | (R extends any ? Use<R> : never)) as A
}

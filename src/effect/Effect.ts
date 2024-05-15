import { Effector, Throw, Use } from '../Effector'
import * as $Struct from '../Struct'
import * as $Type from '../Type'
import { Variant } from '../Type'
import { Backdoor } from './Backdoor'
import { Exception } from './Exception'
import { Fork } from './Fork'
import * as $Id from './Id'
import { Id } from './Id'
import { Interruption } from './Interruption'
import { Join } from './Join'
import { Proxy } from './Proxy'
import { Sandbox } from './Sandbox'
import { Suspension } from './Suspension'

export type Effect<A, E = never, R = never> =
  | Exception<E>
  | Backdoor<A, E, R>
  | Fork<A, R>
  | Interruption
  | Join<A, E, R>
  | Proxy<A, E, R>
  | Sandbox<A, E, R>
  | Suspension

export interface _Effect<T extends string> extends Variant<typeof uri, T> {
  readonly id: Id
}

const uri = Symbol('Effect')
export function _effect<T extends string>(tag: T) {
  return { ...$Type.variant(uri)(tag), id: $Id.id() }
}

export function is(u: unknown): u is Effect<unknown, unknown, unknown> {
  return $Struct.is(u) && $Struct.has(u, $Type.uri) && u[$Type.uri] === uri
}

export function* perform<A, E, R>(effect: Effect<A, E, R>): Effector<A, E, R> {
  return (yield effect as unknown as
    | (E extends any ? Throw<E> : never)
    | (R extends any ? Use<R> : never)) as A
}

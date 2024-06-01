import { Effector } from '../Effector'
import * as $Struct from '../Struct'
import * as $Type from '../Type'
import { Variant } from '../Type'
import { Backdoor } from './Backdoor'
import { Exception } from './Exception'
import { Fork } from './Fork'
import * as $EffectId from './Id'
import { Id } from './Id'
import { Interruption } from './Interruption'
import { Join } from './Join'
import { Proxy } from './Proxy'
import { Sandbox } from './Sandbox'
import { Scope } from './Scope'
import { Suspension } from './Suspension'

export type Effect<A, E = never, R = never> =
  | Exception<E>
  | Backdoor<A, E, R>
  | Fork<A, R>
  | Interruption
  | Join<A, E, R>
  | Proxy<A, E, R>
  | Sandbox<A, E, R>
  | Scope<A, E, R>
  | Suspension

export interface _Effect<T extends string> extends Variant<typeof uri, T> {
  readonly id: Id
}

export type EOf<E extends Effect<any, any, any>> = E extends
  | Exception<infer _E>
  | Backdoor<any, infer _E, any>
  | Join<any, infer _E, any>
  | Proxy<any, infer _E, any>
  | Sandbox<any, infer _E, any>
  | Scope<any, infer _E, any>
  ? _E
  : never
export type ROf<E extends Effect<any, any, any>> = E extends
  | Backdoor<any, any, infer R>
  | Fork<any, infer R>
  | Join<any, any, infer R>
  | Proxy<any, any, infer R>
  | Sandbox<any, any, infer R>
  | Scope<any, any, infer R>
  ? R
  : never

const uri = Symbol('Effect')
export function _effect<T extends string>(tag: T) {
  return { ...$Type.variant(uri)(tag), id: $EffectId.id() }
}

export function is(u: unknown): u is Effect<unknown, unknown, unknown> {
  return $Struct.is(u) && $Struct.has(u, $Type.uri) && u[$Type.uri] === uri
}

export function* perform<A, E, R>(effect: Effect<A, E, R>): Effector<A, E, R> {
  return (yield { _: effect }) as A
}

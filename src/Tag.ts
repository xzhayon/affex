import * as $String from './String'
import * as $Type from './Type'
import { Invariant } from './Type'

declare const A: unique symbol
export interface Tag<in out A> {
  readonly [$Type.uri]?: unique symbol
  readonly [A]?: Invariant<A>
  readonly key: symbol
}

export function tag<A>(key?: symbol): Tag<A>
export function tag<A>(description?: string): Tag<A>
export function tag<A>(keyOrDescription: symbol | string = Symbol()): Tag<A> {
  return {
    key: $String.is(keyOrDescription)
      ? Symbol(keyOrDescription)
      : keyOrDescription,
  }
}

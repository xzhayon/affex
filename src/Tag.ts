import * as $String from './String'
import * as $Type from './Type'
import { Covariant } from './Type'

declare const A: unique symbol
export interface Tag<A> {
  readonly [$Type.uri]?: unique symbol
  readonly [A]?: Covariant<A>
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

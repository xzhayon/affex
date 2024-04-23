import * as $String from './String'
import { uri } from './Type'

declare const A: unique symbol
export interface Tag<A> {
  readonly [uri]?: unique symbol
  readonly [A]?: A
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

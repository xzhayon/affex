import * as $String from './String'
import { URI } from './Type'

declare const A: unique symbol
export interface Tag<A> {
  readonly [URI]?: unique symbol
  readonly [A]?: A
  readonly _tag: 'Tag'
  readonly key: symbol
}

export function tag<A>(key?: symbol): Tag<A>
export function tag<A>(description?: string): Tag<A>
export function tag<A>(keyOrDescription: symbol | string = Symbol()): Tag<A> {
  return {
    _tag: 'Tag',
    key: $String.is(keyOrDescription)
      ? Symbol(keyOrDescription)
      : keyOrDescription,
  }
}

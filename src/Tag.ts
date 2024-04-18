import * as S from './String'
import { URI } from './Type'

declare const A: unique symbol
export interface Tag<A> {
  readonly [URI]: 'Tag'
  readonly [A]?: A
  readonly key: symbol
}

export function tag<A>(key?: symbol): Tag<A>
export function tag<A>(description?: string): Tag<A>
export function tag<A>(keyOrDescription: symbol | string = Symbol()): Tag<A> {
  return {
    [URI]: 'Tag',
    key: S.is(keyOrDescription) ? Symbol(keyOrDescription) : keyOrDescription,
  }
}

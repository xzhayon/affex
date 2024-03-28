import * as String from './String'
import * as Struct from './Struct'
import { URI } from './Type'

declare const R: unique symbol
export interface Tag<R> {
  readonly [URI]: 'Tag'
  readonly [R]?: R
  readonly key: symbol
}

export function tag<R>(key?: symbol): Tag<R>
export function tag<R>(description?: string): Tag<R>
export function tag<R>(keyOrDescription: symbol | string = Symbol()): Tag<R> {
  return {
    [URI]: 'Tag',
    key: String.is(keyOrDescription)
      ? Symbol(keyOrDescription)
      : keyOrDescription,
  }
}

export function is(u: unknown): u is Tag<unknown> {
  return Struct.is(u) && Struct.has(u, URI) && u[URI] === 'Tag'
}

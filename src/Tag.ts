import * as S from './String'

declare const R: unique symbol
export interface Tag<R> {
  readonly [R]?: R
  readonly key: symbol
}

export function tag<R>(key?: symbol): Tag<R>
export function tag<R>(description?: string): Tag<R>
export function tag<R>(keyOrDescription: symbol | string = Symbol()): Tag<R> {
  return {
    key: S.is(keyOrDescription) ? Symbol(keyOrDescription) : keyOrDescription,
  }
}

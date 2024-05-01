import { Equal as _Equal, IsAny as _IsAny } from '@type-challenges/utils'

export type Covariant<A> = (_: never) => A
export type Contravariant<A> = (_: A) => never
export type Invariant<A> = (_: A) => A

export type Lazy<A> = () => A
export type OrLazy<A> = A | Lazy<A>

export interface Variant<U, T extends string> {
  readonly [_uri]: U
  readonly [_tag]: T
}

export type And<A, B> = A extends true ? B : false
export type Equals<A, B> = _Equal<A, B>
export type IsAny<A> = _IsAny<A>
export type IsNever<A> = [A] extends [never] ? true : false

const _uri = Symbol('Uri')
const _tag = Symbol('Tag')
export { _tag as tag, _uri as uri }

export function variant<U>(uri: U) {
  return <T extends string>(tag: T): Variant<U, T> => ({
    [_uri]: uri,
    [_tag]: tag,
  })
}

export interface Variant<U, T extends string> {
  readonly [uri]: U
  readonly [tag]: T
}

export type Lazy<A> = () => A
export type OrLazy<A> = A | Lazy<A>

export const uri = Symbol('Uri')
export const tag = Symbol('Tag')

export function variant<U>(_uri: U) {
  return <T extends string>(_tag: T): Variant<U, T> => ({
    [uri]: _uri,
    [tag]: _tag,
  })
}

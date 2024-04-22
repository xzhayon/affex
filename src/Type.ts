export type Lazy<A> = () => A
export type OrLazy<A> = A | Lazy<A>

export const uri = Symbol('Uri')
export const tag = Symbol('Tag')

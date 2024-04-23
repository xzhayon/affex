import { Variant } from './Type'

export type Result<A, E> = Success<A> | Failure<E>

type _Result<T extends string> = Variant<typeof uri, T>

interface Success<A> extends _Result<'Success'> {
  readonly value: A
}

interface Failure<E> extends _Result<'Failure'> {
  readonly error: E
}

export type AOf<R extends Result<any, any>> = R extends Success<infer A>
  ? A
  : never
export type EOf<R extends Result<any, any>> = R extends Failure<infer E>
  ? E
  : never

export type Resulted<A> = A extends Result<any, any> ? AOf<A> : A

declare const uri: unique symbol

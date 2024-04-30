import * as $Type from './Type'
import { Covariant, Equals } from './Type'

export type Result<A, E> = Success<A> | Failure<E>

interface _Result<T extends string> {
  readonly [$Type.uri]?: unique symbol
  readonly [$Type.tag]?: T
}

export type Success<A> = A & _Result<'Success'>

declare const E: unique symbol
export interface Failure<E> extends _Result<'Failure'> {
  readonly [E]?: Covariant<E>
}

export type AOf<R extends Result<any, any>> = R extends Success<infer A>
  ? A
  : never
export type EOf<R extends Result<any, any>> = R extends Failure<infer E>
  ? E
  : never

export type Resulted<A> = A extends any
  ? Equals<A, undefined> extends true
    ? A
    : Equals<A, unknown> extends true
    ? A
    : Equals<A, void> extends true
    ? A
    : A extends Result<any, any>
    ? AOf<A>
    : A
  : never

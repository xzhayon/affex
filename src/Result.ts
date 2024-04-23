import { Equal } from '@type-challenges/utils'
import * as $Type from './Type'

export type Result<A, E> = Success<A> | Failure<E>

interface _Result<T extends string> {
  readonly [$Type.uri]?: unique symbol
  readonly [$Type.tag]?: T
}

type Success<A> = A & _Result<'Success'>

declare const E: unique symbol
interface Failure<E> extends _Result<'Failure'> {
  readonly [E]?: E
}

export type AOf<R extends Result<any, any>> = R extends Success<infer A>
  ? A
  : never
export type EOf<R extends Result<any, any>> = R extends Failure<infer E>
  ? E
  : never

export type Resulted<A> = A extends any
  ? Equal<A, undefined> extends true
    ? A
    : Equal<A, unknown> extends true
    ? A
    : Equal<A, void> extends true
    ? A
    : A extends Result<any, any>
    ? AOf<A>
    : A
  : never

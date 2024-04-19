import { Effector } from './Effector'
import * as $Error from './Error'
import { Throw } from './Error'
import * as $Generator from './Generator'
import { Generated } from './Generator'
import * as $Struct from './Struct'
import { Tag } from './Tag'
import { URI } from './Type'

declare const E: unique symbol
export interface Effect<R, A, E> {
  readonly [URI]?: unique symbol
  readonly [E]?: E
  readonly _tag: 'Effect'
  readonly tag: Tag<R>
  readonly f: (r: R) => A
}

export type Use<R> = Effect<R, any, any>

export type ROf<E extends Effect<any, any, any>> = E extends Effect<
  infer R,
  any,
  any
>
  ? R
  : never

export function effect<R, A>(
  tag: Tag<R>,
  f: (r: R) => A,
): Effect<
  | R
  | (A extends Generator | AsyncGenerator
      ? $Generator.YOf<A> extends infer U extends Use<any>
        ? ROf<U>
        : never
      : never),
  Exclude<Generated<Awaited<A>>, Error>,
  A extends Generator | AsyncGenerator
    ? $Generator.NOf<A> extends infer T extends Throw<any>
      ? $Error.EOf<T>
      : never
    : A extends Error
    ? A
    : never
> {
  return { _tag: 'Effect', tag, f: f as any }
}

export function is(u: unknown): u is Effect<unknown, unknown, unknown> {
  return $Struct.is(u) && $Struct.has(u, '_tag') && u._tag === 'Effect'
}

export function* perform<R, A, E>(effect: Effect<R, A, E>): Effector<R, A, E> {
  return (yield effect as any) as any
}

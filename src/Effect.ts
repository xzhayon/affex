import { Effector } from './Effector'
import * as Er from './Error'
import { Throw } from './Error'
import * as G from './Generator'
import { Generated } from './Generator'
import * as S from './Struct'
import { Tag } from './Tag'
import { URI } from './Type'

declare const E: unique symbol
export interface Effect<R, A, E> {
  readonly [URI]: 'Effect'
  readonly [E]?: E
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
      ? G.YOf<A> extends infer U extends Use<any>
        ? ROf<U>
        : never
      : never),
  Exclude<Generated<Awaited<A>>, Error>,
  A extends Generator | AsyncGenerator
    ? G.NOf<A> extends infer T extends Throw<any>
      ? Er.EOf<T>
      : never
    : A extends Error
    ? A
    : never
> {
  return { [URI]: 'Effect', tag, f: f as any }
}

export function is(u: unknown): u is Effect<unknown, unknown, unknown> {
  return S.is(u) && S.has(u, URI) && u[URI] === 'Effect'
}

export function* perform<R, A, E>(effect: Effect<R, A, E>): Effector<R, A, E> {
  return (yield effect as any) as any
}

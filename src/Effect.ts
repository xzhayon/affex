import { Effector } from './Effector'
import * as G from './Generator'
import { Generated } from './Generator'
import { Has } from './Has'
import * as S from './Struct'
import { Tag } from './Tag'
import { URI } from './Type'

export interface Effect<R, A> {
  readonly [URI]: 'Effect'
  readonly tag: Tag<R>
  readonly f: (r: R) => A
}

export type ROf<E extends Effect<any, any>> = E extends Effect<infer R, any>
  ? R
  : never

export function effect<R, A>(
  tag: Tag<R>,
  f: (r: R) => A,
): Effect<
  | R
  | (A extends Generator | AsyncGenerator
      ? G.YOf<A> extends infer E extends Has<any>
        ? ROf<E>
        : never
      : never),
  Generated<Awaited<A>>
> {
  return { [URI]: 'Effect', tag, f: f as any }
}

export function is(u: unknown): u is Effect<unknown, unknown> {
  return S.is(u) && S.has(u, URI) && u[URI] === 'Effect'
}

export function* perform<R, A>(effect: Effect<R, A>): Effector<R, A> {
  return yield effect as R extends any ? Effect<R, A> : never
}

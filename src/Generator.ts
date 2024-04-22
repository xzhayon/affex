import { Throw, Use } from './Effector'
import * as $Function from './Function'
import * as $Struct from './Struct'

export type AnyGenerator<Y = unknown, R = any, N = unknown> =
  | Generator<Y, R, N>
  | AsyncGenerator<Y, R, N>

export type YOf<G extends AnyGenerator> = G extends AnyGenerator<infer Y>
  ? Y
  : never
export type ROf<G extends AnyGenerator> = G extends AnyGenerator<any, infer R>
  ? R
  : never
export type NOf<G extends AnyGenerator> = G extends AnyGenerator<
  any,
  any,
  infer N
>
  ? N
  : never

export type UOf<G extends AnyGenerator> =
  YOf<G> extends infer U extends Use<any>
    ? U extends Use<infer R>
      ? R
      : never
    : never
export type TOf<G extends AnyGenerator> =
  NOf<G> extends infer T extends Throw<any>
    ? T extends Throw<infer E>
      ? E
      : never
    : never

export type Generated<A> = A extends AnyGenerator ? ROf<A> : A

export function* sequence<G extends Generator>(
  generators: ReadonlyArray<G>,
): Generator<YOf<G>, ROf<G>[], NOf<G>> {
  const as = []
  for (const generator of generators) {
    as.push(yield* generator as any)
  }

  return as
}

export function traverse<A, G extends Generator>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
) {
  return sequence(as.map(f))
}

export function is(u: unknown): u is AnyGenerator {
  return $Struct.is(u) && $Struct.has(u, 'next') && $Function.is(u.next)
}

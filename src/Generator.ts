import * as $Function from './Function'
import * as $Struct from './Struct'

export type AnyGenerator<Y = unknown, R = any, N = unknown> =
  | Generator<Y, R, N>
  | AsyncGenerator<Y, R, N>

export type YieldOf<G extends AnyGenerator> = G extends AnyGenerator<infer Y>
  ? Y
  : never
export type ReturnOf<G extends AnyGenerator> = G extends AnyGenerator<
  any,
  infer R
>
  ? R
  : never
export type NextOf<G extends AnyGenerator> = G extends AnyGenerator<
  any,
  any,
  infer N
>
  ? N
  : never

export type Generated<A> = A extends AnyGenerator ? ReturnOf<A> : A

export function is(u: unknown): u is AnyGenerator {
  return $Struct.is(u) && $Struct.has(u, 'next') && $Function.is(u.next)
}

export function* sequence<G extends Generator>(
  generators: ReadonlyArray<G>,
): Generator<YieldOf<G>, ReturnOf<G>[], NextOf<G>> {
  const as = []
  for (const generator of generators) {
    as.push(yield* generator as any)
  }

  return as
}

export async function* sequenceAsync<G extends AnyGenerator>(
  generators: ReadonlyArray<G>,
): AsyncGenerator<YieldOf<G>, ReturnOf<G>[], NextOf<G>> {
  const as = []
  for await (const generator of generators) {
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

export function traverseAsync<A, G extends AnyGenerator>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
) {
  return sequenceAsync(as.map(f))
}

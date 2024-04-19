export type YOf<G extends Generator | AsyncGenerator> = G extends
  | Generator<infer Y>
  | AsyncGenerator<infer Y>
  ? Y
  : never
export type ROf<G extends Generator | AsyncGenerator> = G extends
  | Generator<any, infer R>
  | AsyncGenerator<any, infer R>
  ? R
  : never
export type NOf<G extends Generator | AsyncGenerator> = G extends
  | Generator<any, any, infer N>
  | AsyncGenerator<any, any, infer N>
  ? N
  : never

export type Generated<A> = A extends Generator | AsyncGenerator ? ROf<A> : A

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

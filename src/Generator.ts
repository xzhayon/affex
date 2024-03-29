export type YOf<G extends Generator | AsyncGenerator> = G extends Generator<
  infer Y
>
  ? Y
  : G extends AsyncGenerator<infer Y>
  ? Y
  : never
export type ROf<G extends Generator | AsyncGenerator> = G extends Generator<
  any,
  infer R
>
  ? R
  : G extends AsyncGenerator<any, infer R>
  ? R
  : never
export type NOf<G extends Generator | AsyncGenerator> = G extends Generator<
  any,
  any,
  infer N
>
  ? N
  : G extends AsyncGenerator<any, any, infer N>
  ? N
  : never

export function* traverse<A, G extends Generator>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
): Generator<YOf<G>, ReadonlyArray<ROf<G>>, NOf<G>> {
  const bs = []
  for (const a of as) {
    bs.push(yield* f(a) as any)
  }

  return bs
}

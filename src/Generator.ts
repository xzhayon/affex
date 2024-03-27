import { Builder } from './Builder'

export type YOf<G extends Generator> = G extends Generator<infer Y> ? Y : never
export type ROf<G extends Generator> = G extends Generator<any, infer R>
  ? R
  : never
export type NOf<G extends Generator> = G extends Generator<any, any, infer N>
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

export function run<G extends Generator>(generator: G) {
  return Builder.create(generator)
}

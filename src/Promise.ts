import * as E from './Effect'
import * as F from './Fork'
import * as G from './Generator'
import { Has } from './Has'

export function* all<A, G extends Generator<any> | AsyncGenerator<any>>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
) {
  return yield* E.perform(
    F.fork<
      G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
    >()((run) => Promise.all(as.map((a) => run(() => f(a))))),
  )
}

export function* allSettled<A, G extends Generator<any> | AsyncGenerator<any>>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
) {
  return yield* E.perform(
    F.fork<
      G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
    >()((run) => Promise.allSettled(as.map((a) => run(() => f(a))))),
  )
}

export function* any<A, G extends Generator<any> | AsyncGenerator<any>>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
) {
  return yield* E.perform(
    F.fork<
      G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
    >()((run) => Promise.any(as.map((a) => run(() => f(a))))),
  )
}

export function* race<A, G extends Generator<any> | AsyncGenerator<any>>(
  as: ReadonlyArray<A>,
  f: (a: A) => G,
) {
  return yield* E.perform(
    F.fork<
      G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
    >()((run) => Promise.race(as.map((a) => run(() => f(a))))),
  )
}

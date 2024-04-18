import * as E from './Effect'
import { Use } from './Effect'
import * as F from './Fork'
import * as G from './Generator'

export function all<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return F.fork<G.YOf<G> extends infer U extends Use<any> ? E.ROf<U> : never>()(
    (run) => Promise.all(generators.map(run)),
  )
}

export function allSettled<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return F.fork<G.YOf<G> extends infer U extends Use<any> ? E.ROf<U> : never>()(
    (run) => Promise.allSettled(generators.map(run)),
  )
}

export function any<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return F.fork<G.YOf<G> extends infer U extends Use<any> ? E.ROf<U> : never>()(
    (run) => Promise.any(generators.map(run)),
  )
}

export function race<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return F.fork<G.YOf<G> extends infer U extends Use<any> ? E.ROf<U> : never>()(
    (run) => Promise.race(generators.map(run)),
  )
}

import * as E from './Effect'
import * as F from './Fork'
import * as G from './Generator'
import { Has } from './Has'

export function all<G extends Generator<any> | AsyncGenerator<any>>(
  gs: ReadonlyArray<G>,
) {
  return F.fork<
    G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
  >()((run) => Promise.all(gs.map(run)))
}

export function allSettled<G extends Generator<any> | AsyncGenerator<any>>(
  gs: ReadonlyArray<G>,
) {
  return F.fork<
    G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
  >()((run) => Promise.allSettled(gs.map(run)))
}

export function any<G extends Generator<any> | AsyncGenerator<any>>(
  gs: ReadonlyArray<G>,
) {
  return F.fork<
    G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
  >()((run) => Promise.any(gs.map(run)))
}

export function race<G extends Generator<any> | AsyncGenerator<any>>(
  gs: ReadonlyArray<G>,
) {
  return F.fork<
    G.YOf<G> extends infer Y ? (Y extends Has<any> ? E.ROf<Y> : never) : never
  >()((run) => Promise.race(gs.map(run)))
}

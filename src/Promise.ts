import * as $Effect from './Effect'
import { Use } from './Effect'
import * as $Error from './Error'
import { Throw } from './Error'
import * as $Fork from './Fork'
import * as $Generator from './Generator'

export function all<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never,
    $Generator.NOf<G> extends infer T extends Throw<any> ? $Error.EOf<T> : never
  >()((run) => Promise.all(generators.map(run)))
}

export function allSettled<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never,
    $Generator.NOf<G> extends infer T extends Throw<any> ? $Error.EOf<T> : never
  >()((run) => Promise.allSettled(generators.map(run)))
}

export function any<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never,
    $Generator.NOf<G> extends infer T extends Throw<any> ? $Error.EOf<T> : never
  >()((run) => Promise.any(generators.map(run)))
}

export function race<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never,
    $Generator.NOf<G> extends infer T extends Throw<any> ? $Error.EOf<T> : never
  >()((run) => Promise.race(generators.map(run)))
}

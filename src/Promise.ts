import * as $Effect from './Effect'
import { Use } from './Effect'
import * as $Exit from './Exit'
import * as $Fork from './Fork'
import * as $Generator from './Generator'

export function all<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never
  >()((run) =>
    Promise.all(
      generators.map(run).map((promise) =>
        promise.then((exit) => {
          if ($Exit.isFailure(exit)) {
            throw exit.cause.error
          }

          return exit.value
        }),
      ),
    ),
  )
}

export function allSettled<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never
  >()((run) =>
    Promise.allSettled(
      generators.map(run).map((promise) =>
        promise.then((exit) => {
          if ($Exit.isFailure(exit)) {
            throw exit.cause.error
          }

          return exit.value
        }),
      ),
    ),
  )
}

export function any<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never
  >()((run) =>
    Promise.any(
      generators.map(run).map((promise) =>
        promise.then((exit) => {
          if ($Exit.isFailure(exit)) {
            throw exit.cause.error
          }

          return exit.value
        }),
      ),
    ),
  )
}

export function race<G extends Generator<any> | AsyncGenerator<any>>(
  generators: ReadonlyArray<G>,
) {
  return $Fork.fork<
    $Generator.YOf<G> extends infer U extends Use<any> ? $Effect.ROf<U> : never
  >()((run) =>
    Promise.race(
      generators.map(run).map((promise) =>
        promise.then((exit) => {
          if ($Exit.isFailure(exit)) {
            throw exit.cause.error
          }

          return exit.value
        }),
      ),
    ),
  )
}

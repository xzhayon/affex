import * as $Cause from './Cause'
import * as $Error from './Error'
import * as $Exit from './Exit'
import * as $Generator from './Generator'
import { AnyGenerator } from './Generator'
import { OrLazy } from './Type'
import * as $Exception from './effect/Exception'
import * as $Fork from './effect/Fork'

export function all<G extends AnyGenerator<any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<$Generator.UOf<G>>()(async function* (run) {
    try {
      return await Promise.all(
        effectors.map(run).map((promise) =>
          promise.then((exit) => {
            if ($Exit.isFailure(exit)) {
              throw exit
            }

            return exit.value
          }),
        ),
      )
    } catch (exit) {
      if (!$Exit.is(exit) || !$Exit.isFailure(exit)) {
        throw new Error('Cannot find Promise failure')
      }

      if ($Cause.isDie(exit.cause)) {
        throw exit.cause.error
      }

      return yield* $Exception.raise(exit.cause.error as $Generator.TOf<G>)
    }
  })
}

export function settled<G extends AnyGenerator<any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<$Generator.UOf<G>>()((run) =>
    Promise.all(effectors.map(run)),
  )
}

export function any<G extends AnyGenerator<any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<$Generator.UOf<G>>()(async function* (run) {
    try {
      return await Promise.any(
        effectors.map(run).map((promise) =>
          promise.then((exit) => {
            if ($Exit.isFailure(exit)) {
              throw exit
            }

            return exit.value
          }),
        ),
      )
    } catch (error) {
      if (!$Error.is(error)) {
        throw new Error('Cannot find Promise error')
      }

      if (!$Error.isAggregate(error)) {
        throw error
      }

      throw new AggregateError(
        error.errors.map((exit) => {
          if (!$Exit.is(exit) || !$Exit.isFailure(exit)) {
            throw new Error('Cannot find Promise failure')
          }

          return exit.cause.error
        }),
        error.message,
      )
    }
  })
}

export function race<G extends AnyGenerator<any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<$Generator.UOf<G>>()(async function* (run) {
    try {
      return await Promise.race(
        effectors.map(run).map((promise) =>
          promise.then((exit) => {
            if ($Exit.isFailure(exit)) {
              throw exit
            }

            return exit.value
          }),
        ),
      )
    } catch (exit) {
      if (!$Exit.is(exit) || !$Exit.isFailure(exit)) {
        throw new Error('Cannot find Promise failure')
      }

      if ($Cause.isDie(exit.cause)) {
        throw exit.cause.error
      }

      return yield* $Exception.raise(exit.cause.error as $Generator.TOf<G>)
    }
  })
}

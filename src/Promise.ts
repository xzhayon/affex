import { AnyEffector, ErrorOf, RequirementOf } from './Effector'
import * as $Error from './Error'
import * as $Exit from './Exit'
import * as $Type from './Type'
import { OrLazy } from './Type'
import * as $Exception from './effect/Exception'
import * as $Fork from './effect/Fork'

export function all<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<RequirementOf<G>>()(async function* (run) {
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

      switch (exit.cause[$Type.tag]) {
        case 'Die':
          throw exit.cause.error
        case 'Interrupt':
          throw new Error('Child fiber was interrupted')
        case 'Fail':
          return yield* $Exception.raise(exit.cause.error as ErrorOf<G>)
      }
    }
  })
}

export function settled<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<RequirementOf<G>>()((run) =>
    Promise.all(effectors.map(run)),
  )
}

export function any<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<RequirementOf<G>>()(async function* (run) {
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

          switch (exit.cause[$Type.tag]) {
            case 'Die':
              return exit.cause.error
            case 'Interrupt':
              throw new Error('Child fiber was interrupted')
            case 'Fail':
              return exit.cause.error
          }
        }),
        error.message,
      )
    }
  })
}

export function race<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
) {
  return $Fork.fork<RequirementOf<G>>()(async function* (run) {
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

      switch (exit.cause[$Type.tag]) {
        case 'Die':
          throw exit.cause.error
        case 'Interrupt':
          throw new Error('Child fiber was interrupted')
        case 'Fail':
          return yield* $Exception.raise(exit.cause.error as ErrorOf<G>)
      }
    }
  })
}

import * as $Cause from '../Cause'
import {
  AnyEffector,
  ContextOf,
  Effector,
  ErrorOf,
  OutputOf,
} from '../Effector'
import * as $Generator from '../Generator'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $Exception from '../effect/Exception'
import * as $Fork from '../effect/Fork'
import * as $Join from '../effect/Join'
import { ConcurrencyError } from '../error/ConcurrencyError'
import { InterruptError } from '../error/InterruptError'
import * as $Fiber from '../fiber/Fiber'

export function* all<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<OutputOf<G>[], ErrorOf<G>, ContextOf<G>> {
  const fibers = yield* $Generator.traverse(effectors, $Fork.fork)
  try {
    const values = []
    let done = 0
    for (let i = 0; done < fibers.length; i++) {
      const index = i % fibers.length
      const fiber = fibers[index]
      if (fiber === undefined) {
        continue
      }

      switch (fiber.status[$Type.tag]) {
        case 'Terminated':
          switch (fiber.status.exit[$Type.tag]) {
            case 'Success':
              delete fibers[index]
              values[index] = fiber.status.exit.value
              done++

              break
            case 'Failure':
              return yield* $Join.join(fiber)
          }
        default:
          yield

          break
      }
    }

    return values
  } finally {
    yield* $Generator.fromPromise(
      Promise.all(fibers.map((fiber) => $Fiber.interrupt(fiber))),
    )
  }
}

export function* any<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<OutputOf<G>, ConcurrencyError, ContextOf<G>> {
  const fibers = yield* $Generator.traverse(effectors, $Fork.fork)
  try {
    const errors = []
    let done = 0
    for (let i = 0; done < fibers.length; i++) {
      const index = i % fibers.length
      const fiber = fibers[index]
      if (fiber === undefined) {
        continue
      }

      switch (fiber.status[$Type.tag]) {
        case 'Terminated':
          switch (fiber.status.exit[$Type.tag]) {
            case 'Success':
              return fiber.status.exit.value
            case 'Failure':
              delete fibers[index]
              errors[index] = $Cause.isInterrupt(fiber.status.exit.cause)
                ? new InterruptError(fiber.id)
                : fiber.status.exit.cause.error
              done++

              break
          }
        default:
          yield

          break
      }
    }

    return yield* $Exception.raise(
      new ConcurrencyError(errors, 'All fibers failed'),
    )
  } finally {
    yield* $Generator.fromPromise(
      Promise.all(fibers.map((fiber) => $Fiber.interrupt(fiber))),
    )
  }
}

export function* race<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<OutputOf<G>, ErrorOf<G>, ContextOf<G>> {
  const fibers = yield* $Generator.traverse(effectors, $Fork.fork)
  try {
    for (let i = 0; true; i++) {
      const fiber = fibers[i % fibers.length]
      switch (fiber.status[$Type.tag]) {
        case 'Terminated':
          switch (fiber.status.exit[$Type.tag]) {
            case 'Success':
              return fiber.status.exit.value
            case 'Failure':
              return yield* $Join.join(fiber)
          }
        default:
          yield

          break
      }
    }
  } finally {
    yield* $Generator.fromPromise(
      Promise.all(fibers.map((fiber) => $Fiber.interrupt(fiber))),
    )
  }
}

import * as $Cause from './Cause'
import { AnyEffector, ErrorOf, OutputOf, RequirementOf } from './Effector'
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Generator from './Generator'
import { ReturnOf, YieldOf } from './Generator'
import { Layer } from './Layer'
import * as $Type from './Type'
import { IsNever, OrLazy } from './Type'
import * as $Effect from './effect/Effect'
import { Effect } from './effect/Effect'
import * as $Fiber from './fiber/Fiber'
import { Fiber } from './fiber/Fiber'
import { Id } from './fiber/Id'
import * as $Status from './fiber/Status'
import * as $Loop from './loop/Loop'

export class Runtime<R> {
  static readonly create = <R>(layer: Layer<never, R>) => new Runtime<R>(layer)

  private constructor(private readonly layer: Layer<never, R>) {
    Id.reset()
  }

  readonly run = async <
    G extends AnyEffector<any, any, IsNever<R> extends false ? R : any>,
  >(
    effector: OrLazy<G>,
    parent?: Fiber<ReturnOf<G>, YieldOf<G>>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    try {
      const fiber = $Fiber.fiber(effector, parent?.id)
      const exits = new Map<Id, Exit<any, any>>()
      const tasks = await $Loop
        .loop()
        .attach(fiber)
        .run({
          onSuspended: async (task) => {
            const exit = $Effect.is(task.fiber.status.value)
              ? await this.handle(
                  task.fiber.status.value as Effect<any, any, any>,
                  task.fiber,
                )
              : $Exit.success(undefined)
            if ($Exit.isFailure(exit)) {
              if (
                $Cause.isInterrupt(exit.cause) &&
                exit.cause.fiberId === fiber.id
              ) {
                exits.set(task.fiber.id, exit)
                await task.fiber.interrupt()

                return
              }

              const error = $Cause.isInterrupt(exit.cause)
                ? new Error(
                    `Fiber ${exit.cause.fiberId} for effect "${
                      (
                        task.fiber.status.value as unknown as Effect<
                          any,
                          any,
                          any
                        >
                      )[$Type.tag]
                    }" was interrupted`,
                  )
                : exit.cause.error
              const status = await task.fiber.throw(error)
              if (
                !$Cause.isInterrupt(exit.cause) &&
                $Status.isFailed(status) &&
                status.error === exit.cause.error
              ) {
                exits.set(task.fiber.id, exit)
              }
            } else {
              await task.fiber.resume(exit.value)
            }
          },
        })

      const exit = exits.get(fiber.id)
      if (exit !== undefined) {
        return exit
      }

      const task = tasks.get(fiber.id)
      if (task === undefined) {
        throw new Error('Cannot find main task')
      }

      switch (task.fiber.status[$Type.tag]) {
        case 'Interrupted':
          return $Exit.failure($Cause.interrupt(task.fiber.id))
        case 'Failed':
          throw task.fiber.status.error
        case 'Terminated':
          return $Exit.success(task.fiber.status.value)
      }

      throw new Error('Cannot resolve effector')
    } catch (error) {
      return $Exit.failure($Cause.die(error))
    }
  }

  private readonly handle = async <A, E>(
    effect: Effect<A, E, R>,
    fiber: Fiber<any, any>,
  ) => {
    switch (effect[$Type.tag]) {
      case 'Exception':
        return $Exit.failure($Cause.fail(effect.error))
      case 'Fork':
        return this.resolve(
          effect.handle((effector) => this.run(effector, fiber)),
          fiber,
        )
      case 'Interrupt':
        return $Exit.failure($Cause.interrupt(fiber.id))
      case 'Proxy':
        return this.resolve(
          effect.handle(this.layer.handler(effect.tag)),
          fiber,
        )
      case 'Sandbox':
        const exit = await this.run(effect.try, fiber)
        if ($Exit.isSuccess(exit) || !$Cause.isFail(exit.cause)) {
          return exit
        }

        return this.resolve(effect.catch(exit.cause.error))
    }
  }

  private readonly resolve = async <A, E>(
    value: A | Promise<A> | AnyEffector<A, E, R>,
    fiber: Fiber<any, any>,
  ) => {
    const _value = await value

    return $Generator.is(_value)
      ? this.run(_value, fiber)
      : $Exit.success(_value)
  }
}

export function runtime<R>(layer: Layer<never, R>) {
  return Runtime.create(layer)
}

export function runExit<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
  layer: Layer<never, RequirementOf<G>>,
) {
  return runtime(layer).run(effector)
}

export async function runPromise<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
  layer: Layer<never, RequirementOf<G>>,
) {
  const exit = await runExit(effector, layer)
  if ($Exit.isFailure(exit)) {
    throw $Cause.isInterrupt(exit.cause)
      ? new Error('Fiber was interrupted')
      : exit.cause.error
  }

  return exit.value
}

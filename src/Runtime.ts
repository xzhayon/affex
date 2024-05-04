import * as $Cause from './Cause'
import { AnyEffector, ErrorOf, OutputOf, RequirementOf } from './Effector'
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Generator from './Generator'
import { Layer } from './Layer'
import * as $Type from './Type'
import { IsNever, OrLazy } from './Type'
import * as $Effect from './effect/Effect'
import { Effect } from './effect/Effect'
import * as $Fiber from './fiber/Fiber'
import * as $Status from './fiber/Status'
import * as $Scheduler from './scheduler/Scheduler'
import * as $Task from './scheduler/Task'

export class Runtime<R> {
  static readonly create = <R>(layer: Layer<never, R>) => new Runtime<R>(layer)

  private constructor(private readonly layer: Layer<never, R>) {}

  readonly run = async <
    G extends AnyEffector<any, any, IsNever<R> extends false ? R : any>,
  >(
    effector: OrLazy<G>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    try {
      const scheduler = $Scheduler.scheduler().attach($Fiber.fiber(effector))
      for await (const task of scheduler) {
        switch (task.fiber.status[$Type.tag]) {
          case 'Suspended':
            const exit = $Effect.is(task.fiber.status.value)
              ? await this.handle(
                  task.fiber.status.value as Effect<any, any, any>,
                )
              : $Exit.success(undefined)
            const status = $Exit.isFailure(exit)
              ? await task.fiber.throw(exit.cause.error)
              : await task.fiber.resume(exit.value)
            if (
              $Task.isAttached(task) &&
              $Exit.isFailure(exit) &&
              $Status.isFailed(status) &&
              status.error === exit.cause.error
            ) {
              return exit
            }

            break
          case 'Failed':
            if ($Task.isAttached(task)) {
              throw task.fiber.status.error
            }

            break
          case 'Terminated':
            if ($Task.isAttached(task)) {
              return $Exit.success(task.fiber.status.value)
            }

            break
        }
      }

      throw new Error('Cannot resolve effector')
    } catch (error) {
      return $Exit.failure($Cause.die(error))
    }
  }

  private readonly handle = async <A, E>(effect: Effect<A, E, R>) => {
    switch (effect[$Type.tag]) {
      case 'Exception':
        return $Exit.failure($Cause.fail(effect.error))
      case 'Fork':
        return this.resolve(effect.handle((effector) => this.run(effector)))
      case 'Proxy':
        return this.resolve(effect.handle(this.layer.handler(effect.tag)))
      case 'Sandbox':
        const exit = await this.run(effect.try)
        if ($Exit.isSuccess(exit) || $Cause.isDie(exit.cause)) {
          return exit
        }

        return this.resolve(effect.catch(exit.cause.error))
    }
  }

  private readonly resolve = async <A, E>(
    value: A | Promise<A> | AnyEffector<A, E, R>,
  ) => {
    const _value = await value

    return $Generator.is(_value) ? this.run(_value) : $Exit.success(_value)
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
    throw exit.cause.error
  }

  return exit.value
}

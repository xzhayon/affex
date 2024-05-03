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

export class Runtime<R> {
  static readonly create = <R>(layer: Layer<never, R>) => new Runtime<R>(layer)

  private constructor(private readonly layer: Layer<never, R>) {}

  readonly run = async <
    G extends AnyEffector<any, any, IsNever<R> extends false ? R : any>,
  >(
    effector: OrLazy<G>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    try {
      const fiber = $Fiber.fiber(effector)
      let status = await fiber.start()
      while (!$Status.isFailed(status) && !$Status.isTerminated(status)) {
        if (!$Status.isSuspended(status)) {
          continue
        }

        if (!$Effect.is(status.value)) {
          status = await fiber.resume()

          continue
        }

        const exit = await this.handle(status.value as Effect<any, any, any>)
        status = $Exit.isFailure(exit)
          ? await fiber.throw(exit.cause.error)
          : await fiber.resume(exit.value)
        if (
          $Status.isFailed(status) &&
          $Exit.isFailure(exit) &&
          status.error === exit.cause.error
        ) {
          return exit
        }
      }

      if ($Status.isFailed(status)) {
        throw status.error
      }

      return $Exit.success(status.value)
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

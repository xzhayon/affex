import * as $Cause from './Cause'
import {
  AnyEffector,
  ContextOf,
  ErrorOf,
  OutputOf,
  Throw,
  Use,
} from './Effector'
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Generator from './Generator'
import { Layer } from './Layer'
import * as $Promise from './Promise'
import { trace } from './Trace'
import * as $Type from './Type'
import { OrLazy } from './Type'
import * as $Effect from './effect/Effect'
import { Effect } from './effect/Effect'
import * as $EffectId from './effect/Id'
import * as $Fiber from './fiber/Fiber'
import { Fiber } from './fiber/Fiber'
import * as $FiberId from './fiber/Id'
import * as $Loop from './fiber/Loop'
import { Loop } from './fiber/Loop'
import * as $Status from './fiber/Status'

const _trace = trace('Runtime')

export class Runtime<R> {
  private readonly loop = $Loop.loop() as unknown as Loop<Fiber<any, any>>
  private readonly effects = new Map<$EffectId.Id, Exit<any, any>>()

  static readonly create = <R>(layer: Layer<never, R>) => new Runtime<R>(layer)

  private constructor(private readonly layer: Layer<never, R>) {
    $FiberId.Id.reset()
    $EffectId.Id.reset()
  }

  readonly run = async <G extends AnyEffector<any, any, R>>(
    effector: OrLazy<G>,
    loop = this.loop,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    const fiber = $Fiber.fiber(effector)
    try {
      const fibers = new Map<$FiberId.Id, Exit<any, any>>()
      const tasks = await loop.attach(fiber).run({
        onSuspended: async (task) => {
          if (task.fiber.id === fiber.id) {
            await nextTick()
          }

          const exit = $Effect.is(task.fiber.status.value)
            ? await this.handle(
                task.fiber.status.value as Effect<any, any, any>,
                task.fiber as Fiber<any, any>,
                loop,
              )
            : $Exit.success(undefined)
          if (exit === undefined) {
            return
          }

          if ($Exit.isFailure(exit)) {
            if ($Cause.isInterrupt(exit.cause)) {
              fibers.set(task.fiber.id, exit)
              await task.fiber.interrupt()

              return
            }

            const status = await task.fiber.throw(exit.cause.error)
            if ($Status.isFailed(status) && status.error === exit.cause.error) {
              fibers.set(task.fiber.id, exit)
            }
          } else {
            await task.fiber.resume(exit.value)
          }
        },
      })

      const exit = fibers.get(fiber.id)
      if (exit !== undefined) {
        return exit
      }

      const task = tasks.get(fiber.id)
      if (task === undefined) {
        throw new Error(`Cannot find root task in fiber "${fiber.id}"`)
      }

      switch (task.fiber.status[$Type.tag]) {
        case 'Interrupted':
          return $Exit.failure($Cause.interrupt(task.fiber.id))
        case 'Failed':
          throw task.fiber.status.error
        case 'Terminated':
          return $Exit.success(task.fiber.status.value)
      }

      throw new Error(`Cannot resolve effector in fiber "${fiber.id}"`)
    } catch (error) {
      return $Exit.failure($Cause.die(error, fiber.id))
    }
  }

  private readonly handle = async <A, E>(
    effect: Effect<A, E, R>,
    fiber: Fiber<
      A,
      (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never)
    >,
    loop: Loop<Fiber<any, any>>,
  ) => {
    if (this.effects.has(effect.id)) {
      const exit = this.effects.get(effect.id)
      if (exit === undefined) {
        _trace('Await effect', fiber.id, {
          effectType: effect[$Type.tag],
          effectDescription:
            effect[$Type.tag] === 'Proxy'
              ? effect.tag.key.description
              : undefined,
          effectId: effect.id,
        })

        return undefined
      }

      _trace('Resolve effect', fiber.id, {
        effectType: effect[$Type.tag],
        effectDescription:
          effect[$Type.tag] === 'Proxy'
            ? effect.tag.key.description
            : undefined,
        effectId: effect.id,
      })
      this.effects.delete(effect.id)

      return exit
    }

    _trace('Handle effect', fiber.id, {
      effectType: effect[$Type.tag],
      effectDescription:
        effect[$Type.tag] === 'Proxy' ? effect.tag.key.description : undefined,
      effectId: effect.id,
    })
    switch (effect[$Type.tag]) {
      case 'Backdoor':
        return this.resolve(
          effect,
          effect.handle((effector) =>
            this.run(
              effector,
              $Loop.loop() as unknown as Loop<Fiber<any, any>>,
            ),
          ),
          fiber,
        )
      case 'Exception':
        return $Exit.failure($Cause.fail(effect.error, fiber.id))
      case 'Fork':
        const child = $Fiber.fiber(effect.effector)
        loop.detach(child)

        return $Exit.success(child)
      case 'Interruption':
        return $Exit.failure($Cause.interrupt(fiber.id))
      case 'Join':
        const task = loop.tasks.get(effect.fiber.id)
        if (task !== undefined) {
          switch (task.fiber.status[$Type.tag]) {
            case 'Interrupted':
              return $Exit.failure($Cause.interrupt(task.fiber.id))
            case 'Failed':
              return $Exit.failure(
                $Cause.die(task.fiber.status.error, task.fiber.id),
              )
            case 'Terminated':
              return $Exit.success(task.fiber.status.value)
          }
        }

        return undefined
      case 'Proxy':
        return await this.resolve(
          effect,
          effect.handle(this.layer.handler(effect.tag)),
          fiber,
        )
      case 'Sandbox':
        const exit = await this.run(
          effect.try,
          $Loop.loop() as unknown as Loop<Fiber<any, any>>,
        )
        if ($Exit.isSuccess(exit) || !$Cause.isFail(exit.cause)) {
          return exit
        }

        return this.resolve(effect, effect.catch(exit.cause.error), fiber)
      case 'Suspension':
        return $Exit.success(undefined)
    }
  }

  private readonly resolve = async <A, E>(
    effect: Effect<A, E, R>,
    value: A | Promise<A> | AnyEffector<A, E, R>,
    fiber: Fiber<
      A,
      (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never)
    >,
  ) => {
    if ($Promise.is(value)) {
      _trace('Create promise', fiber.id, {
        effectType: effect[$Type.tag],
        effectDescription:
          effect[$Type.tag] === 'Proxy'
            ? effect.tag.key.description
            : undefined,
        effectId: effect.id,
      })
      this.effects.set(effect.id, undefined as any)
      value
        .then((a) => {
          this.effects.set(effect.id, $Exit.success(a))
        })
        .catch((error) => {
          this.effects.set(
            effect.id,
            $Exit.failure($Cause.die(error, fiber.id)),
          )
        })
        .finally(() => {
          _trace('Settle promise', fiber.id, {
            effectType: effect[$Type.tag],
            effectDescription:
              effect[$Type.tag] === 'Proxy'
                ? effect.tag.key.description
                : undefined,
            effectId: effect.id,
          })
        })

      return undefined
    }

    if ($Generator.is(value)) {
      return this.run(value, $Loop.loop() as unknown as Loop<Fiber<any, any>>)
    }

    return $Exit.success(value)
  }
}

export const runtime = Runtime.create

export function runExit<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
  layer: Layer<never, ContextOf<G>>,
) {
  return runtime(layer).run(effector)
}

export async function runPromise<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
  layer: Layer<never, ContextOf<G>>,
) {
  const exit = await runExit(effector, layer)
  if ($Exit.isFailure(exit)) {
    throw $Cause.isInterrupt(exit.cause)
      ? new Error(`Fiber "${exit.cause.fiberId}" was interrupted`)
      : exit.cause.error
  }

  return exit.value
}

function nextTick() {
  return new Promise<void>((resolve) =>
    setImmediate !== undefined ? setImmediate(resolve) : setTimeout(resolve, 0),
  )
}

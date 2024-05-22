import * as $Cause from './Cause'
import { Context } from './Context'
import {
  AnyEffector,
  ContextOf,
  ErrorOf,
  OutputOf,
  Throw,
  Use,
} from './Effector'
import * as $Engine from './Engine'
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Function from './Function'
import * as $Generator from './Generator'
import * as $Promise from './Promise'
import * as $Type from './Type'
import { OrLazy } from './Type'
import * as $Effect from './effect/Effect'
import { Effect } from './effect/Effect'
import * as $EffectId from './effect/Id'
import * as $Fiber from './fiber/Fiber'
import { Fiber } from './fiber/Fiber'
import * as $FiberId from './fiber/Id'
import * as $Status from './fiber/Status'

export class Runtime<R> {
  private readonly queue: Fiber<any, any>[] = []
  private readonly fiberIds = new Map<$EffectId.Id, $FiberId.Id>()
  private readonly exits = new Map<$FiberId.Id, Exit<any, any>>()
  private readonly multiPass = new Set<$EffectId.Id>()

  static readonly create = <R>(context: Context<R>) => new Runtime<R>(context)

  private constructor(private readonly context: Context<R>) {}

  readonly run = async <G extends AnyEffector<any, any, R>>(
    effector: OrLazy<G>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    const root = $Fiber.fiber(effector)
    try {
      this.queue.push(root)
      while (true) {
        const fiber = this.queue.shift()
        if (fiber === undefined) {
          break
        }

        switch (fiber.status[$Type.tag]) {
          case 'Ready':
            await fiber.start()
          case 'Started':
          case 'Running':
            this.queue.push(fiber)

            break
          case 'Suspended':
            if (fiber.id === root.id) {
              await $Engine.skipTick()
            }

            if (!$Effect.is(fiber.status.value)) {
              await fiber.resume()
              this.queue.push(fiber)

              break
            }

            const exit = await this.handle(
              fiber.status.value as Effect<any, any, any>,
              fiber,
            )
            if (exit === undefined) {
              this.queue.push(fiber)

              break
            }

            if ($Exit.isFailure(exit)) {
              if ($Cause.isInterrupt(exit.cause)) {
                this.exits.set(fiber.id, exit)
                await fiber.interrupt()
                this.queue.push(fiber)

                break
              }

              const status = await fiber.throw(exit.cause.error)
              if (
                $Status.isFailed(status) &&
                status.error === exit.cause.error
              ) {
                this.exits.set(fiber.id, exit)
              }
            } else {
              await fiber.resume(exit.value)
            }

            this.queue.push(fiber)

            break
          case 'Interrupted':
            if (!this.exits.has(fiber.id)) {
              this.exits.set(
                fiber.id,
                $Exit.failure($Cause.interrupt(fiber.id)),
              )
            }

            if (fiber.id === root.id) {
              await this.halt()
            }

            break
          case 'Failed':
            if (!this.exits.has(fiber.id)) {
              this.exits.set(
                fiber.id,
                $Exit.failure($Cause.die(fiber.status.error, fiber.id)),
              )
            }

            if (fiber.id === root.id) {
              await this.halt()
            }

            break
          case 'Terminated':
            if (!this.exits.has(fiber.id)) {
              this.exits.set(fiber.id, $Exit.success(fiber.status.value))
            }

            if (fiber.id === root.id) {
              await this.halt()
            }

            break
        }
      }

      const exit = this.exits.get(root.id)
      if (exit === undefined) {
        throw new Error(`Cannot resolve effector in fiber "${root.id}"`)
      }

      return exit
    } catch (error) {
      return $Exit.failure($Cause.die(error, root.id))
    }
  }

  readonly halt = () =>
    Promise.all(this.queue.map((fiber) => fiber.interrupt())).then(() => {})

  private readonly handle = async <A, E>(
    effect: Effect<A, E, R>,
    fiber: Fiber<
      A,
      (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never)
    >,
  ) => {
    try {
      const fiberId = this.fiberIds.get(effect.id)
      if (fiberId !== undefined) {
        const exit = this.exits.get(fiberId)
        if (exit === undefined) {
          return undefined
        }

        if (effect[$Type.tag] !== 'Sandbox' || !this.multiPass.has(effect.id)) {
          this.fiberIds.delete(effect.id)

          return exit
        }
      }

      switch (effect[$Type.tag]) {
        case 'Backdoor': {
          const child = this.resolve(
            effect.handle((effector) => runExit(effector, this.context)),
          )
          this.queue.push(child)
          this.fiberIds.set(effect.id, child.id)

          return undefined
        }
        case 'Exception':
          return $Exit.failure($Cause.fail(effect.error, fiber.id))
        case 'Fork': {
          const child = this.resolve(effect.effector)
          this.queue.push(child)

          return $Exit.success(child)
        }
        case 'Interruption':
          return $Exit.failure($Cause.interrupt(fiber.id))
        case 'Join':
          this.fiberIds.set(effect.id, effect.fiber.id)

          return undefined
        case 'Proxy': {
          const child = this.resolve(
            effect.handle(this.context.handler(effect.tag)),
          )
          this.queue.push(child)
          this.fiberIds.set(effect.id, child.id)

          return undefined
        }
        case 'Sandbox':
          if (fiberId === undefined) {
            const child = this.resolve(effect.try)
            this.queue.push(child)
            this.fiberIds.set(effect.id, child.id)
            this.multiPass.add(effect.id)
          } else {
            const exit = this.exits.get(fiberId)
            if (exit === undefined) {
              return undefined
            }

            this.multiPass.delete(effect.id)
            if (!$Exit.isFailure(exit) || !$Cause.isFail(exit.cause)) {
              this.fiberIds.delete(effect.id)

              return exit
            }

            const child = this.resolve(effect.catch(exit.cause.error))
            this.queue.push(child)
            this.fiberIds.set(effect.id, child.id)
          }

          return undefined
        case 'Suspension':
          return $Exit.success(undefined)
      }
    } catch (error) {
      return $Exit.failure($Cause.die(error, fiber.id))
    }
  }

  private readonly resolve = <A, E, _R extends R>(
    value: A | Promise<A> | OrLazy<AnyEffector<A, E, _R>>,
  ) => {
    if ($Function.is(value) || $Generator.is(value)) {
      return $Fiber.fiber(value)
    }

    if ($Promise.is(value)) {
      return $Fiber.fromPromise(value)
    }

    return $Fiber.fromValue(value)
  }
}

export const runtime = Runtime.create

export function runExit<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
  context: Context<ContextOf<G>>,
) {
  return runtime(context).run(effector)
}

export async function runPromise<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
  context: Context<ContextOf<G>>,
) {
  const exit = await runExit(effector, context)
  if ($Exit.isFailure(exit)) {
    throw $Cause.isInterrupt(exit.cause)
      ? new Error(`Fiber "${exit.cause.fiberId}" was interrupted`)
      : exit.cause.error
  }

  return exit.value
}

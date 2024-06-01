import * as $Cause from '../Cause'
import { AnyEffector, ErrorOf, OutputOf } from '../Effector'
import * as $Exit from '../Exit'
import { Exit } from '../Exit'
import * as $Function from '../Function'
import * as $Generator from '../Generator'
import * as $Promise from '../Promise'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import { Effect } from '../effect/Effect'
import { Id } from '../effect/Id'
import { InterruptError } from '../error/InterruptError'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import * as $Status from '../fiber/Status'
import { Context } from './Context'
import * as $Engine from './Engine'

export class Runtime<R> {
  private fiber!: Fiber<any, any, R>
  private readonly queue: Fiber<unknown, unknown, R>[] = []
  private readonly effectFibers = new Map<Id, Fiber<unknown, unknown, R>>()
  private readonly multiPassEffects = new Set<Id>()

  static readonly make = <R>(context: Context<R>) => new Runtime<R>(context)

  private constructor(private readonly context: Context<R>) {}

  readonly run = async <G extends AnyEffector<any, any, R>>(
    effector: OrLazy<G>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    try {
      this.fiber = $Fiber.fiber(effector)
      this.queue.push(this.fiber)
      while (true) {
        const fiber = this.queue.shift()
        if (fiber === undefined) {
          break
        }

        switch (fiber.status[$Type.tag]) {
          case 'Ready':
            $Fiber.start(fiber)
            this.queue.push(fiber)

            break
          case 'Started':
            this.queue.push(fiber)

            break
          case 'Running':
            await $Engine.skipTick()
            this.queue.push(fiber)

            break
          case 'Suspended':
            if (fiber.status.effect === undefined) {
              $Fiber.resume(fiber)
              this.queue.push(fiber)

              break
            }

            const exit = this.handle(fiber.status.effect._, fiber)
            if (exit !== undefined) {
              $Fiber.resume(fiber, exit)
            }
            this.queue.push(fiber)

            break
        }
      }

      const exit = $Status.isTerminated(this.fiber.status)
        ? this.fiber.status.exit
        : undefined
      if (exit === undefined) {
        throw new Error(`Cannot resolve effector in fiber "${this.fiber.id}"`)
      }

      return exit
    } catch (error) {
      return $Exit.failure($Cause.die(error))
    }
  }

  private readonly handle = <A, E>(
    effect: Effect<A, E, R>,
    fiber: Fiber<unknown, unknown, R>,
  ) => {
    try {
      const effectFiber = this.effectFibers.get(effect.id)
      if (effectFiber !== undefined) {
        const exit = $Status.isTerminated(effectFiber.status)
          ? effectFiber.status.exit
          : undefined
        if (exit === undefined) {
          return undefined
        }

        if (
          effect[$Type.tag] !== 'Sandbox' ||
          !this.multiPassEffects.has(effect.id)
        ) {
          this.effectFibers.delete(effect.id)

          return exit
        }
      }

      switch (effect[$Type.tag]) {
        case 'Backdoor': {
          const valueOrChild = this.resolve(
            effect.handle((effector) => runExit(effector, this.context)),
          )
          if (!$Fiber.is(valueOrChild)) {
            return $Exit.success(valueOrChild)
          }

          $Fiber.supervise(fiber, valueOrChild)
          this.queue.push(valueOrChild)
          this.effectFibers.set(effect.id, valueOrChild)

          return undefined
        }
        case 'Exception':
          return $Exit.failure($Cause.fail(effect.error))
        case 'Fork': {
          const child = this.resolve(effect.effector)
          const parent = effect.global ? this.fiber : fiber
          $Fiber.supervise(parent, child)
          this.queue.push(child)

          return $Exit.success(child)
        }
        case 'Interruption':
          return $Exit.failure($Cause.interrupt())
        case 'Join':
          $Fiber.supervise(fiber, effect.fiber)
          this.effectFibers.set(effect.id, effect.fiber)

          return undefined
        case 'Proxy': {
          const valueOrChild = this.resolve(
            effect.handle(this.context.handler(effect.tag)),
          )
          if (!$Fiber.is(valueOrChild)) {
            return $Exit.success(valueOrChild)
          }

          $Fiber.supervise(fiber, valueOrChild)
          this.queue.push(valueOrChild)
          this.effectFibers.set(effect.id, valueOrChild)

          return undefined
        }
        case 'Sandbox':
          if (effectFiber === undefined) {
            const valueOrChild = this.resolve(effect.try)
            if (!$Fiber.is(valueOrChild)) {
              return $Exit.success(valueOrChild)
            }

            $Fiber.supervise(fiber, valueOrChild)
            this.queue.push(valueOrChild)
            this.effectFibers.set(effect.id, valueOrChild)
            this.multiPassEffects.add(effect.id)
          } else {
            const exit = $Status.isTerminated(effectFiber.status)
              ? effectFiber.status.exit
              : undefined
            if (exit === undefined) {
              return undefined
            }

            this.multiPassEffects.delete(effect.id)
            if (!$Exit.isFailure(exit) || !$Cause.isFail(exit.cause)) {
              this.effectFibers.delete(effect.id)

              return exit
            }

            const valueOrChild = this.resolve(effect.catch(exit.cause.error))
            if (!$Fiber.is(valueOrChild)) {
              return $Exit.success(valueOrChild)
            }

            $Fiber.supervise(fiber, valueOrChild)
            this.queue.push(valueOrChild)
            this.effectFibers.set(effect.id, valueOrChild)
          }

          return undefined
        case 'Scope': {
          const valueOrChild = this.resolve(effect.effector)
          if (!$Fiber.is(valueOrChild)) {
            return $Exit.success(valueOrChild)
          }

          $Fiber.supervise(fiber, valueOrChild)
          this.queue.push(valueOrChild)
          this.effectFibers.set(effect.id, valueOrChild)

          return undefined
        }
        case 'Suspension':
          return $Exit.success(undefined)
      }
    } catch (error) {
      return $Exit.failure($Cause.die(error))
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

    return value
  }
}

export const runtime = Runtime.make

export function runExit<R, G extends AnyEffector<any, any, R>>(
  effector: OrLazy<G>,
  context: Context<R>,
) {
  return runtime(context).run(effector)
}

export async function runPromise<R, G extends AnyEffector<any, any, R>>(
  effector: OrLazy<G>,
  context: Context<R>,
) {
  const exit = await runExit(effector, context)
  if ($Exit.isFailure(exit)) {
    throw $Cause.isInterrupt(exit.cause)
      ? new InterruptError()
      : exit.cause.error
  }

  return exit.value
}

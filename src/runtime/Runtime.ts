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
import { EffectId } from '../effect/EffectId'
import { InterruptError } from '../error/InterruptError'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import { FiberId } from '../fiber/FiberId'
import * as $Status from '../fiber/Status'
import { Context } from './Context'
import * as $Engine from './Engine'

export class Runtime<R> {
  private rootFiber!: Fiber<any, any, R>
  private readonly queue: Fiber<unknown, unknown, R>[] = []
  private readonly fiberByEffect = new Map<
    EffectId,
    Fiber<unknown, unknown, R>
  >()
  private readonly scopeByFiber = new Map<
    FiberId,
    Fiber<unknown, unknown, R>[]
  >()
  private readonly multiPassEffects = new Set<EffectId>()

  static readonly make = <R>(context: Context<R>) => new Runtime<R>(context)

  private constructor(private readonly context: Context<R>) {}

  readonly run = async <G extends AnyEffector<any, any, R>>(
    effector: OrLazy<G>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    try {
      this.rootFiber = $Fiber.fiber(effector)
      this.queue.push(this.rootFiber)
      while (true) {
        const currentFiber = this.queue.shift()
        if (currentFiber === undefined) {
          break
        }

        switch (currentFiber.status[$Type.tag]) {
          case 'Ready':
            currentFiber.start()
            this.queue.push(currentFiber)

            break
          case 'Started':
            this.queue.push(currentFiber)

            break
          case 'Running':
            await $Engine.skipTick()
            this.queue.push(currentFiber)

            break
          case 'Suspended':
            if (currentFiber.status.effect === undefined) {
              currentFiber.resume()
              this.queue.push(currentFiber)

              break
            }

            const exit = this.handleEffect(
              currentFiber.status.effect._,
              currentFiber,
            )
            if (exit !== undefined) {
              currentFiber.resume(exit)
            }
            this.queue.push(currentFiber)

            break
          case 'Terminated':
            await this.closeScope(currentFiber.id)

            break
        }
      }

      const exit = $Status.isTerminated(this.rootFiber.status)
        ? this.rootFiber.status.exit
        : undefined
      if (exit === undefined) {
        throw new Error(
          `Cannot resolve effector in fiber "${this.rootFiber.id}"`,
        )
      }

      return exit
    } catch (error) {
      return $Exit.failure($Cause.die(error))
    }
  }

  private readonly handleEffect = <A, E>(
    effect: Effect<A, E, R>,
    currentFiber: Fiber<unknown, unknown, R>,
  ) => {
    try {
      const effectFiber = this.fiberByEffect.get(effect.id)
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
          this.fiberByEffect.delete(effect.id)

          return exit
        }
      }

      switch (effect[$Type.tag]) {
        case 'Backdoor': {
          const valueOrFiber = this.resolveEffect(
            effect.handle((effector) => runExit(effector, this.context)),
          )
          if (!$Fiber.is(valueOrFiber)) {
            return $Exit.success(valueOrFiber)
          }

          this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
          this.fiberByEffect.set(effect.id, valueOrFiber)

          return undefined
        }
        case 'Exception':
          return $Exit.failure($Cause.fail(effect.error))
        case 'Fork': {
          const fiber = this.resolveEffect(effect.effector)
          this.enqueueScopedFiber(
            effect.global ? this.rootFiber.id : currentFiber.id,
            fiber,
          )

          return $Exit.success(fiber)
        }
        case 'Interruption':
          return $Exit.failure($Cause.interrupt())
        case 'Join':
          this.scopeFiber(currentFiber.id, effect.fiber)
          this.fiberByEffect.set(effect.id, effect.fiber)

          return undefined
        case 'Proxy': {
          const valueOrFiber = this.resolveEffect(
            effect.handle(this.context.handler(effect.tag)),
          )
          if (!$Fiber.is(valueOrFiber)) {
            return $Exit.success(valueOrFiber)
          }

          this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
          this.fiberByEffect.set(effect.id, valueOrFiber)

          return undefined
        }
        case 'Sandbox':
          if (effectFiber === undefined) {
            const valueOrFiber = this.resolveEffect(effect.try)
            if (!$Fiber.is(valueOrFiber)) {
              return $Exit.success(valueOrFiber)
            }

            this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
            this.fiberByEffect.set(effect.id, valueOrFiber)
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
              this.fiberByEffect.delete(effect.id)

              return exit
            }

            const valueOrFiber = this.resolveEffect(
              effect.catch(exit.cause.error),
            )
            if (!$Fiber.is(valueOrFiber)) {
              return $Exit.success(valueOrFiber)
            }

            this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
            this.fiberByEffect.set(effect.id, valueOrFiber)
          }

          return undefined
        case 'Scope': {
          const valueOrFiber = this.resolveEffect(effect.effector)
          if (!$Fiber.is(valueOrFiber)) {
            return $Exit.success(valueOrFiber)
          }

          this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
          this.fiberByEffect.set(effect.id, valueOrFiber)

          return undefined
        }
        case 'Suspension':
          return $Exit.success(undefined)
      }
    } catch (error) {
      return $Exit.failure($Cause.die(error))
    }
  }

  private readonly resolveEffect = <A, E, _R extends R>(
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

  private readonly scopeFiber = (
    scopeId: FiberId,
    fiber: Fiber<any, any, R>,
  ) => {
    const scope = this.scopeByFiber.get(scopeId)
    this.scopeByFiber.set(
      scopeId,
      scope !== undefined ? scope.concat(fiber) : [fiber],
    )
  }

  private readonly enqueueScopedFiber = (
    scopeId: FiberId,
    fiber: Fiber<any, any, R>,
  ) => {
    this.scopeFiber(scopeId, fiber)
    this.queue.push(fiber)
  }

  private readonly closeScope = (scopeId: FiberId) => {
    const scope = this.scopeByFiber.get(scopeId)
    this.scopeByFiber.delete(scopeId)

    return scope !== undefined
      ? Promise.all(scope.map((fiber) => fiber.interrupt())).then(() => {})
      : Promise.resolve(undefined)
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

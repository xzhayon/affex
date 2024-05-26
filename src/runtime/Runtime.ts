import * as $Cause from '../Cause'
import {
  AnyEffector,
  ContextOf,
  ErrorOf,
  OutputOf,
  Throw,
  Use,
} from '../Effector'
import * as $Exit from '../Exit'
import { Exit } from '../Exit'
import * as $Function from '../Function'
import * as $Generator from '../Generator'
import * as $Promise from '../Promise'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $Effect from '../effect/Effect'
import { Effect } from '../effect/Effect'
import { EffectId } from '../effect/EffectId'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import { FiberId } from '../fiber/FiberId'
import { Context } from './Context'
import * as $Engine from './Engine'

export class Runtime<R> {
  private rootFiber!: Fiber<any, any>
  private readonly queue: Fiber<any, any>[] = []
  private readonly fiberByEffect = new Map<EffectId, FiberId>()
  private readonly scopeByFiber = new Map<FiberId, Fiber<any, any>[]>()
  private readonly exitByFiber = new Map<FiberId, Exit<any, any>>()
  private readonly multiPassEffects = new Set<EffectId>()

  static readonly make = <R>(context: Context<R>) => new Runtime<R>(context)

  private constructor(private readonly context: Context<R>) {}

  readonly run = async <G extends AnyEffector<any, any, R>>(
    effector: OrLazy<G>,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    this.rootFiber = $Fiber.fiber(effector)
    try {
      this.queue.push(this.rootFiber)
      while (true) {
        const currentFiber = this.queue.shift()
        if (currentFiber === undefined) {
          break
        }

        switch (currentFiber.status[$Type.tag]) {
          case 'Ready':
            await currentFiber.start()
          case 'Started':
          case 'Running':
            this.queue.push(currentFiber)

            break
          case 'Suspended':
            if (currentFiber.id === this.rootFiber.id) {
              await $Engine.skipTick()
            }

            if (!$Effect.is(currentFiber.status.value)) {
              await currentFiber.resume()
              this.queue.push(currentFiber)

              break
            }

            const exit = this.handleEffect(
              currentFiber.status.value as Effect<any, any, any>,
              currentFiber,
            )
            this.queue.push(currentFiber)
            if (exit === undefined) {
              break
            }

            switch (exit[$Type.tag]) {
              case 'Success':
                await currentFiber.resume(exit.value)

                break
              case 'Failure':
                this.saveFiberExit(currentFiber.id, exit)
                switch (exit.cause[$Type.tag]) {
                  case 'Die':
                  case 'Fail':
                    await currentFiber.throw(exit.cause.error)

                    break
                  case 'Interrupt':
                    await currentFiber.interrupt()

                    break
                }

                break
            }

            break
          case 'Interrupted':
            this.saveFiberExit(
              currentFiber.id,
              $Exit.failure($Cause.interrupt(currentFiber.id)),
            )
            await this.closeScope(currentFiber.id)

            break
          case 'Failed':
            this.saveFiberExit(
              currentFiber.id,
              $Exit.failure(
                $Cause.die(currentFiber.status.error, currentFiber.id),
              ),
            )
            await this.closeScope(currentFiber.id)

            break
          case 'Terminated':
            this.saveFiberExit(
              currentFiber.id,
              $Exit.success(currentFiber.status.value),
            )
            await this.closeScope(currentFiber.id)

            break
        }
      }

      const exit = this.exitByFiber.get(this.rootFiber.id)
      if (exit === undefined) {
        throw new Error(
          `Cannot resolve effector in fiber "${this.rootFiber.id}"`,
        )
      }

      return exit
    } catch (error) {
      return $Exit.failure($Cause.die(error, this.rootFiber.id))
    }
  }

  private readonly handleEffect = <A, E>(
    effect: Effect<A, E, R>,
    currentFiber: Fiber<
      A,
      (R extends any ? Use<R> : never) | (E extends any ? Throw<E> : never)
    >,
  ) => {
    try {
      const fiberId = this.fiberByEffect.get(effect.id)
      if (fiberId !== undefined) {
        const exit = this.exitByFiber.get(fiberId)
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
          this.fiberByEffect.set(effect.id, valueOrFiber.id)

          return undefined
        }
        case 'Exception':
          return $Exit.failure($Cause.fail(effect.error, currentFiber.id))
        case 'Fork': {
          const effectFiber = this.resolveEffect(effect.effector)
          this.enqueueScopedFiber(
            effect.global ? this.rootFiber.id : currentFiber.id,
            effectFiber,
          )

          return $Exit.success(effectFiber)
        }
        case 'Interruption':
          return $Exit.failure($Cause.interrupt(currentFiber.id))
        case 'Join':
          this.scopeFiber(currentFiber.id, effect.fiber)
          this.fiberByEffect.set(effect.id, effect.fiber.id)

          return undefined
        case 'Proxy': {
          const valueOrFiber = this.resolveEffect(
            effect.handle(this.context.handler(effect.tag)),
          )
          if (!$Fiber.is(valueOrFiber)) {
            return $Exit.success(valueOrFiber)
          }

          this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
          this.fiberByEffect.set(effect.id, valueOrFiber.id)

          return undefined
        }
        case 'Sandbox':
          if (fiberId === undefined) {
            const valueOrFiber = this.resolveEffect(effect.try)
            if (!$Fiber.is(valueOrFiber)) {
              return $Exit.success(valueOrFiber)
            }

            this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
            this.fiberByEffect.set(effect.id, valueOrFiber.id)
            this.multiPassEffects.add(effect.id)
          } else {
            const exit = this.exitByFiber.get(fiberId)
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
            this.fiberByEffect.set(effect.id, valueOrFiber.id)
          }

          return undefined
        case 'Scope': {
          const valueOrFiber = this.resolveEffect(effect.effector)
          if (!$Fiber.is(valueOrFiber)) {
            return $Exit.success(valueOrFiber)
          }

          this.enqueueScopedFiber(currentFiber.id, valueOrFiber)
          this.fiberByEffect.set(effect.id, valueOrFiber.id)

          return undefined
        }
        case 'Suspension':
          return $Exit.success(undefined)
      }
    } catch (error) {
      return $Exit.failure($Cause.die(error, currentFiber.id))
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

  private readonly scopeFiber = (scopeId: FiberId, fiber: Fiber<any, any>) => {
    const scope = this.scopeByFiber.get(scopeId)
    this.scopeByFiber.set(
      scopeId,
      scope !== undefined ? scope.concat(fiber) : [fiber],
    )
  }

  private readonly enqueueScopedFiber = (
    scopeId: FiberId,
    fiber: Fiber<any, any>,
  ) => {
    this.scopeFiber(scopeId, fiber)
    this.queue.push(fiber)
  }

  private readonly saveFiberExit = (fiberId: FiberId, exit: Exit<any, any>) => {
    if ($Exit.isSuccess(exit)) {
      this.exitByFiber.set(fiberId, exit)

      return
    }

    const savedExit = this.exitByFiber.get(fiberId)
    if (savedExit === undefined || $Exit.isSuccess(savedExit)) {
      this.exitByFiber.set(fiberId, exit)

      return
    }

    switch (savedExit.cause[$Type.tag]) {
      case 'Die':
      case 'Fail':
        if (
          (!$Cause.isDie(exit.cause) && !$Cause.isFail(exit.cause)) ||
          exit.cause.error !== savedExit.cause.error
        ) {
          this.exitByFiber.set(fiberId, exit)
        }

        break
      case 'Interrupt':
        if (!$Cause.isInterrupt(exit.cause)) {
          this.exitByFiber.set(fiberId, exit)
        }

        break
    }
  }

  private readonly closeScope = (scopeId: FiberId) => {
    const scope = this.scopeByFiber.get(scopeId)
    scope?.forEach((fiber) => this.exitByFiber.delete(fiber.id))
    this.scopeByFiber.delete(scopeId)

    return scope !== undefined
      ? Promise.all(scope.map((fiber) => fiber.interrupt())).then(() => {})
      : Promise.resolve(undefined)
  }
}

export const runtime = Runtime.make

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
      ? new Error(`Fiber "${exit.cause.fiberId}" interrupted`)
      : exit.cause.error
  }

  return exit.value
}

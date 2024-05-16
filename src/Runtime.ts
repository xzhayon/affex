import * as $Boh from './Boh'
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
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Function from './Function'
import * as $Generator from './Generator'
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
  private fibers = new Map<$FiberId.Id, Exit<any, any>>()
  private readonly _effects = new Map<$EffectId.Id, $FiberId.Id>()

  static readonly create = <R>(context: Context<R>) => new Runtime<R>(context)

  private constructor(private readonly context: Context<R>) {
    $FiberId.Id.reset()
    $EffectId.Id.reset()
  }

  readonly run = async <G extends AnyEffector<any, any, R>>(
    effector: OrLazy<G>,
    loop = this.loop,
  ): Promise<Exit<OutputOf<G>, ErrorOf<G>>> => {
    const fiber = $Fiber.fiber(effector)
    try {
      await loop.attach(fiber).run({
        onSuspended: async (task) => {
          if (task.fiber.id === fiber.id) {
            await nextTick()
          }

          if (!$Effect.is(task.fiber.status.value)) {
            await task.fiber.resume()

            return
          }

          const boh = await this.handle(
            task.fiber.status.value as Effect<any, any, any>,
            task.fiber as Fiber<any, any>,
            loop,
          )
          if ($Boh.isWaiting(boh)) {
            this._effects.set(task.fiber.status.value.id, boh.id)

            return
          }

          if ($Exit.isFailure(boh.exit)) {
            if ($Cause.isInterrupt(boh.exit.cause)) {
              this.fibers.set(task.fiber.id, boh.exit)
              await task.fiber.interrupt()

              return
            }

            const status = await task.fiber.throw(boh.exit.cause.error)
            if (
              $Status.isFailed(status) &&
              status.error === boh.exit.cause.error
            ) {
              this.fibers.set(task.fiber.id, boh.exit)
            }
          } else {
            await task.fiber.resume(boh.exit.value)
          }
        },
      })

      const exit = this.exit(fiber.id, loop)
      if (exit === undefined) {
        throw new Error(`Cannot resolve effector in fiber "${fiber.id}"`)
      }

      return exit
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
    const fiberId = this._effects.get(effect.id)
    if (fiberId !== undefined) {
      const exit = this.exit(fiberId, loop)
      if (exit === undefined) {
        _trace('Await effect', fiber.id, {
          effectType: effect[$Type.tag],
          effectDescription:
            effect[$Type.tag] === 'Proxy'
              ? effect.tag.key.description
              : undefined,
          effectId: effect.id,
        })

        return $Boh.waiting(fiberId)
      }

      _trace('Resolve effect', fiber.id, {
        effectType: effect[$Type.tag],
        effectDescription:
          effect[$Type.tag] === 'Proxy'
            ? effect.tag.key.description
            : undefined,
        effectId: effect.id,
      })

      return $Boh.done(exit)
    }

    _trace('Handle effect', fiber.id, {
      effectType: effect[$Type.tag],
      effectDescription:
        effect[$Type.tag] === 'Proxy' ? effect.tag.key.description : undefined,
      effectId: effect.id,
    })
    switch (effect[$Type.tag]) {
      case 'Backdoor': {
        const child = this.resolve(
          effect.handle((effector) =>
            this.run(
              effector,
              $Loop.loop() as unknown as Loop<Fiber<any, any>>,
            ),
          ),
        )
        loop.attach(child)

        return $Boh.waiting(child.id)
      }
      case 'Exception':
        return $Boh.done($Exit.failure($Cause.fail(effect.error, fiber.id)))
      case 'Fork': {
        const child = this.resolve(effect.effector as any)
        loop.detach(child)

        return $Boh.done($Exit.success(child))
      }
      case 'Interruption':
        return $Boh.done($Exit.failure($Cause.interrupt(fiber.id)))
      case 'Join':
        return $Boh.waiting(effect.fiber.id)
      case 'Proxy': {
        const child = this.resolve(
          effect.handle(this.context.handler(effect.tag)),
        )
        loop.attach(child)

        return $Boh.waiting(child.id)
      }
      case 'Sandbox': {
        const exit = await this.run(
          effect.try,
          $Loop.loop() as unknown as Loop<Fiber<any, any>>,
        )
        if ($Exit.isSuccess(exit) || !$Cause.isFail(exit.cause)) {
          return $Boh.done(exit)
        }

        const child = this.resolve(effect.catch(exit.cause.error))
        loop.attach(child)

        return $Boh.waiting(child.id)
      }
      case 'Suspension':
        return $Boh.done($Exit.success(undefined))
    }
  }

  private readonly resolve = <A, E>(
    value: A | Promise<A> | OrLazy<AnyEffector<A, E, R>>,
  ) => {
    if ($Function.is(value) || $Generator.is(value)) {
      return $Fiber.fiber(value)
    }

    if ($Promise.is(value)) {
      return $Fiber.fromPromise(value)
    }

    return $Fiber.fromValue(value)
  }

  private readonly exit = (
    fiberId: $FiberId.Id,
    loop: Loop<Fiber<any, any>>,
  ) => {
    const exit = this.fibers.get(fiberId)
    if (exit !== undefined) {
      return exit
    }

    const task = loop.tasks.get(fiberId)
    if (task === undefined) {
      return undefined
    }

    switch (task.fiber.status[$Type.tag]) {
      case 'Interrupted':
        return $Exit.failure($Cause.interrupt(task.fiber.id))
      case 'Failed':
        return $Exit.failure($Cause.die(task.fiber.status.error, task.fiber.id))
      case 'Terminated':
        return $Exit.success(task.fiber.status.value)
    }

    return undefined
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

function nextTick() {
  return new Promise<void>((resolve) =>
    setImmediate !== undefined ? setImmediate(resolve) : setTimeout(resolve, 0),
  )
}

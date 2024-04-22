import { Equal } from '@type-challenges/utils'
import * as $Cause from './Cause'
import { Use } from './Effector'
import * as $Exit from './Exit'
import { Exit } from './Exit'
import * as $Generator from './Generator'
import { AnyGenerator } from './Generator'
import { Layer } from './Layer'
import * as $Type from './Type'
import { OrLazy } from './Type'
import * as $Effect from './effect/Effect'
import { Effect } from './effect/Effect'
import * as $Fiber from './fiber/Fiber'
import * as $Result from './fiber/Result'

export class Runtime<R> {
  static create<R>(layer: Layer<never, R>) {
    return new Runtime<R>(layer)
  }

  private constructor(private readonly layer: Layer<never, R>) {}

  async run<
    G extends AnyGenerator<
      Equal<R, never> extends false ? (R extends any ? Use<R> : never) : any
    >,
  >(effector: OrLazy<G>): Promise<Exit<$Generator.ROf<G>, $Generator.TOf<G>>> {
    try {
      const fiber = $Fiber.fiber(effector)
      let result = await fiber.resume()
      while (!$Result.isReturn(result)) {
        if (!$Effect.is(result.value)) {
          result = await fiber.resume()

          continue
        }

        const exit = await this.handle(result.value as Effect<any, any, any>)
        if ($Exit.isFailure(exit)) {
          try {
            result = await fiber.except(exit.cause.error)

            continue
          } catch (error) {
            if (error !== exit.cause.error) {
              throw error
            }

            return exit
          }
        }

        result = await fiber.resume(exit.value)
      }

      return result.value
    } catch (error) {
      return $Exit.failure($Cause.die(error))
    }
  }

  private async handle<A, E>(effect: Effect<R, A, E>) {
    switch (effect[$Type.tag]) {
      case 'Exception':
        return $Exit.failure($Cause.fail(effect.error))
      case 'Fork':
      case 'Proxy':
        const value =
          effect[$Type.tag] === 'Fork'
            ? await effect.handle((effector) => this.run(effector))
            : await effect.handle(this.layer.handler(effect.tag))

        return $Generator.is(value)
          ? await this.run(value)
          : $Exit.success(value)
    }
  }
}

export function runtime<R>(layer: Layer<never, R>) {
  return Runtime.create(layer)
}

export function runExit<G extends AnyGenerator>(
  effector: OrLazy<G>,
  layer: Layer<never, $Generator.UOf<G>>,
) {
  return runtime(layer).run(effector)
}

export async function runPromise<G extends AnyGenerator>(
  effector: OrLazy<G>,
  layer: Layer<never, $Generator.UOf<G>>,
) {
  const exit = await runExit(effector, layer)
  if ($Exit.isFailure(exit)) {
    throw exit.cause.error
  }

  return exit.value
}

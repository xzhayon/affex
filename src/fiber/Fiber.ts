import { AnyEffector, ErrorOf, OutputOf } from '../Effector'
import * as $Exit from '../Exit'
import * as $Function from '../Function'
import { OrLazy } from '../Type'
import * as $Result from './Result'

export class Fiber<A, E> {
  static readonly create = <G extends AnyEffector<any, any, any>>(
    effector: OrLazy<G>,
  ) =>
    new Fiber<OutputOf<G>, ErrorOf<G>>(
      $Function.is(effector) ? effector() : effector,
    )

  private constructor(private readonly effector: AnyEffector<A, E, any>) {}

  readonly resume = async (value?: unknown) => {
    const result = await this.effector.next(value)
    if (!result.done) {
      return $Result.yield(result.value)
    }

    return $Result.return($Exit.success(result.value))
  }

  readonly except = async (error: unknown) => {
    if (this.effector.throw === undefined) {
      throw new Error('Cannot recover from error', { cause: error })
    }

    const result = await this.effector.throw(error)
    if (!result.done) {
      return $Result.yield(result.value)
    }

    return $Result.return($Exit.success(result.value))
  }
}

export function fiber<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
) {
  return Fiber.create(effector)
}

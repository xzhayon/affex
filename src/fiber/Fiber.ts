import { Equal } from '@type-challenges/utils'
import { Throw } from '../Effector'
import * as $Exit from '../Exit'
import * as $Generator from '../Generator'
import { AnyGenerator } from '../Generator'
import { OrLazy } from '../Type'
import * as $Result from './Result'

export class Fiber<A, E> {
  static create<G extends AnyGenerator>(effector: OrLazy<G>) {
    return new Fiber<$Generator.ROf<G>, $Generator.TOf<G>>(
      $Generator.is(effector) ? effector : effector(),
    )
  }

  private constructor(
    private readonly effector: AnyGenerator<
      unknown,
      A,
      Equal<E, never> extends false ? Throw<E> : unknown
    >,
  ) {}

  async resume(value?: unknown) {
    const result = await this.effector.next(value)
    if (!result.done) {
      return $Result.yield(result.value)
    }

    return $Result.return($Exit.success(result.value))
  }

  async except(error: unknown) {
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

export function fiber<G extends AnyGenerator>(effector: OrLazy<G>) {
  return Fiber.create(effector)
}

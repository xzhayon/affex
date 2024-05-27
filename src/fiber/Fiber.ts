import * as $Function from '../Function'
import * as $Generator from '../Generator'
import { AnyGenerator, ReturnOf, YieldOf } from '../Generator'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $FiberId from './FiberId'
import * as $Status from './Status'
import { Status } from './Status'

export class Fiber<out T, out S> {
  readonly id = $FiberId.id()
  private _status: Status<T, S> = $Status.ready()
  private _generator!: AnyGenerator<S, T>

  static readonly make = <G extends AnyGenerator<any, any>>(
    generator: OrLazy<G>,
  ) =>
    new Fiber<ReturnOf<G>, YieldOf<G>>(
      $Function.is(generator) ? generator : () => generator,
    )

  private constructor(private readonly generator: () => AnyGenerator<S, T>) {}

  get status() {
    return this._status
  }

  readonly start = async () => {
    this.assertStatus('Ready', 'start')

    try {
      this._status = $Status.started()
      this._generator = this.generator()

      return this.resolve(() => this._generator.next())
    } catch (error) {
      this._status = $Status.failed(error)

      return this._status
    }
  }

  readonly resume = async (value?: unknown) => {
    this.assertStatus('Suspended', 'resume')

    return this.resolve(() => this._generator.next(value))
  }

  readonly throw = async (error: unknown) => {
    this.assertStatus('Suspended', 'throw')

    return this.resolve(() => this._generator.throw(error))
  }

  readonly interrupt = async () => {
    try {
      switch (this._status[$Type.tag]) {
        case 'Running':
        case 'Suspended':
          await this._generator.return(undefined as any)

          break
        case 'Failed':
        case 'Terminated':
          return this._status
      }
    } catch {}

    this._status = $Status.interrupted()

    return this._status
  }

  private readonly assertStatus = (
    status: Status<T, S>[typeof $Type.tag],
    action: string,
  ) => {
    if (this._status[$Type.tag] !== status) {
      throw new Error(
        `Cannot ${action} fiber "${this.id}" in status "${
          this._status[$Type.tag]
        }"`,
      )
    }
  }

  private readonly resolve = async <_S extends S, _T extends T>(
    result: () => IteratorResult<_S, _T> | Promise<IteratorResult<_S, _T>>,
  ) => {
    try {
      this._status = $Status.running()
      const _result = await result()
      this._status = _result.done
        ? $Status.terminated(_result.value)
        : $Status.suspended(_result.value)
    } catch (error) {
      this._status = $Status.failed(error)
    } finally {
      return this._status
    }
  }
}

export type TOf<F extends Fiber<any, any>> = F extends Fiber<infer T, any>
  ? T
  : never
export type SOf<F extends Fiber<any, any>> = F extends Fiber<any, infer S>
  ? S
  : never

export const fiber = Fiber.make

export function fromPromise<A>(promise: OrLazy<Promise<A>>) {
  return fiber($Generator.fromPromise(promise))
}

export function is(u: unknown): u is Fiber<unknown, unknown> {
  return u instanceof Fiber
}

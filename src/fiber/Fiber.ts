import * as $Function from '../Function'
import { AnyGenerator, ReturnOf, YieldOf } from '../Generator'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $Status from './Status'
import { Status } from './Status'

export class Fiber<T, S> {
  private _status: Status<T, S> = $Status.idle()
  private _generator!: AnyGenerator<S, T>

  static readonly create = <G extends AnyGenerator<any, any>>(
    generator: OrLazy<G>,
  ) =>
    new Fiber<ReturnOf<G>, YieldOf<G>>(
      $Function.is(generator) ? generator : () => generator,
    )

  private constructor(private readonly generator: () => AnyGenerator<S, T>) {}

  get status() {
    return this._status
  }

  readonly start = () => {
    this.assertStatus('Idle', 'start')

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

  private readonly assertStatus = (
    status: Status<T, S>[typeof $Type.tag],
    action: string,
  ) => {
    if (this._status[$Type.tag] !== status) {
      throw new Error(
        `Cannot ${action} fiber in status "${this._status[$Type.tag]}"`,
      )
    }
  }

  private readonly resolve = async (
    result: () => IteratorResult<S, T> | Promise<IteratorResult<S, T>>,
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

export function fiber<G extends AnyGenerator>(generator: OrLazy<G>) {
  return Fiber.create(generator)
}

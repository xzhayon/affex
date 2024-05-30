import * as $Cause from '../Cause'
import { AnyEffector, ContextOf, ErrorOf, OutputOf } from '../Effector'
import * as $Exit from '../Exit'
import { Exit } from '../Exit'
import * as $Function from '../Function'
import * as $Generator from '../Generator'
import { AnyGenerator, YieldOf } from '../Generator'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $InterruptError from '../error/InterruptError'
import { InterruptError } from '../error/InterruptError'
import * as $FiberId from './FiberId'
import * as $Status from './Status'
import { Status } from './Status'

export class Fiber<out A, out E, out R> {
  readonly id = $FiberId.id()
  private effector!: AnyEffector<A, E, R>
  private _status: Status<A, E, R> = $Status.ready()
  private exit!: Exit<A, E>

  static readonly make = <G extends AnyGenerator<any, any>>(
    effector: OrLazy<G>,
  ) =>
    new Fiber<OutputOf<G>, ErrorOf<G>, ContextOf<G>>(
      $Function.is(effector) ? effector : () => effector,
    )

  private constructor(
    private readonly lazyEffector: () => AnyEffector<A, E, R>,
  ) {}

  get status() {
    return this._status
  }

  readonly start = async () => {
    this.assertStatus('Ready', 'start')

    try {
      this._status = $Status.started()
      this.effector = this.lazyEffector()

      return this.next()
    } catch (error) {
      this._status = $Status.terminated($Exit.failure($Cause.die(error)))

      return this._status
    }
  }

  readonly resume = async <_E extends E>(exit?: Exit<unknown, _E>) => {
    this.assertStatus('Suspended', 'resume')

    return this.next(exit)
  }

  readonly interrupt = async () => {
    try {
      switch (this._status[$Type.tag]) {
        case 'Running':
        case 'Suspended':
          await this.effector.return(undefined as any)

          break
        case 'Terminated':
          return this._status
      }
    } catch {}

    this._status = $Status.terminated($Exit.failure($Cause.interrupt()))

    return this._status
  }

  private readonly assertStatus = (
    status: Status<A, E, R>[typeof $Type.tag],
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

  private readonly next = async <_E extends E>(exit?: Exit<unknown, _E>) => {
    this._status = $Status.running()
    let result: IteratorResult<YieldOf<typeof this.effector>, A>
    try {
      switch (exit?.[$Type.tag]) {
        case undefined:
        case 'Success':
          result = await this.effector.next(exit?.value)

          break
        case 'Failure':
          this.exit = exit
          result = await this.effector.throw(
            $Cause.isInterrupt(exit.cause)
              ? new InterruptError()
              : exit.cause.error,
          )

          break
      }

      this._status = result.done
        ? $Status.terminated($Exit.success(result.value))
        : $Status.suspended(result.value)
    } catch (error) {
      switch (this.exit?.[$Type.tag]) {
        case undefined:
        case 'Success':
          this._status = $Status.terminated(
            $Exit.failure(
              $InterruptError.is(error)
                ? $Cause.interrupt()
                : $Cause.die(error),
            ),
          )

          break
        case 'Failure':
          this._status = $Status.terminated(
            $InterruptError.is(error)
              ? $Cause.isInterrupt(this.exit.cause)
                ? this.exit
                : $Exit.failure($Cause.interrupt())
              : !$Cause.isInterrupt(this.exit.cause) &&
                error === this.exit.cause.error
              ? this.exit
              : $Exit.failure($Cause.die(error)),
          )

          break
      }
    }

    return this._status
  }
}

export type AOf<F extends Fiber<any, any, any>> = F extends Fiber<
  infer A,
  any,
  any
>
  ? A
  : never
export type EOf<F extends Fiber<any, any, any>> = F extends Fiber<
  any,
  infer E,
  any
>
  ? E
  : never
export type ROf<F extends Fiber<any, any, any>> = F extends Fiber<
  any,
  any,
  infer R
>
  ? R
  : never

export const fiber = Fiber.make

export function fromPromise<A>(promise: OrLazy<Promise<A>>) {
  return fiber($Generator.fromPromiseAsync(promise))
}

export function is(u: unknown): u is Fiber<unknown, unknown, unknown> {
  return u instanceof Fiber
}

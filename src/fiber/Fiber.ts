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
import * as $FiberId from './Id'
import * as $Status from './Status'
import { Status } from './Status'

export class Fiber<out A, out E, out R> {
  readonly id = $FiberId.id()
  private effector!: AnyEffector<A, E, R>
  private _status: Status<A, E, R> = $Status.ready()
  private readonly children: Fiber<unknown, unknown, R>[] = []
  private exit!: Exit<A, E>

  static readonly make = <G extends AnyGenerator<any, any>>(
    effector: OrLazy<G>,
  ) =>
    new Fiber<OutputOf<G>, ErrorOf<G>, ContextOf<G>>(
      $Function.is(effector) ? effector : () => effector,
    )

  static readonly supervise = <R>(
    parent: Fiber<unknown, unknown, R>,
    child: Fiber<unknown, unknown, R>,
  ) => parent.supervise(child)

  static readonly start = <A, E, R>(fiber: Fiber<A, E, R>) => fiber.start()

  static readonly resume = <A, E, R, _E extends E>(
    fiber: Fiber<A, E, R>,
    exit?: Exit<unknown, _E>,
  ) => fiber.resume(exit)

  static readonly interrupt = <A, E, R>(fiber: Fiber<A, E, R>) =>
    fiber.interrupt()

  private constructor(
    private readonly lazyEffector: () => AnyEffector<A, E, R>,
  ) {}

  get status() {
    return this._status
  }

  private set status(status: Status<A, E, R>) {
    if ($Status.isTerminated(this._status)) {
      return
    }

    this._status = status
  }

  private readonly supervise = <_R extends R>(
    fiber: Fiber<unknown, unknown, _R>,
  ) => {
    this.children.push(fiber)
  }

  private readonly start = async () => {
    this.assert('Ready', 'start')

    try {
      this.status = $Status.started()
      this.effector = this.lazyEffector()

      return this.next()
    } catch (error) {
      this.status = $Status.terminated($Exit.failure($Cause.die(error)))
      await this.dispose()

      return this._status
    }
  }

  private readonly resume = async <_E extends E>(exit?: Exit<unknown, _E>) => {
    this.assert('Suspended', 'resume')

    return this.next(exit)
  }

  private readonly interrupt = async () => {
    try {
      switch (this._status[$Type.tag]) {
        case 'Ready':
          this.status = $Status.terminated($Exit.failure($Cause.interrupt()))
          await this.dispose()

          break
        case 'Started':
        case 'Running':
        case 'Suspended':
          this.status = $Status.terminated($Exit.failure($Cause.interrupt()))
          await this.effector.return(undefined as any)
          await this.dispose()

          break
      }
    } catch {}

    return this._status
  }

  private readonly assert = (
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
    try {
      this.status = $Status.running()
      let result: IteratorResult<YieldOf<typeof this.effector>, A>
      switch (exit?.[$Type.tag]) {
        case undefined:
        case 'Success':
          result = await this.effector.next(exit?.value)

          break
        case 'Failure':
          this.exit = exit
          result = await this.effector.throw(
            $Cause.isInterrupt(exit.cause)
              ? new InterruptError(this.id)
              : exit.cause.error,
          )

          break
      }

      if (result.done) {
        this.status = $Status.terminated($Exit.success(result.value))
        await this.dispose()
      } else {
        this.status = $Status.suspended(result.value)
      }
    } catch (error) {
      switch (this.exit?.[$Type.tag]) {
        case undefined:
        case 'Success':
          this.status = $Status.terminated(
            $Exit.failure(
              $InterruptError.is(error)
                ? $Cause.interrupt()
                : $Cause.die(error),
            ),
          )

          break
        case 'Failure':
          this.status = $Status.terminated(
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

      await this.dispose()
    }

    return this._status
  }

  private readonly dispose = async () => {
    const children = this.children.filter(
      (fiber) => !$Status.isTerminated(fiber.status),
    )
    if (children.length === 0) {
      return
    }

    await Promise.all(children.map((fiber) => fiber.interrupt()))
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

export const supervise = Fiber.supervise

export const start = Fiber.start

export const resume = Fiber.resume

export const interrupt = Fiber.interrupt

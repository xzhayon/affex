import * as $Queue from '../Queue'
import * as $Type from '../Type'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import { Status } from '../fiber/Status'
import * as $Task from './Task'
import { Task } from './Task'

export class Loop<F extends Fiber<any, any>> {
  private readonly queue = $Queue.queue<F extends any ? Task<F> : never>()

  static readonly create = () => new Loop<never>()

  private constructor() {}

  readonly attach = <_F extends Fiber<any, any>>(fiber: _F): Loop<F | _F> => {
    const self = this as Loop<F | _F>
    self.queue.enqueue(
      $Task.attached(fiber) as _F extends any ? Task<_F> : never,
    )

    return self
  }

  readonly detach = <_F extends Fiber<any, any>>(fiber: _F): Loop<F | _F> => {
    const self = this as Loop<F | _F>
    self.queue.enqueue(
      $Task.detached(fiber) as _F extends any ? Task<_F> : never,
    )

    return self
  }

  readonly run = async (handlers?: {
    readonly [S in Status<
      $Fiber.TOf<F>,
      $Fiber.SOf<F>
    > as `on${S[(typeof $Type)['tag']]}`]?: (
      task: F extends any ? Task<F> & { fiber: F & { status: S } } : never,
    ) => Promise<void>
  }) => {
    const terminated = []
    for (const task of this.queue) {
      const handler = handlers?.[`on${task.fiber.status[$Type.tag]}`]
      switch (task.fiber.status[$Type.tag]) {
        case 'Ready':
          await (handler?.(task as any) ?? task.fiber.start())
          this.queue.enqueue(task)

          break
        case 'Started':
        case 'Running':
          await handler?.(task as any)
          this.queue.enqueue(task)

          break
        case 'Suspended':
          await (handler?.(task as any) ?? task.fiber.resume())
          this.queue.enqueue(task)

          break
        case 'Interrupted':
        case 'Failed':
        case 'Terminated':
          await handler?.(task as any)
          terminated.push(task)

          break
      }

      if (this.attached.length === 0) {
        await this.halt()
      }
    }

    return terminated
  }

  readonly halt = async () => {
    await Promise.all(this.tasks.map((task) => task.fiber.interrupt()))
  }

  private get tasks() {
    return this.queue.toArray()
  }

  private get attached() {
    return this.tasks.filter($Task.isAttached)
  }
}

export const loop = Loop.create

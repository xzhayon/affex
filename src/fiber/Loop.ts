import * as $Queue from '../Queue'
import { trace } from '../Trace'
import * as $Type from '../Type'
import * as $Fiber from './Fiber'
import { Fiber } from './Fiber'
import { Id } from './Id'
import { Status } from './Status'
import * as $Task from './Task'
import { Task } from './Task'

const _trace = trace('Loop')

export class Loop<F extends Fiber<any, any>> {
  readonly tasks = new Map<Id, F extends any ? Task<F> : never>()
  private readonly queue = $Queue.queue<F extends any ? Task<F> : never>()

  static readonly create = () => new Loop<never>()

  private constructor() {}

  readonly attach = <_F extends Fiber<any, any>>(fiber: _F): Loop<F | _F> => {
    const self = this as Loop<F | _F>
    const task = $Task.attached(fiber) as _F extends any ? Task<_F> : never
    _trace('Attach fiber', fiber.id, { taskType: task[$Type.tag] })
    self.enqueue(task)

    return self
  }

  readonly detach = <_F extends Fiber<any, any>>(fiber: _F): Loop<F | _F> => {
    const self = this as Loop<F | _F>
    const task = $Task.detached(fiber) as _F extends any ? Task<_F> : never
    _trace('Detach fiber', fiber.id, { taskType: task[$Type.tag] })
    self.enqueue(task)

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
    for (const task of this.queue) {
      _trace('Dequeue task', task.fiber.id, {
        fiberStatus: task.fiber.status[$Type.tag],
        taskType: task[$Type.tag],
      })
      const handler = handlers?.[`on${task.fiber.status[$Type.tag]}`]
      switch (task.fiber.status[$Type.tag]) {
        case 'Ready':
          await (handler?.(task as any) ?? task.fiber.start())
          this.enqueue(task)

          break
        case 'Started':
        case 'Running':
          await handler?.(task as any)
          this.enqueue(task)

          break
        case 'Suspended':
          await (handler?.(task as any) ?? task.fiber.resume())
          this.enqueue(task)

          break
        case 'Interrupted':
        case 'Failed':
        case 'Terminated':
          await handler?.(task as any)
          this.tasks.set(task.fiber.id, task)

          break
      }

      if (this.attached.length === 0) {
        await this.halt()
      }
    }

    return this.tasks
  }

  readonly halt = async () => {
    await Promise.all(
      this.queue.toArray().map((task) => task.fiber.interrupt()),
    )
  }

  private get attached() {
    return this.queue.toArray().filter($Task.isAttached)
  }

  private enqueue(task: F extends any ? Task<F> : never) {
    _trace('Enqueue task', task.fiber.id, {
      fiberStatus: task.fiber.status[$Type.tag],
      taskType: task[$Type.tag],
    })
    this.queue.enqueue(task)
  }
}

export const loop = Loop.create

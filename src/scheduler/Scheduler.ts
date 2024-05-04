import * as $Iterator from '../Iterator'
import * as $Type from '../Type'
import { Fiber } from '../fiber/Fiber'
import * as $Task from './Task'
import { Task } from './Task'

export class Scheduler<F extends Fiber<any, any>>
  implements AsyncIterableIterator<F extends any ? Task<F> : never>
{
  private pointer = 0

  static readonly create = <F extends Fiber<any, any>>(
    tasks: (F extends any ? Task<F> : never)[] = [],
  ) => new Scheduler<F>(tasks)

  private constructor(
    private readonly tasks: (F extends any ? Task<F> : never)[] = [],
  ) {}

  readonly attach = <_F extends Fiber<any, any>>(
    fiber: _F,
  ): Scheduler<F | _F> => {
    const self = this as Scheduler<F | _F>
    self.tasks.push($Task.attached(fiber) as _F extends any ? Task<_F> : never)

    return self
  }

  readonly detach = <_F extends Fiber<any, any>>(
    fiber: _F,
  ): Scheduler<F | _F> => {
    const self = this as Scheduler<F | _F>
    self.tasks.push($Task.detached(fiber) as _F extends any ? Task<_F> : never)

    return self
  }

  readonly next = async (): Promise<
    IteratorResult<F extends any ? Task<F> : never, void>
  > => {
    if (this.tasks.length === 0) {
      return $Iterator.return()
    }

    if (this.attached.length === 0) {
      await Promise.all(this.tasks.map((task) => task.fiber.interrupt()))
    }

    const pointer = this.rotate()
    const task = this.tasks[pointer]
    switch (task.fiber.status[$Type.tag]) {
      case 'Idle':
        await task.fiber.start()

        return this.next()
      case 'Started':
      case 'Running':
        return this.next()
      case 'Suspended':
        return $Iterator.yield(task)
      case 'Interrupted':
      case 'Failed':
      case 'Terminated':
        this.remove(pointer)

        return $Iterator.yield(task)
    }
  };

  readonly [Symbol.asyncIterator] = () => this

  private get attached() {
    return this.tasks.filter($Task.isAttached)
  }

  private readonly rotate = () => this.pointer++ % this.tasks.length

  private readonly remove = (pointer: number) => {
    this.tasks.splice(pointer, 1)
    this.pointer--
  }
}

export function scheduler(): Scheduler<never>
export function scheduler<F extends Fiber<any, any>>(
  tasks: (F extends any ? Task<F> : never)[],
): Scheduler<F>
export function scheduler<F extends Fiber<any, any>>(
  tasks: (F extends any ? Task<F> : never)[] = [],
) {
  return Scheduler.create(tasks)
}

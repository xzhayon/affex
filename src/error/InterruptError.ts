import { FiberId } from '../fiber/FiberId'

export const InterruptErrorUri = Symbol('InterruptError')
export class InterruptError extends Error {
  readonly [InterruptErrorUri]!: typeof InterruptErrorUri
  readonly name: string = 'InterruptError'

  constructor(fiberId: FiberId) {
    super(`Fiber "${fiberId}" interrupted`)
  }
}

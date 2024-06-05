import { Id as FiberId } from '../fiber/Id'

export const InterruptErrorUri = Symbol('InterruptError')
export class InterruptError extends Error {
  readonly [InterruptErrorUri]!: typeof InterruptErrorUri
  readonly name: string = 'InterruptError'

  constructor(fiberId?: FiberId) {
    super(`Fiber${fiberId !== undefined ? ` "${fiberId}"` : ''} interrupted`)
  }
}

export function is(u: unknown): u is InterruptError {
  return u instanceof InterruptError
}

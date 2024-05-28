export const InterruptErrorUri = Symbol('InterruptError')
export class InterruptError extends Error {
  readonly [InterruptErrorUri]!: typeof InterruptErrorUri
  readonly name: string = 'InterruptError'

  constructor() {
    super('Fiber interrupted')
  }
}

export function is(u: unknown): u is InterruptError {
  return u instanceof InterruptError
}

export class FiberId {
  private static counter = 0
  private readonly id: number

  static readonly make = () => new FiberId()

  static readonly reset = () => {
    FiberId.counter = 0
  }

  private constructor() {
    this.id = FiberId.counter++
  }

  readonly toString = () => String(this.id)
}

export const id = FiberId.make

export const reset = FiberId.reset

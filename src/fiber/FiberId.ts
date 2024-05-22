export class FiberId {
  private static counter = 0
  private readonly id: number

  static readonly create = () => new FiberId()

  static readonly reset = () => {
    FiberId.counter = 0
  }

  private constructor() {
    this.id = FiberId.counter++
  }

  readonly toString = () => String(this.id)
}

export const id = FiberId.create

export const reset = FiberId.reset

export class Id {
  private static counter = 0
  private readonly id: number

  static readonly create = () => new Id()

  static readonly reset = () => {
    Id.counter = 0
  }

  private constructor() {
    this.id = Id.counter++
  }

  readonly toString = () => String(this.id)
}

export const id = Id.create

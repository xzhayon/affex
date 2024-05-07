export class Id {
  private static counter = 0
  private readonly id: number

  static readonly create = (parentId?: Id) => new Id(parentId)

  static readonly reset = () => {
    Id.counter = 0
  }

  private constructor(private readonly parentId?: Id) {
    this.id = Id.counter++
  }

  readonly [Symbol.toPrimitive] = (hint: 'default' | 'number' | 'string') => {
    return hint === 'string'
      ? this.parentId !== undefined
        ? `${this.parentId.id}.${this.id}`
        : `#${this.id}`
      : this.id
  }
}

export const id = Id.create

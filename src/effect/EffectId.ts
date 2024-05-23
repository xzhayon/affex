export class EffectId {
  private static counter = 0
  private readonly id: number

  static readonly make = () => new EffectId()

  static readonly reset = () => {
    EffectId.counter = 0
  }

  private constructor() {
    this.id = EffectId.counter++
  }

  readonly toString = () => String(this.id)
}

export const id = EffectId.make

export const reset = EffectId.reset

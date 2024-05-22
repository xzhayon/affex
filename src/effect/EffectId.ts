export class EffectId {
  private static counter = 0
  private readonly id: number

  static readonly create = () => new EffectId()

  static readonly reset = () => {
    EffectId.counter = 0
  }

  private constructor() {
    this.id = EffectId.counter++
  }

  readonly toString = () => String(this.id)
}

export const id = EffectId.create

export const reset = EffectId.reset

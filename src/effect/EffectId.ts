export type EffectId = number

let counter = 0

export function id(): EffectId {
  return counter++
}

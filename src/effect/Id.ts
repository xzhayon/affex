export type Id = number

let counter = 0

export function id(): Id {
  return counter++
}

export type FiberId = number

let counter = 0

export function id(): FiberId {
  return counter++
}

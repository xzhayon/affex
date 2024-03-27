export type Function<A extends any[] = any, B = any> = (...args: A) => B

export function is(u: unknown): u is Function<unknown[], unknown> {
  return typeof u === 'function'
}

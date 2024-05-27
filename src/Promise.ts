export function is(u: unknown): u is Promise<unknown> {
  return u instanceof Promise
}

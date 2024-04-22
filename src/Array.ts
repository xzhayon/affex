export function is(u: unknown): u is Array<unknown> {
  return u instanceof Array
}

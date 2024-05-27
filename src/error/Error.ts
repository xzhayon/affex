export function is(u: unknown): u is Error {
  return u instanceof Error
}

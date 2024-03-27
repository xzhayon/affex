export function is(u: unknown): u is string {
  return typeof u === 'string'
}

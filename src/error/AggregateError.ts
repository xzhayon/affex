export function is(u: unknown): u is AggregateError {
  return u instanceof AggregateError
}

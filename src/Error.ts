export function is(u: unknown): u is Error {
  return u instanceof Error
}

export function isAggregate(error: Error): error is AggregateError {
  return error instanceof AggregateError
}

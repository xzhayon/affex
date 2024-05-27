export function is(error: Error): error is AggregateError {
  return error instanceof AggregateError
}

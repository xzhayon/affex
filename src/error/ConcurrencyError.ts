export const ConcurrencyErrorUri = Symbol('ConcurrencyError')
export class ConcurrencyError extends AggregateError {
  readonly [ConcurrencyErrorUri]!: typeof ConcurrencyErrorUri
  readonly name: string = 'ConcurrencyError'
}

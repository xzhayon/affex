export type Struct = object

export function is(u: unknown): u is Struct {
  return u !== null && typeof u === 'object'
}

export function has<A extends Struct, K extends keyof any>(
  a: A,
  key: K,
): a is A & { [_K in K]: unknown } {
  return key in a
}

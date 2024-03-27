import * as F from './Function'
import * as S from './Struct'

export function is(u: unknown): u is Iterator<unknown> {
  return S.is(u) && S.has(u, 'next') && F.is(u.next)
}
